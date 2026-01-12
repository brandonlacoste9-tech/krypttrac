# Krypto Trac - Deployment Guide 🚀

**Complete guide for deploying Krypto Trac to production (Vercel/Netlify)**

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup
- ✅ Run Supabase migrations in SQL Editor:
  - `supabase-migration.sql` (for `add_ons` column)
  - `supabase/migrations/fort_knox_security.sql` (for security features)
- ✅ Verify RLS policies are enabled
- ✅ Test database connection

### 2. Stripe Configuration
- ✅ Create all 4 products in Stripe Dashboard:
  - Core Tracker ($10/mo) - Price ID: `price_1SosoMCzqBvMqSYFVV3lCc3q`
  - DeFi Add-on ($10/mo) - Price ID: `price_1SosoSCzqBvMqSYF14JyKIhx`
  - Whale Watcher ($5/mo) - Price ID: `price_1SosoYCzqBvMqSYFs8uIc3vZ`
  - Magnum Pro ($10/mo) - Price ID: `price_1SosofCzqBvMqSYFUqAE9Plr`
- ✅ Configure Stripe Webhook endpoint
- ✅ Get Webhook Signing Secret

### 3. Google Cloud / Vertex AI
- ✅ Enable Vertex AI API
- ✅ Create API key with Vertex AI permissions
- ✅ Store API key securely

---

## 🔐 Environment Variables

### Required Environment Variables

Copy these from your local `.env.local` to your hosting dashboard (Vercel/Netlify):

#### **Stripe Configuration**
```env
# Stripe Keys (from Stripe Dashboard)
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51S6ND4CzqBvMqSYFwZYJrUszoHeo9HKmGfC19S1nGZF46wfaww1RgTD2D37dQUArrWcDZSwBeumudR9EFk1bP0Nx00f7AHiEQZ

# ⚠️ CRITICAL: Stripe Webhook Secret (from Stripe Dashboard → Webhooks → Signing Secret)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get `STRIPE_WEBHOOK_SECRET`:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint (or create one: `https://yourdomain.com/api/webhooks/stripe`)
3. Click "Reveal" next to "Signing secret"
4. Copy the secret (starts with `whsec_`)

---

#### **Supabase Configuration**
```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://hiuemmkhwiaarpdyncgj.supabase.co

# Supabase Anon Key (Public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDgxNDAsImV4cCI6MjA4MDc4NDE0MH0.FRHPXLUx-okrpdVUnhBPZdagg4MCTvUDGowa0dsSMrQ

# Supabase Service Role Key (Private - Server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwODE0MCwiZXhwIjoyMDgwNzg0MTQwfQ.-3y1gFjuhkamg5L6wMVIQWhCUy9SXU5cSWo7uNpQdbc
```

---

#### **Google Cloud / Vertex AI**
```env
# ⚠️ CRITICAL: Google Cloud API Key for Vertex AI Guardian
GOOGLE_CLOUD_API_KEY=AQ.Ab8RN6IB_CyfOEueG5cq3y_Nt3vPeMbHadYNLI4POn0vpwQlWg
```

**Note:** This key enables:
- Vertex AI Guardian (security scanning)
- Sentiment analysis
- Coin extraction
- AI-powered fraud detection

---

#### **Application Configuration**
```env
# Base URL for your application
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: Affiliate Configuration
NEXT_PUBLIC_AFFILIATE_BASE_URL=https://exchange.com/register
NEXT_PUBLIC_AFFILIATE_REF_CODE=KRYPTOTRAC
```

---

## 🚀 Deployment Steps

### For Vercel

1. **Connect Repository**
   ```bash
   # Install Vercel CLI (if not installed)
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Add Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from the list above
   - ⚠️ **Important:** Make sure `STRIPE_WEBHOOK_SECRET` and `GOOGLE_CLOUD_API_KEY` are added

3. **Configure Stripe Webhook**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://yourdomain.vercel.app/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the "Signing secret" and add it to Vercel as `STRIPE_WEBHOOK_SECRET`

4. **Redeploy**
   - After adding environment variables, trigger a new deployment
   - Go to Deployments → Click "Redeploy"

---

### For Netlify

1. **Connect Repository**
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Connect your repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Add Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all variables from the list above
   - ⚠️ **Important:** Make sure `STRIPE_WEBHOOK_SECRET` and `GOOGLE_CLOUD_API_KEY` are added

4. **Configure Stripe Webhook**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://yourdomain.netlify.app/api/webhooks/stripe`
   - Select events (same as Vercel)
   - Copy the "Signing secret" and add it to Netlify as `STRIPE_WEBHOOK_SECRET`

---

## ✅ Post-Deployment Verification

### 1. Test Stripe Webhook
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local testing
stripe listen --forward-to https://yourdomain.com/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

### 2. Test Vertex AI Integration
- Navigate to news feed
- Verify sentiment analysis works
- Check security scanning on HighYieldButton

### 3. Test Subscription Flow
1. Click "Unlock Feature" on any gated content
2. Complete Stripe checkout with test card: `4242 4242 4242 4242`
3. Verify webhook syncs to Supabase
4. Check that feature unlocks in UI

### 4. Test Customer Portal
1. Go to Settings page
2. Click "Manage Subscription"
3. Verify Stripe Customer Portal opens

---

## 🔒 Security Checklist

- ✅ All secrets stored in environment variables (never in code)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is server-side only
- ✅ Stripe webhook signature verification enabled
- ✅ RLS policies enabled on Supabase tables
- ✅ CORS configured correctly
- ✅ API routes protected (Ed25519 signatures on `/api/defi/*`)

---

## 📊 Monitoring & Logging

### Recommended Tools
- **Vercel Analytics:** Built-in performance monitoring
- **Stripe Dashboard:** Monitor subscriptions and webhooks
- **Supabase Logs:** Database query performance
- **Sentry (Optional):** Error tracking

### Key Metrics to Monitor
- Stripe webhook success rate
- Vertex AI API response times
- Supabase query performance
- User subscription conversions

---

## 🐛 Troubleshooting

### Webhook Not Firing
1. Check webhook endpoint URL in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check Vercel/Netlify function logs
4. Test with Stripe CLI

### Vertex AI Not Working
1. Verify `GOOGLE_CLOUD_API_KEY` is set
2. Check API key permissions in Google Cloud Console
3. Verify Vertex AI API is enabled
4. Check function logs for errors

### Supabase Connection Issues
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` is set (server-side)
3. Verify RLS policies allow access
4. Check Supabase dashboard for errors

---

## 🎯 Production Checklist

Before going live:
- [ ] All environment variables set in hosting dashboard
- [ ] Stripe webhook configured and tested
- [ ] Database migrations run
- [ ] Test subscription flow end-to-end
- [ ] Test Vertex AI Guardian security scanning
- [ ] Test Customer Portal access
- [ ] Enable Stripe Live Mode (switch from test keys)
- [ ] Update Price IDs if using live mode (they change)
- [ ] Set up monitoring and alerts
- [ ] Review and enable RLS policies
- [ ] Test on mobile devices
- [ ] Verify all payment flows work

---

## 📞 Support

If you encounter issues:
1. Check deployment logs in Vercel/Netlify dashboard
2. Review Stripe webhook logs
3. Check Supabase logs for database errors
4. Verify all environment variables are set correctly

---

**Last Updated:** 2026-01-15  
**Version:** 1.0.0
