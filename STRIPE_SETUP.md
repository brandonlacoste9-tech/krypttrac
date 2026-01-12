# Stripe Configuration Setup

## Your Stripe Publishable Key (Already Configured)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51S6ND4CzqBvMqSYFwZYJrUszoHeo9HKmGfC19S1nGZF46wfaww1RgTD2D37dQUArrWcDZSwBeumudR9EFk1bP0Nx00f7AHiEQZ
```

## Complete .env.local File

Create a `.env.local` file in the root directory with these contents:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hiuemmkhwiaarpdyncgj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDgxNDAsImV4cCI6MjA4MDc4NDE0MH0.FRHPXLUx-okrpdVUnhBPZdagg4MCTvUDGowa0dsSMrQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwODE0MCwiZXhwIjoyMDgwNzg0MTQwfQ.-3y1gFjuhkamg5L6wMVIQWhCUy9SXU5cSWo7uNpQdbc

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51S6ND4CzqBvMqSYFwZYJrUszoHeo9HKmGfC19S1nGZF46wfaww1RgTD2D37dQUArrWcDZSwBeumudR9EFk1bP0Nx00f7AHiEQZ
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Price IDs (Create products in Stripe Dashboard first)
NEXT_PUBLIC_STRIPE_CORE_PRICE_ID=price_YOUR_CORE_PRICE_ID
NEXT_PUBLIC_STRIPE_DEFI_PRICE_ID=price_YOUR_DEFI_PRICE_ID
NEXT_PUBLIC_STRIPE_WHALE_PRICE_ID=price_YOUR_WHALE_PRICE_ID

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Still Need These Stripe Keys:

### 1. Stripe Secret Key
- Go to: https://dashboard.stripe.com/apikeys
- Copy your **Secret key** (starts with `sk_live_...`)
- Replace `STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE` in `.env.local`

### 2. Create Products & Get Price IDs

1. Go to: https://dashboard.stripe.com/products
2. Create three products:

   **Product 1: Core**
   - Name: "Krypto Trac Core"
   - Price: $10.00 USD
   - Billing: Monthly recurring
   - Copy the Price ID (starts with `price_...`)

   **Product 2: DeFi Add-on**
   - Name: "DeFi Staking Add-on"
   - Price: $10.00 USD  
   - Billing: Monthly recurring
   - Copy the Price ID

   **Product 3: Whale Alerts**
   - Name: "Whale Alerts"
   - Price: $5.00 USD
   - Billing: Monthly recurring
   - Copy the Price ID

3. Add Price IDs to `.env.local`

### 3. Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. For local testing, install Stripe CLI:
   ```bash
   # Windows (using Scoop)
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe
   
   # Then run:
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook secret (starts with `whsec_...`)
5. For production, create webhook at: `https://yourdomain.com/api/webhooks/stripe`
6. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Quick Setup Script

You can manually create `.env.local` or run this PowerShell command:

```powershell
@"
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hiuemmkhwiaarpdyncgj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDgxNDAsImV4cCI6MjA4MDc4NDE0MH0.FRHPXLUx-okrpdVUnhBPZdagg4MCTvUDGowa0dsSMrQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwODE0MCwiZXhwIjoyMDgwNzg0MTQwfQ.-3y1gFjuhkamg5L6wMVIQWhCUy9SXU5cSWo7uNpQdbc

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51S6ND4CzqBvMqSYFwZYJrUszoHeo9HKmGfC19S1nGZF46wfaww1RgTD2D37dQUArrWcDZSwBeumudR9EFk1bP0Nx00f7AHiEQZ
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_STRIPE_CORE_PRICE_ID=price_YOUR_CORE_PRICE_ID
NEXT_PUBLIC_STRIPE_DEFI_PRICE_ID=price_YOUR_DEFI_PRICE_ID
NEXT_PUBLIC_STRIPE_WHALE_PRICE_ID=price_YOUR_WHALE_PRICE_ID

NEXT_PUBLIC_APP_URL=http://localhost:3000
"@ | Out-File -FilePath .env.local -Encoding utf8
```

## Test Connection

Once you have all keys, test the Stripe connection:

```bash
npm run dev
```

Then visit: `http://localhost:3000/dashboard` and try upgrading to a feature. The checkout should work!
