// ============================================
// Krypto Trac: Haptic Provider Context
// Manages haptic feedback across the app
// ============================================

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { HapticEvents, triggerHaptic, HapticPattern, supportsHaptics } from '@/lib/haptics/casino-haptics'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface HapticContextType {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  trigger: (pattern: HapticPattern) => void
  events: typeof HapticEvents
}

const HapticContext = createContext<HapticContextType | null>(null)

export function useHaptics() {
  const context = useContext(HapticContext)
  if (!context) {
    throw new Error('useHaptics must be used within HapticProvider')
  }
  return context
}

interface HapticProviderProps {
  userId?: string
  children: React.ReactNode
}

export function HapticProvider({ userId, children }: HapticProviderProps) {
  const [enabled, setEnabled] = useState(true)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported(supportsHaptics())
  }, [])

  useEffect(() => {
    if (!userId || !enabled || !isSupported) return

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Subscribe to profitable trade events
    const tradeChannel = supabase
      .channel('haptic_trades')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: userId ? `user_id=eq.${userId}` : undefined,
      }, (payload) => {
        const transaction = payload.new as any
        // If profitable trade, trigger success haptic
        if (transaction.profit_usd > 0) {
          HapticEvents.profitableTrade()
        }
      })
      .subscribe()

    // Subscribe to Sentinel AI signals
    const sentinelChannel = supabase
      .channel('haptic_sentinel')
      .on('broadcast', { event: 'high_confidence_signal' }, () => {
        HapticEvents.sentinelSignal()
      })
      .subscribe()

    // Subscribe to security alerts
    const securityChannel = supabase
      .channel('haptic_security')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_events',
        filter: userId ? `user_id=eq.${userId}` : undefined,
      }, (payload) => {
        const event = payload.new as any
        if (event.severity === 'critical') {
          HapticEvents.securityAlert()
        }
      })
      .subscribe()

    // Subscribe to vault lock events
    const vaultChannel = supabase
      .channel('haptic_vault')
      .on('broadcast', { event: 'vault_locked' }, () => {
        HapticEvents.vaultLocked()
      })
      .subscribe()

    return () => {
      tradeChannel.unsubscribe()
      sentinelChannel.unsubscribe()
      securityChannel.unsubscribe()
      vaultChannel.unsubscribe()
    }
  }, [userId, enabled, isSupported])

  const trigger = (pattern: HapticPattern) => {
    if (enabled && isSupported) {
      triggerHaptic(pattern)
    }
  }

  return (
    <HapticContext.Provider
      value={{
        enabled,
        setEnabled,
        trigger,
        events: HapticEvents,
      }}
    >
      {children}
    </HapticContext.Provider>
  )
}
