# Stripe Webhook & Supabase Sync Setup Guide

## Overview

This system automatically syncs Stripe subscription add-ons to Supabase profiles. When a user completes checkout, the webhook handler updates their profile, and the dashboard refreshes to unlock features immediately.

## Setup Steps

### 1. Run Supabase Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to SQL Editor
4. Copy and paste the contents of `supabase-migration.sql`
5. Run the migration

This will:
- Add `add_ons` column to `profiles` table
- Create helper functions for adding/removing add-ons
- Set up proper indexes and constraints

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://hiuemmkhwiaarpdyncgj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (configure these)
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL
```

### 3. Create Stripe Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL:
   - Development: Use Stripe CLI (see below)
   - Production: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Create Stripe Products & Prices

1. Go to Stripe Dashboard → Products
2. Create three products:
   - **Core** ($10/mo) → Copy Price ID
   - **DeFi Add-on** ($10/mo) → Copy Price ID
   - **Whale Alerts** ($5/mo) → Copy Price ID

3. Add Price IDs to environment variables:
```env
NEXT_PUBLIC_STRIPE_CORE_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_DEFI_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_WHALE_PRICE_ID=price_xxxxx
```

### 5. Test Locally with Stripe CLI

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (using Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

Login and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook secret starting with `whsec_`. Use this for local testing.

### 6. Testing the Flow

1. Start your dev server: `npm run dev`
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete a checkout
4. Check Supabase: Profile should have `add_ons` updated
5. Check dashboard: Should show success notification and unlock features

## How It Works

### Checkout Flow

1. User clicks "Upgrade to DeFi" → Creates Stripe checkout session
2. Session metadata includes `userId` and `feature`
3. User completes payment → Stripe redirects to `/dashboard?success=true&feature=defi`
4. Webhook receives `checkout.session.completed` event
5. Webhook updates Supabase: `add_ons = ['defi']`
6. Dashboard detects success param → Refreshes profile → Unlocks features

### Subscription Update Flow

1. User upgrades/downgrades subscription → Stripe sends `subscription.updated`
2. Webhook checks subscription status:
   - `active` or `trialing` → Add feature to `add_ons`
   - `canceled` or `past_due` → Remove feature from `add_ons`

### Cancellation Flow

1. User cancels subscription → Stripe sends `subscription.deleted`
2. Webhook removes feature from `add_ons` array
3. Dashboard refreshes → Features become locked again

## Troubleshooting

### Webhook not receiving events
- Check Stripe webhook endpoint is configured correctly
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook signature verification is working

### Profile not updating
- Verify service role key has correct permissions
- Check Supabase logs for errors
- Ensure user ID is in checkout session metadata

### Features not unlocking
- Check `refreshProfile()` is being called after checkout
- Verify Zustand store is being updated
- Check browser console for errors

## Security Notes

- Webhook handler verifies Stripe signatures on every request
- Service role key bypasses RLS (only used server-side)
- User IDs are validated before updating profiles
- All operations are idempotent (safe to retry)

## Next Steps

1. Add Stripe Customer Portal (let users manage subscriptions)
2. Add email notifications for subscription events
3. Add analytics tracking for subscription conversions
4. Implement usage limits based on add-ons
