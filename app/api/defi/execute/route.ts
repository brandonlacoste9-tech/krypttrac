import { NextRequest, NextResponse } from 'next/server'
import { withSecurityAndScanning, SecurityContext } from '@/middleware/securityScanner'
import { SecurityAuditResult } from '@/lib/security/guardian'
import { createSafeErrorResponse } from '@/lib/errors'

/**
 * DeFi Execution API
 * Example of a secure endpoint using Fort Knox security
 * Requires Ed25519 signature + Security scan
 */
export const POST = withSecurityAndScanning(
  async (
    req: NextRequest,
    context: SecurityContext,
    auditResult: SecurityAuditResult
  ) => {
    try {
      const body = await req.json()
      const { transaction } = body

      // At this point:
      // 1. Signature is verified (Ed25519)
      // 2. Transaction is scanned (Vertex AI Guardian)
      // 3. User is authenticated (from public key)

      // If audit result is WARNING, log it but allow (user confirmed)
      if (auditResult.status === 'WARNING') {
        console.warn(`Warning transaction executed by user ${context.userId}:`, auditResult.risks)
      }

      // Execute transaction via Colony OS or your DeFi execution layer
      // TODO: Integrate with actual DeFi execution
      
      // Mock execution
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`

      return NextResponse.json({
        success: true,
        txHash: mockTxHash,
        userId: context.userId,
        auditStatus: auditResult.status,
        timestamp: new Date().toISOString(),
      })
    } catch (error: unknown) {
      // Log full error for debugging (server-side only)
      console.error('DeFi execution error:', error)
      
      // Return sanitized error to user
      const safeError = createSafeErrorResponse(error, 'defi', 'SENTINEL_EXECUTION_FAILED', true)
      return NextResponse.json(
        {
          success: false,
          ...safeError,
        },
        { status: 500 }
      )
    }
  }
)
