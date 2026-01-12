# Krypto Trac Modular Monetization - Complete Setup Guide ✅

## Overview

Krypto Trac now implements a **$10/mo base plan** with modular add-ons ($5–$10/mo) using Stripe subscriptions. The system includes contextual gating, automatic webhook sync, and a customer portal for self-service subscription management.

---

## 🎯 Price IDs Configuration

### Stripe Products

| Feature | Price ID | Monthly Cost | Description |
|---------|----------|--------------|-------------|
| **Core Tracker** | `price_1SosoMCzqBvMqSYFVV3lCc3q` | $10 | Base tracking features |
| **DeFi Add-on** | `price_1SosoSCzqBvMqSYF14JyKIhx` | $10 | DeFi execution & staking |
| **Whale Watcher** | `price_1SosoYCzqBvMqSYFs8uIc3vZ` | $5 | Whale transaction alerts |
| **Magnum Pro** | `price_1SosofCzqBvMqSYFUqAE9Plr` | $10 | Advanced Magnum Opus integration |

**Note:** These Price IDs are stored in `lib/stripeConstants.ts` and automatically used throughout the app.

---

## 🔧 Architecture Components

### 1. Stripe Webhook Handler (`app/api/webhooks/stripe/route.ts`)

**Purpose:** Automatically syncs Stripe subscription events with Supabase user profiles.

**Events Handled:**
- `checkout.session.completed` - Adds feature to user's `add_ons` array
- `customer.subscription.created` - Initial subscription activation
- `customer.subscription.updated` - Subscription status changes
- `customer.subscription.deleted` - Removes feature from `add_ons` array

**Flow:**
```
Stripe Event → Webhook → Extract metadata (userId, feature) → Update Supabase profiles.add_ons → Done
```

### 2. FeatureGate Component (`components/FeatureGate.tsx`)

**Purpose:** Contextual gating with glassmorphism blur effect.

**Features:**
- Checks user's `add_ons` array from Zustand store
- Blurs locked content with customizable intensity
- Shows "Unlock Feature" overlay
- Triggers `UpgradeModal` on click

**Usage:**
```tsx
<FeatureGate feature="whale" blurIntensity="medium">
  <WhaleAlerts />
</FeatureGate>
```

### 3. UpgradeModal Component (`components/UpgradeModal.tsx`)

**Purpose:** Contextual upsell modal with feature highlights.

**Features:**
- Displays feature benefits and pricing
- Shows 7-day trial option (for Magnum/DeFi)
- Creates Stripe checkout session
- Redirects to Stripe payment page

**Special Highlight:**
- Magnum/DeFi features show "High-Yield Opportunity" badge with 700%+ APY messaging

### 4. Stripe Customer Portal (`app/api/portal/route.ts`)

**Purpose:** Self-service subscription management.

**Features:**
- Add/remove add-ons
- Update payment methods
- View billing history
- Cancel subscriptions

**Usage:**
```tsx
<ManageSubscription customerId={user.stripeCustomerId} />
```

---

## 🎨 User Experience Flow

### 1. **Discovery Flow**
```
User views news feed → Sees bullish sentiment → HighYieldButton appears → Clicks → UpgradeModal opens
```

### 2. **Purchase Flow**
```
UpgradeModal → Stripe Checkout → Payment → Webhook triggers → Supabase updated → Success notification → Feature unlocked
```

### 3. **Whale Alerts Flow**
```
User views WhaleAlerts → Content blurred → "Unlock for $5/mo" button → UpgradeModal → Purchase → Unblurred content
```

---

## 📦 Component Integration

### NewsFeed Integration
- **HighYieldButton** appears automatically on bullish news items
- Triggers `UpgradeModal` for Magnum Pro if DeFi add-on is not active
- Uses `FeatureGate` to show locked staking features

### WhaleAlerts Component
- Uses `FeatureGate` to blur sensitive data (amount, hash)
- Shows "Unlock Whale Data ($5/mo)" upsell
- Reveals full data after subscription

### Dashboard Integration
- **SuccessNotification** appears after successful checkout
- Automatically refreshes user profile on return from Stripe
- Shows feature name and activation confirmation

---

## 🔐 Security & Optimization

### Server-Side Only
- ✅ All Stripe API calls happen server-side (API routes)
- ✅ Webhook secret verification prevents unauthorized access
- ✅ API keys never exposed to client

### Cost Optimization
- ✅ Serverless API routes (pay-per-use)
- ✅ Cached subscription state (Zustand + localStorage)
- ✅ Minimal Supabase queries (only on webhook events)
- ✅ Efficient array operations for `add_ons`

### Data Consistency
- ✅ Webhook ensures Supabase stays in sync with Stripe
- ✅ Client-side store refreshed after checkout
- ✅ Idempotent webhook handlers prevent duplicate adds

---

## 🚀 Setup Checklist

### 1. Environment Variables
Ensure `.env.local` includes:
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Stripe Webhook Configuration
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret to `.env.local`

### 3. Supabase Migration
Ensure `profiles` table has `add_ons` column:
```sql
ALTER TABLE profiles ADD COLUMN add_ons TEXT[] DEFAULT '{}';
```

### 4. Stripe Products Setup
Verify all Price IDs in Stripe Dashboard match `lib/stripeConstants.ts`:
- Core Tracker: `price_1SosoMCzqBvMqSYFVV3lCc3q`
- DeFi Add-on: `price_1SosoSCzqBvMqSYF14JyKIhx`
- Whale Watcher: `price_1SosoYCzqBvMqSYFs8uIc3vZ`
- Magnum Pro: `price_1SosofCzqBvMqSYFUqAE9Plr`

---

## 🧪 Testing

### Test Checkout Flow
1. Click "Unlock Feature" on any gated content
2. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
3. Verify success notification appears
4. Check Supabase `profiles` table - `add_ons` should include the feature
5. Verify content is no longer blurred

### Test Webhook Sync
1. Create subscription manually in Stripe Dashboard
2. Add metadata: `userId` and `feature`
3. Trigger webhook via Stripe CLI or Dashboard
4. Verify Supabase profile updated

### Test Customer Portal
1. Ensure user has `stripeCustomerId` in profile
2. Click "Manage Subscription"
3. Verify portal opens in Stripe
4. Test adding/removing add-ons

---

## 📊 Monitoring

### Key Metrics to Track
- Webhook delivery success rate
- Checkout conversion rate
- Feature unlock rate
- Subscription churn rate

### Logging
- Webhook events logged to console
- Checkout errors logged with context
- Supabase update failures logged with user ID

---

## 🔄 Future Enhancements

1. **Colony OS Integration**
   - Client-side wallet signing for DeFi execution
   - Automated strategy recommendations

2. **Magnum Opus Deep Integration**
   - Direct staking flow from HighYieldButton
   - Real-time APY display
   - Yield calculation dashboard

3. **Analytics**
   - Track feature usage by subscription tier
   - A/B test pricing strategies
   - Conversion funnel analysis

4. **Trial Management**
   - Automatic trial-to-paid conversion
   - Trial expiration reminders
   - Trial usage analytics

---

## 📝 Notes

- All prices are in USD
- Subscriptions auto-renew monthly
- Cancellations take effect at end of billing period
- Refunds handled manually via Stripe Dashboard
- Customer portal requires Stripe Customer ID in user profile

---

**Status:** ✅ Production Ready

All components are implemented and integrated. The system is ready for production deployment once Stripe webhook is configured and environment variables are set.
