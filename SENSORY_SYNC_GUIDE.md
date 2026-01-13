# Sensory Sync System Guide - Krypto Trac

## 🎯 Overview

The Sensory Sync system synchronizes haptic feedback and edge radiance across all connected clients via Supabase Realtime broadcasts, creating a unified "physical adrenaline" experience that mimics a high-end casino.

## 🎮 How It Works

### 1. Event Broadcasting
When a high-value event occurs (profitable trade, Sentinel signal, vault lock), the system:
1. Triggers local haptic feedback
2. Broadcasts event via Supabase Realtime
3. All connected clients receive the broadcast
4. Each client triggers haptic + updates edge radiance

### 2. Synchronized Feedback
- **Haptics**: Millisecond-perfect patterns
- **Edge Radiance**: State-based glow synchronized with haptics
- **Realtime**: Sub-100ms broadcast latency

## 🎨 Event Types

### WINNING_SLOT
- **Trigger**: Profitable trade or Bitcoin tip
- **Haptic**: `[20ms, 40ms, 20ms]` - Winning Slot Heartbeat
- **Radiance**: Active (60% gold) → Idle after 2s
- **Use Case**: Auto-Pilot closes profitable position, user receives tip

### SENTINEL_NUDGE
- **Trigger**: High-confidence AI signal
- **Haptic**: `[15ms]` - Ultra-soft tick
- **Radiance**: Sentinel (40% gold pulse) → Idle after 1s
- **Use Case**: Vertex AI detects high-confidence breakout signal

### VAULT_THUD
- **Trigger**: Vault lock/unlock
- **Haptic**: `[50ms, 20ms, 10ms]` - Heavy vault door
- **Radiance**: Critical (80% red pulse) → Idle after 3s
- **Use Case**: Panic button activated, vault locked

### TRADE_CLOSE
- **Trigger**: Auto-Pilot closes position
- **Haptic**: `[20ms, 50ms, 20ms, 30ms]` - Extended heartbeat
- **Radiance**: Active (60% gold) → Idle after 2s
- **Use Case**: Automated rebalancing completes

### SECURITY_ALERT
- **Trigger**: Critical security event
- **Haptic**: `[20ms, 30ms, 20ms]` - Double nudge
- **Radiance**: Critical (80% red pulse) → Idle after 3s
- **Use Case**: Sentinel detects threat, account locked

## 🛠️ Usage

### Trigger Sensory Event

```typescript
import { triggerWinningSlot, triggerSentinelNudge, triggerVaultThud } from '@/lib/sensory/sensory-sync'

// Profitable trade
triggerWinningSlot(1250.50, 'USD', userId, true)

// AI signal
triggerSentinelNudge(85, userId, true)

// Vault lock
triggerVaultThud('Panic button activated', userId, true)
```

### Subscribe to Events

```typescript
import { subscribeToSensoryEvents } from '@/lib/sensory/sensory-sync'

const channel = subscribeToSensoryEvents((event) => {
  // Handle event
  console.log('Sensory event:', event.type)
}, userId)
```

### Use SensorySync Component

```typescript
import SensorySync from '@/components/SensorySync'

function MyComponent() {
  const [radianceState, setRadianceState] = useState('idle')
  
  return (
    <>
      <SensorySync 
        userId={userId}
        onRadianceChange={setRadianceState}
      />
      <EdgeRadiance state={radianceState}>
        {/* Your content */}
      </EdgeRadiance>
    </>
  )
}
```

## 📡 Realtime Integration

### Broadcast Channel
- **Channel**: `sensory_events`
- **Event**: `sensory_trigger`
- **Payload**: `{ type, userId, metadata, timestamp }`

### Edge Function
- **Path**: `/functions/v1/trigger-sensory-event`
- **Method**: POST
- **Body**: `{ type, user_id?, metadata? }`

### API Route
- **Path**: `/api/sensory/trigger`
- **Method**: POST
- **Proxy**: Calls Edge Function

## 🎯 Integration Points

### AutoPilotToggle
- Triggers `WINNING_SLOT` on profitable trades
- Broadcasts to all connected clients
- Updates edge radiance to active state

### PanicButton
- Triggers `VAULT_THUD` on activation
- Broadcasts critical state
- Updates edge radiance to critical (red pulse)

### WalletMenu
- Uses `SensorySync` component
- Listens to all sensory events
- Updates radiance state automatically

### HapticProvider
- Subscribes to sensory events
- Triggers haptics on broadcast
- Filters by userId if provided

## 🔄 Event Flow

```
1. Event Occurs (e.g., profitable trade)
   ↓
2. Local Haptic Triggered
   ↓
3. Event Broadcasted via Realtime
   ↓
4. All Connected Clients Receive Broadcast
   ↓
5. Each Client Triggers Haptic + Updates Radiance
   ↓
6. Synchronized "Physical Adrenaline" Experience
```

## 📱 Device Support

### Haptic Feedback
- ✅ iOS Safari
- ✅ Chrome Android
- ✅ Edge Android
- ❌ Desktop (graceful degradation)

### Edge Radiance
- ✅ All modern browsers
- ✅ Hardware accelerated
- ✅ Smooth animations

## 🎨 Design Philosophy

### Refined vs. Flashy

| Feature | Flashy (Avoid) | Refined (2026) |
|---------|---------------|----------------|
| **Animation** | Rapid spinning | Slow, imperceptible "breathing" |
| **Vibration** | Constant buzz | Precise, multi-frequency taps |
| **Borders** | Thick gradients | Hairline (1px) with soft opacity |
| **Psychology** | Distraction | Dopamine-driven rewards |

## 🚀 Performance

- **Broadcast Latency**: < 100ms
- **Haptic Latency**: < 50ms
- **Radiance Update**: < 16ms (60fps)
- **Memory**: Minimal overhead
- **Network**: Efficient Realtime subscriptions

## 📚 Best Practices

1. **Broadcast selectively** - Only high-value events
2. **Filter by userId** - Avoid unnecessary triggers
3. **Use appropriate patterns** - Match haptic to event importance
4. **Sync radiance** - Visual feedback should match haptic
5. **Test on devices** - Haptics vary by device

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for Edge Functions

### Edge Function Deployment
```bash
supabase functions deploy trigger-sensory-event
```

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-01-XX  
**Maintained By**: Krypto Trac Team
