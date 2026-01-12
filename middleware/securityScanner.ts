/**
 * Security Scanner Middleware
 * Verifies Ed25519 signatures and scans transactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySignedRequest, SignedRequest } from '@/lib/crypto/signature'
import { scanTransaction, SecurityAuditResult } from '@/lib/security/guardian'
import { supabaseAdmin } from '@/lib/supabase'

export interface SecurityContext {
  userId: string
  publicKey: string
  isVerified: boolean
  auditResult?: SecurityAuditResult
}

/**
 * Verify Ed25519 signature in request headers
 */
export async function verifyRequestSignature(
  request: NextRequest
): Promise<{ valid: boolean; context?: SecurityContext; error?: string }> {
  try {
    // Extract signed request from headers
    const signature = request.headers.get('x-signature')
    const publicKey = request.headers.get('x-public-key')
    const message = request.headers.get('x-message')
    const timestamp = request.headers.get('x-timestamp')
    const nonce = request.headers.get('x-nonce')

    if (!signature || !publicKey || !message || !timestamp || !nonce) {
      return {
        valid: false,
        error: 'Missing signature headers',
      }
    }

    const signedRequest: SignedRequest = {
      signature,
      publicKey,
      message,
      timestamp: parseInt(timestamp),
      nonce,
    }

    // Verify signature
    const verification = await verifySignedRequest(signedRequest, publicKey)
    if (!verification.valid) {
      return {
        valid: false,
        error: verification.error || 'Invalid signature',
      }
    }

    // Get user ID from public key (stored in Supabase)
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, public_key')
      .eq('public_key', publicKey)
      .single()

    if (error || !profile) {
      return {
        valid: false,
        error: 'User not found for public key',
      }
    }

    return {
      valid: true,
      context: {
        userId: profile.id,
        publicKey,
        isVerified: true,
      },
    }
  } catch (error: any) {
    console.error('Signature verification error:', error)
    return {
      valid: false,
      error: error.message || 'Verification failed',
    }
  }
}

/**
 * Scan transaction before execution
 */
export async function scanTransactionForSecurity(
  tx: any,
  securityContext: SecurityContext
): Promise<SecurityAuditResult> {
  const auditResult = await scanTransaction(tx)
  
  // If status is BLOCK, we should prevent execution
  if (auditResult.status === 'BLOCK') {
    console.warn(`Transaction blocked for user ${securityContext.userId}:`, auditResult.risks)
  }
  
  return auditResult
}

/**
 * Middleware wrapper that enforces signature verification
 */
export function withSecurityVerification(
  handler: (req: NextRequest, context: SecurityContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Verify signature
    const verification = await verifyRequestSignature(req)
    
    if (!verification.valid || !verification.context) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: verification.error || 'Invalid signature',
        },
        { status: 401 }
      )
    }

    // Execute handler with security context
    return handler(req, verification.context)
  }
}

/**
 * Combined middleware: Verify signature + Scan transaction
 */
export function withSecurityAndScanning(
  handler: (
    req: NextRequest,
    context: SecurityContext,
    auditResult: SecurityAuditResult
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Verify signature
    const verification = await verifyRequestSignature(req)
    
    if (!verification.valid || !verification.context) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: verification.error || 'Invalid signature',
        },
        { status: 401 }
      )
    }

    // Extract transaction from body
    const body = await req.json().catch(() => ({}))
    
    // Scan transaction if present
    let auditResult: SecurityAuditResult | undefined
    if (body.contractAddress || body.transaction) {
      auditResult = await scanTransactionForSecurity(
        body.transaction || body,
        verification.context
      )

      // Block if critical risk detected
      if (auditResult.status === 'BLOCK') {
        return NextResponse.json(
          {
            error: 'Transaction blocked',
            reason: 'Security scan detected critical risks',
            risks: auditResult.risks,
            recommendations: auditResult.recommendations,
          },
          { status: 403 }
        )
      }
    }

    // Execute handler with security context and audit result
    return handler(
      req,
      verification.context,
      auditResult || {
        status: 'SAFE',
        confidence: 100,
        risks: [],
        recommendations: [],
      }
    )
  }
}
