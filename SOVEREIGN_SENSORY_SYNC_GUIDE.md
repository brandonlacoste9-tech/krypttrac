# Sovereign Sensory Sync Integration Guide

## 🎯 Overview

The Sensory Sync system is now integrated at the root level with Sovereign tier gating, ensuring that only premium users experience the synchronized "Casino Adrenaline" feedback across all their devices.

## 🏗️ Architecture

### GlobalSensorySync Component
- **Location**: Root layout (`app/layout.tsx`)
- **Purpose**: Global sensory synchronization hub
- **Gating**: Only activates for Sovereign tier users
- **Features**:
  - Global radiance state management
  - Auto-reset timers for radiance states
  - Sovereign tier detection
  - Auth state monitoring

### Radiance Context
- **Provider**: `GlobalSensorySync`
- **Hook**: `useRadiance()`
- **Purpose**: Synchronize edge radiance across all `EdgeRadiance` components

### SensorySync Component
- **Location**: Inside `GlobalSensorySync` (Sovereign users only)
- **Purpose**: Listens to Realtime broadcasts
- **Integration**: Updates global radiance state

## 🎨 How It Works

### 1. Sovereign Tier Detection
```typescript
// Checks if user has 'sovereign' in add_ons array
const hasSovereignTier = addOns.includes('sovereign')
```

### 2. Global Radiance State
```typescript
// All EdgeRadiance components sync to this state
const { state, setState } = useRadiance()
```

### 3. Synchronized Updates
- Sensory event received → Updates global radiance state
- All `EdgeRadiance` components automatically update
- Auto-reset after timeout (2s active, 1s sentinel, 3s critical)

## 📱 Usage

### EdgeRadiance with Global Sync
```typescript
import EdgeRadiance from '@/components/EdgeRadiance'

// Automatically syncs to global radiance state
<EdgeRadiance>
  <div>Your content</div>
</EdgeRadiance>
```

### Manual Radiance Control
```typescript
import { useRadiance } from '@/components/GlobalSensorySync'

function MyComponent() {
  const { state, setState } = useRadiance()
  
  // Manually set radiance state
  setState('active')
}
```

### Sovereign Gate
```typescript
import SovereignGate from '@/components/SovereignGate'

<SovereignGate fallback={<UpgradePrompt />}>
  <PremiumFeature />
</SovereignGate>
```

## 🔄 Event Flow

```
1. High-Value Event (e.g., profitable trade)
   ↓
2. Sensory Event Broadcasted
   ↓
3. SensorySync Receives Broadcast (Sovereign users only)
   ↓
4. Global Radiance State Updated
   ↓
5. All EdgeRadiance Components Sync
   ↓
6. Haptic Feedback Triggered
   ↓
7. Auto-Reset After Timeout
```

## 🎯 Sovereign Tier Benefits

### Sensory Sync Features
- ✅ Synchronized haptic feedback across all devices
- ✅ Global edge radiance synchronization
- ✅ Sub-100ms broadcast latency
- ✅ Multi-device "Casino Adrenaline" experience

### Upgrade Path
- **Free Tier**: Basic haptics (local only)
- **Sovereign Tier**: Full sensory sync + global radiance

## 🛠️ Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key for client

### Stripe Price ID
- `NEXT_PUBLIC_SOVEREIGN_PRICE_ID` - $89.99/yr plan

## 📊 Radiance State Timings

| State | Duration | Use Case |
|-------|----------|----------|
| **active** | 2 seconds | Winning slot, profitable trade |
| **sentinel** | 1 second | AI signal, high-confidence alert |
| **critical** | 3 seconds | Security alert, vault lock |
| **idle** | Default | No active events |

## 🚀 Performance

- **Sovereign Check**: Cached in subscription store
- **Radiance Updates**: Context-based, minimal re-renders
- **Auto-Reset**: Efficient timeout management
- **Memory**: Minimal overhead, cleanup on unmount

## 🔧 Troubleshooting

### Sensory Sync Not Working
1. Check if user has Sovereign tier: `addOns.includes('sovereign')`
2. Verify Realtime connection: Check Supabase dashboard
3. Check browser console for errors
4. Verify Edge Function is deployed

### Radiance Not Syncing
1. Ensure `EdgeRadiance` is using global context
2. Check if `GlobalSensorySync` is in root layout
3. Verify `useRadiance()` hook is available

### Haptics Not Triggering
1. Check device support: `supportsHaptics()`
2. Verify haptics are enabled in `HapticProvider`
3. Check browser permissions

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-01-XX  
**Maintained By**: Krypto Trac Team
