# Haptic & Edge Radiance Guide - Krypto Trac

## 🎯 Overview

The refined sensory experience system combines subtle haptic feedback with edge radiance lighting to create a luxury, non-flashy interface that feels like a private casino lounge.

## 🎨 Design Philosophy

### Refined vs. Flashy

| Feature | Flashy (Avoid) | Refined (2026 Crypto) |
|---------|---------------|----------------------|
| **Animation** | Rapid spinning / Rainbows | Slow, almost imperceptible "breathing" |
| **Vibration** | Constant, harsh buzz | Precise, multi-frequency "taps" |
| **Borders** | Thick gradients | Hairline (1px) borders with soft opacity |
| **Psychology** | Distraction | Dopamine-driven reward signals |

## 🎮 Haptic Patterns

### Pattern Types

1. **SUCCESS** - Winning Slot Heartbeat
   - Pattern: `[20ms, 40ms, 20ms]`
   - Use: Profitable trade completion
   - Feel: Quick double-tap celebration

2. **SENTINEL** - AI Signal Nudge
   - Pattern: `[15ms]`
   - Use: High-confidence AI signals
   - Feel: Ultra-soft tick on wrist

3. **LOCKDOWN** - Vault Door Thud
   - Pattern: `[50ms, 20ms, 10ms]`
   - Use: Vault lock, panic button
   - Feel: Descending heavy pulse

4. **TRADE_CLOSE** - Profitable Trade
   - Pattern: `[20ms, 50ms, 20ms, 30ms]`
   - Use: Auto-Pilot closes profitable position
   - Feel: Extended success heartbeat

5. **ALERT** - Security Alert
   - Pattern: `[20ms, 30ms, 20ms]`
   - Use: Security events
   - Feel: Double nudge warning

6. **CONFIRM** - Action Confirmation
   - Pattern: `[10ms]`
   - Use: Button clicks, toggles
   - Feel: Single soft tap

### Usage

```typescript
import { useHaptics } from '@/components/HapticProvider'

function MyComponent() {
  const haptics = useHaptics()
  
  // Trigger haptic on action
  const handleClick = () => {
    haptics.events.success()
    // ... your logic
  }
}
```

## 💡 Edge Radiance

### States

1. **idle** - 10% intensity, low-saturation gold
   - Default state when menu is closed
   - Subtle, almost imperceptible

2. **active** - 60% intensity, Magnum Gold
   - Menu is open, user is active
   - Steady glow, no animation

3. **sentinel** - 40% intensity, gold pulse
   - AI signals detected
   - Subtle pulsing animation

4. **critical** - 80% intensity, red pulsing
   - Security threats detected
   - Low-frequency pulsing (emergency casino lockdown feel)

### Top-Down Lighting

- **Brightest at top edge** - Creates 3D depth
- **Fades toward bottom** - Natural lighting falloff
- **Side edge glow** - Subtle side lighting at 50% opacity

### Usage

```typescript
import EdgeRadiance from '@/components/EdgeRadiance'

function MyComponent() {
  const [state, setState] = useState<'idle' | 'active' | 'sentinel' | 'critical'>('idle')
  
  return (
    <EdgeRadiance state={state}>
      <div className="your-content">
        {/* Content with subtle edge glow */}
      </div>
    </EdgeRadiance>
  )
}
```

## 🔄 Realtime Integration

### Auto-Triggered Haptics

The `HapticProvider` automatically subscribes to:

1. **Profitable Trades** - Triggers `TRADE_CLOSE` pattern
2. **Sentinel Signals** - Triggers `SENTINEL` pattern on high-confidence AI signals
3. **Security Alerts** - Triggers `ALERT` pattern on critical events
4. **Vault Lock** - Triggers `LOCKDOWN` pattern

### Manual Triggers

```typescript
const haptics = useHaptics()

// Manual trigger
haptics.trigger('SUCCESS')

// Or use event helpers
haptics.events.success()
haptics.events.sentinelSignal()
haptics.events.vaultLocked()
```

## 🎯 Integration Points

### WalletMenu
- Edge radiance changes based on security status
- Haptics on vault toggle, panic button
- Real-time updates from Realtime subscriptions

### AutoPilotToggle
- Haptics on profitable trade completion
- Edge radiance on active state
- "Winning Slot" heartbeat pattern

### PanicButton
- "Vault Thud" pattern on activation
- Critical edge radiance state

## 🛠️ Setup

### 1. Wrap App with HapticProvider

```typescript
// app/layout.tsx
import { HapticProvider } from '@/components/HapticProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <HapticProvider userId={user?.id}>
          {children}
        </HapticProvider>
      </body>
    </html>
  )
}
```

### 2. Use in Components

```typescript
import { useHaptics } from '@/components/HapticProvider'
import EdgeRadiance from '@/components/EdgeRadiance'

function MyComponent() {
  const haptics = useHaptics()
  
  return (
    <EdgeRadiance state="active">
      <button onClick={() => haptics.events.success()}>
        Click Me
      </button>
    </EdgeRadiance>
  )
}
```

## 📱 Device Support

### Haptic Feedback
- **Supported**: iOS Safari, Chrome Android, Edge Android
- **Fallback**: Gracefully degrades if unsupported
- **Check**: `supportsHaptics()` function

### Edge Radiance
- **Supported**: All modern browsers
- **Fallback**: Subtle opacity if animations disabled
- **Performance**: CSS-only, hardware accelerated

## 🎨 Customization

### Custom Haptic Pattern

```typescript
import { triggerCustomHaptic } from '@/lib/haptics/casino-haptics'

// Custom pattern: [on, off, on, off, ...] in milliseconds
triggerCustomHaptic([30, 20, 30, 20, 50])
```

### Custom Radiance Intensity

```typescript
<EdgeRadiance state="active" intensity={75}>
  {/* 75% intensity instead of default 60% */}
</EdgeRadiance>
```

## 🚀 Performance

- **Haptics**: Non-blocking, async execution
- **Radiance**: CSS-only animations, GPU accelerated
- **Realtime**: Efficient subscriptions, auto-cleanup
- **Memory**: Minimal overhead, context-based

## 📚 Best Practices

1. **Use sparingly** - Haptics should feel special, not constant
2. **Match intensity** - Critical events = stronger haptics
3. **State consistency** - Edge radiance should match UI state
4. **User preference** - Allow users to disable haptics
5. **Test on devices** - Haptics feel different on different devices

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-01-XX  
**Maintained By**: Krypto Trac Team
