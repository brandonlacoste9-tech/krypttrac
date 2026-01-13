// ============================================
// Krypto Trac: Sensory Event Trigger API Route
// Proxy route for triggering sensory events
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { validateInput, sensoryEventSchema } from '@/lib/validation/schemas'
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limiter'
import { createSafeErrorResponse } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = validateInput(sensoryEventSchema, body)
    
    // Rate limiting
    const identifier = validated.user_id || request.ip || 'anonymous'
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.SENSORY_EVENT)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
        }
      )
    }
    
    // Call Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const response = await fetch(`${supabaseUrl}/functions/v1/trigger-sensory-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(body),
    })
    
    const result = await response.json()
    
    return NextResponse.json(
      result,
      {
        status: response.status,
        headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
      }
    )
  } catch (error: any) {
    return createSafeErrorResponse(error, 'Failed to trigger sensory event')
  }
}
