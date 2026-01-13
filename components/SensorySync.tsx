// ============================================
// Krypto Trac: Sensory Sync Component
// Synchronizes haptics and edge radiance across the app
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { subscribeToSensoryEvents, SensoryEvent } from '@/lib/sensory/sensory-sync'
import { triggerHaptic, HapticPattern } from '@/lib/haptics/casino-haptics'

interface SensorySyncProps {
  userId?: string
  onRadianceChange?: (state: 'idle' | 'active' | 'sentinel' | 'critical') => void
}

export default function SensorySync({ userId, onRadianceChange }: SensorySyncProps) {
  const [lastEvent, setLastEvent] = useState<SensoryEvent | null>(null)

  useEffect(() => {
    const channel = subscribeToSensoryEvents((event: SensoryEvent) => {
      setLastEvent(event)
      
      // Map event type to haptic pattern
      const hapticMap: Record<SensoryEvent['type'], HapticPattern> = {
        WINNING_SLOT: 'SUCCESS',
        SENTINEL_NUDGE: 'SENTINEL',
        VAULT_THUD: 'LOCKDOWN',
        TRADE_CLOSE: 'TRADE_CLOSE',
        SECURITY_ALERT: 'ALERT',
        SUCCESS: 'SUCCESS',
        CONFIRM: 'CONFIRM',
      }

      // Trigger haptic
      const pattern = hapticMap[event.type] || 'CONFIRM'
      triggerHaptic(pattern)

      // Update edge radiance state
      if (onRadianceChange) {
        switch (event.type) {
          case 'WINNING_SLOT':
          case 'TRADE_CLOSE':
          case 'SUCCESS':
            onRadianceChange('active')
            // Reset to idle after 2 seconds
            setTimeout(() => onRadianceChange?.('idle'), 2000)
            break
          case 'SENTINEL_NUDGE':
            onRadianceChange('sentinel')
            setTimeout(() => onRadianceChange?.('idle'), 1000)
            break
          case 'VAULT_THUD':
          case 'SECURITY_ALERT':
            onRadianceChange('critical')
            setTimeout(() => onRadianceChange?.('idle'), 3000)
            break
          default:
            onRadianceChange('idle')
        }
      }
    }, userId)

    return () => {
      channel.unsubscribe()
    }
  }, [userId, onRadianceChange])

  // This component doesn't render anything, it just syncs sensory events
  return null
}
