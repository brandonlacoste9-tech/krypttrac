// ============================================
// Krypto Trac: Panic Button API Route
// Proxy route for panic button activation
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { validateInput, panicButtonSchema } from '@/lib/validation/schemas'
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limiter'
import { createSafeErrorResponse } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = validateInput(panicButtonSchema, body)
    
    // Rate limiting (strict for panic button)
    const rateLimit = checkRateLimit(validated.user_id, RATE_LIMITS.PANIC_BUTTON)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Panic button rate limit exceeded. Please wait before trying again.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
        }
      )
    }
    
    // Call Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const response = await fetch(`${supabaseUrl}/functions/v1/panic-button`, {
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
    return createSafeErrorResponse(error, 'Failed to activate panic button')
  }
}
