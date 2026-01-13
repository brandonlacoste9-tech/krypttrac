import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout - add feature to user's add_ons
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const feature = session.metadata?.feature

  if (!userId || !feature) {
    console.error('Missing userId or feature in checkout session metadata')
    return
  }

  // Validate feature is one of our add-ons
  const validFeatures = ['core', 'defi', 'whale', 'magnum']
  if (!validFeatures.includes(feature)) {
    console.error(`Invalid feature: ${feature}`)
    return
  }

  try {
    // Check if user already has this add-on (idempotency)
    // Note: userId from Stripe metadata is auth.users.id, which maps to profiles.user_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('add_ons')
      .eq('user_id', userId)
      .single()

    if (profile && profile.add_ons?.includes(feature)) {
      console.log(`User ${userId} already has add-on ${feature}`)
      return
    }

    // Add feature to add_ons array using PostgreSQL function
    // p_user_id expects auth.users.id (which is what userId is from Stripe metadata)
    const { error } = await supabaseAdmin.rpc('add_user_addon', {
      p_user_id: userId,
      p_addon_name: feature,
    })

    // If RPC doesn't exist, use direct SQL
    if (error && (error.message.includes('function') || error.message.includes('does not exist'))) {
      const currentAddOns = profile?.add_ons || []
      const updatedAddOns = currentAddOns.includes(feature) 
        ? currentAddOns 
        : [...currentAddOns, feature]

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          add_ons: updatedAddOns,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) {
        throw updateError
      }
    } else if (error) {
      throw error
    }

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    console.log(`Added ${feature} add-on to user ${userId}`)
  } catch (error: any) {
    console.error('Failed to handle checkout session completed:', error)
    throw error
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const feature = subscription.metadata?.feature

  if (!userId || !feature) {
    console.error('Missing userId or feature in subscription metadata')
    return
  }

  // Add feature when subscription is created
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await handleCheckoutSessionCompleted({
      metadata: { userId, feature },
    } as Stripe.Checkout.Session)
  }
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const feature = subscription.metadata?.feature

  if (!userId || !feature) {
    console.error('Missing userId or feature in subscription metadata')
    return
  }

  // If subscription is active/trialing, ensure feature is in add_ons
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await handleCheckoutSessionCompleted({
      metadata: { userId, feature },
    } as Stripe.Checkout.Session)
  } 
  // If subscription is canceled/past_due/unpaid, remove feature
  else if (subscription.status === 'canceled' || 
           subscription.status === 'past_due' || 
           subscription.status === 'unpaid') {
    await handleSubscriptionDeleted(subscription)
  }
}

/**
 * Handle subscription cancellation - remove feature from user's add_ons
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const feature = subscription.metadata?.feature

  if (!userId || !feature) {
    console.error('Missing userId or feature in subscription metadata')
    return
  }

  try {
    // Get current add_ons
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('add_ons')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      console.error(`Profile not found for user ${userId}`)
      return
    }

    // Remove feature from add_ons array using RPC function
    const { error: rpcError } = await supabaseAdmin.rpc('remove_user_addon', {
      p_user_id: userId,
      p_addon_name: feature,
    })

    // If RPC doesn't exist, use direct SQL
    if (rpcError && (rpcError.message.includes('function') || rpcError.message.includes('does not exist'))) {
      const currentAddOns = profile.add_ons || []
      const updatedAddOns = currentAddOns.filter((addon: string) => addon !== feature)

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          add_ons: updatedAddOns,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) {
        throw updateError
      }
    } else if (rpcError) {
      throw rpcError
    }

    if (error) {
      console.error('Error removing add-on from profile:', error)
      throw error
    }

    console.log(`Removed ${feature} add-on from user ${userId}`)
  } catch (error: any) {
    console.error('Failed to handle subscription deleted:', error)
    throw error
  }
}
