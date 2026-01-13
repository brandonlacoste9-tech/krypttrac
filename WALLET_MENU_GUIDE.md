# Sentinel Command Center Wallet Menu Guide

## 🎯 Overview

The Wallet Menu is a luxury "Sentinel Command Center" that integrates all Krypto Trac features into a single, high-performance interface with real-time security monitoring and monetization triggers.

## 🏗️ Architecture

### Zone 1: Sentinel Status (Top)
- **Live Integrity Meter**: Real-time 1-100% security score
- **Vault Lockdown Toggle**: Gold-embossed switch for instant security
- **Threat Counter**: Active threat display

### Zone 2: Asset Management (Middle)
- **Multi-Chain View**: Ethereum, Solana, Polygon, Arbitrum, Base, Optimism
- **NFT Gallery**: CDN-cached assets for instant loading
- **Add Wallet**: SIWE connection with metered billing

### Zone 3: Monetization & AI Add-ons
- **Auto-Pilot Toggle**: One-click automated rebalancing
- **Alpha Feed**: Verified AI predictions with blockchain proof
- **Sovereign Upgrade**: $89.99/yr premium tier

### Zone 4: System Logs (Bottom)
- **Protocol Audit**: Real-time security event feed
- **Attack Blocked**: Critical threat notifications
- **Scrollable Logs**: Latest security scans

## 🎨 Design System

### Leather & Gold Theme
- **Background**: Deep charcoal (#1a1814) with leather texture
- **Accents**: Gold (#f4c025) for premium elements
- **Borders**: Gold with 20% opacity
- **Text**: Yellow-400 for highlights, gray-400 for secondary

### Visual States
- **Secure**: Green integrity meter
- **Warning**: Yellow integrity meter
- **Critical**: Red integrity meter + pulsing border

## 📱 Features

### Real-Time Security Monitoring
- Sub-100ms updates via Realtime
- Automatic threat detection
- Visual feedback on critical events
- Panic button integration

### Multi-Chain Support
- Unified wallet view across all chains
- Network switching with one click
- Balance aggregation
- Transaction history

### Monetization Triggers
- **Sovereign Upgrade**: $89.99/yr checkout
- **Wallet Slots**: $2/mo per additional wallet
- **Auto-Pilot**: Performance fee tracking
- **Alpha Feed**: Subscription gating

## 🛠️ Setup Instructions

### Step 1: Create Wallet Slots Table

```sql
\i supabase/migrations/create_wallet_slots_table.sql
```

### Step 2: Add to Dashboard

```typescript
import WalletMenu from '@/components/WalletMenu'

function Dashboard() {
  const { user } = useAuth()
  
  return (
    <div>
      {/* Your dashboard content */}
      <WalletMenu userId={user.id} />
    </div>
  )
}
```

### Step 3: Configure Stripe Price IDs

Set environment variables:
- `NEXT_PUBLIC_SOVEREIGN_PRICE_ID` - $89.99/yr plan
- `NEXT_PUBLIC_WALLET_SLOT_PRICE_ID` - $2/mo per slot

## 📊 Real-Time Updates

### Security Score Calculation
```typescript
// Calculated from recent security events
Score = 100 - (critical*50 + high*20 + medium*10)
Status: 
  - < 30 = Critical (red)
  - < 70 = Warning (yellow)
  - >= 70 = Secure (green)
```

### Realtime Subscriptions
- Security events (INSERT on security_events)
- Lockdown status (broadcast on user channel)
- Breakout signals (broadcast on momentum_signals)
- Revenue updates (broadcast on revenue_updates)

## 🎯 Monetization Integration

### Sovereign Upgrade ($89.99/yr)
- Includes: Unlimited wallet slots, Alpha Feed access, Priority support
- Trigger: Button click → Stripe checkout
- Webhook: Updates `add_ons` array with 'sovereign'

### Wallet Slots ($2/mo per slot)
- Free tier: 1 wallet slot
- Additional slots: $2/mo each
- Trigger: Add wallet → Check if free slot available → Checkout if needed
- Webhook: Records revenue transaction

### Auto-Pilot
- Performance fee: 0.1% of profits
- Trigger: LP rebalancing generates profit
- Revenue: Recorded automatically

## 🔐 Security Features

### Vault Lockdown Toggle
- Instant API key revocation
- Session termination
- Vault cache clearing
- Requires MFA to unlock

### Threat Detection
- Real-time monitoring
- Automatic lockdown on critical events
- Visual alerts
- Protocol audit logs

## 📱 User Experience

### Thumb-Zone Navigation
- Critical actions accessible with one hand
- Swipe gestures for network switching
- Haptic feedback on interactions
- Smooth animations

### Visual Feedback
- Pulsing border on critical threats
- Color-coded security status
- Real-time integrity meter
- Live protocol audit feed

## 🚀 Performance

- **Sub-100ms Updates**: Realtime subscriptions
- **CDN Caching**: NFT assets served via edge
- **Lazy Loading**: Components load on demand
- **Optimized Queries**: Indexed database lookups

## 📚 Integration Points

### Existing Features
- ✅ Sentinel Security System
- ✅ Momentum Breakout Detection
- ✅ Revenue Tracking
- ✅ Multi-Chain Wrappers
- ✅ Storage CDN
- ✅ Alpha Feed (Proof of Alpha)

### New Features
- ✅ Wallet Slots Management
- ✅ Multi-Chain Wallet View
- ✅ Unified Command Center UI

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-01-XX  
**Maintained By**: Krypto Trac Team
