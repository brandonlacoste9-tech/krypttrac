import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { priceId, feature, trial } = await request.json()

    // Get user ID from session/cookie/auth
    // In production, get from authenticated session
    const userId = request.headers.get('x-user-id') || request.cookies.get('user_id')?.value || 'guest'
    const userEmail = request.headers.get('x-user-email') || undefined

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    const validFeatures = ['core', 'defi', 'whale', 'magnum']
    if (!validFeatures.includes(feature)) {
      return NextResponse.json(
        { error: 'Invalid feature' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: userId.toString(),
          feature: feature,
        },
        ...(trial && trial > 0 ? {
          trial_period_days: trial,
        } : {}),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true&feature=${feature}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
      metadata: {
        userId: userId.toString(),
        feature: feature,
      },
      customer_email: userEmail,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error: unknown) {
    // Log full error for debugging (server-side only)
    console.error('Stripe checkout error:', error)
    
    // Return sanitized error to user
    const safeError = createSafeErrorResponse(error, 'checkout', 'FORT_KNOX_PAYMENT_FAILED', true)
    return NextResponse.json(safeError, { status: 500 })
  }
}
