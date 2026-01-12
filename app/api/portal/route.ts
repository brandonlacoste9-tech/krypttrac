import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSafeErrorResponse } from '@/lib/errors'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

/**
 * Stripe Customer Portal
 * Allows users to manage their subscriptions (add/remove add-ons, update payment methods, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const { customerId, returnUrl } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Create a Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    // Log full error for debugging (server-side only)
    console.error('Stripe portal error:', error)
    
    // Return sanitized error to user
    const safeError = createSafeErrorResponse(error, 'portal', 'FORT_KNOX_SUBSCRIPTION_FAILED', true)
    return NextResponse.json(safeError, { status: 500 })
  }
}

/**
 * Alternative GET endpoint for portal creation
 * Requires customerId as query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const returnUrl = searchParams.get('returnUrl')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required as query parameter' },
        { status: 400 }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    // Log full error for debugging (server-side only)
    console.error('Stripe portal error:', error)
    
    // Return sanitized error to user
    const safeError = createSafeErrorResponse(error, 'portal', 'FORT_KNOX_SUBSCRIPTION_FAILED', true)
    return NextResponse.json(safeError, { status: 500 })
  }
}
