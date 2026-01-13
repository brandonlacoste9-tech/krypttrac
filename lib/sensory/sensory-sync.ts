// ============================================
// Krypto Trac: Sensory Sync System
// Synchronizes haptics and edge radiance via Realtime broadcasts
// ============================================

import { createClient } from '@supabase/supabase-js'
import { triggerHaptic, HapticPattern } from '@/lib/haptics/casino-haptics'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type SensoryEventType = 
  | 'WINNING_SLOT'      // Profitable trade or Bitcoin tip
  | 'SENTINEL_NUDGE'    // High-confidence AI signal
  | 'VAULT_THUD'        // Vault lock/unlock
  | 'TRADE_CLOSE'       // Auto-Pilot closes position
  | 'SECURITY_ALERT'    // Security event
  | 'SUCCESS'           // General success
  | 'CONFIRM'           // Action confirmation

export interface SensoryEvent {
  type: SensoryEventType
  userId?: string
  metadata?: {
    amount?: number
    currency?: string
    confidence?: number
    reason?: string
  }
  timestamp: string
}

/**
 * Broadcast sensory event to all connected clients
 */
export async function broadcastSensoryEvent(
  event: SensoryEvent,
  channel: string = 'sensory_events'
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  await supabase.channel(channel).send({
    type: 'broadcast',
    event: 'sensory_trigger',
    payload: event,
  })
}

/**
 * Trigger casino sensation with synchronized haptic and visual feedback
 */
export function triggerCasinoSensation(
  type: SensoryEventType,
  options?: {
    userId?: string
    metadata?: SensoryEvent['metadata']
    broadcast?: boolean
  }
): void {
  // Map event type to haptic pattern
  const hapticMap: Record<SensoryEventType, HapticPattern> = {
    WINNING_SLOT: 'SUCCESS',
    SENTINEL_NUDGE: 'SENTINEL',
    VAULT_THUD: 'LOCKDOWN',
    TRADE_CLOSE: 'TRADE_CLOSE',
    SECURITY_ALERT: 'ALERT',
    SUCCESS: 'SUCCESS',
    CONFIRM: 'CONFIRM',
  }

  // Trigger haptic
  const hapticPattern = hapticMap[type] || 'CONFIRM'
  triggerHaptic(hapticPattern)

  // Broadcast if requested
  if (options?.broadcast) {
    broadcastSensoryEvent({
      type,
      userId: options.userId,
      metadata: options.metadata,
      timestamp: new Date().toISOString(),
    }).catch(console.error)
  }
}

/**
 * Subscribe to sensory events from Realtime
 */
export function subscribeToSensoryEvents(
  callback: (event: SensoryEvent) => void,
  userId?: string
) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const channel = supabase.channel('sensory_events')
    .on('broadcast', { event: 'sensory_trigger' }, (payload) => {
      const event = payload.payload as SensoryEvent
      
      // Filter by userId if provided
      if (userId && event.userId && event.userId !== userId) {
        return
      }
      
      callback(event)
    })
    .subscribe()

  return channel
}

/**
 * Trigger "Winning Slot" heartbeat for profitable trades or tips
 */
export function triggerWinningSlot(
  amount: number,
  currency: string = 'USD',
  userId?: string,
  broadcast: boolean = true
): void {
  triggerCasinoSensation('WINNING_SLOT', {
    userId,
    metadata: { amount, currency },
    broadcast,
  })
}

/**
 * Trigger "Sentinel" nudge for high-confidence AI signals
 */
export function triggerSentinelNudge(
  confidence: number,
  userId?: string,
  broadcast: boolean = true
): void {
  triggerCasinoSensation('SENTINEL_NUDGE', {
    userId,
    metadata: { confidence },
    broadcast,
  })
}

/**
 * Trigger "Vault Thud" for vault operations
 */
export function triggerVaultThud(
  reason: string,
  userId?: string,
  broadcast: boolean = true
): void {
  triggerCasinoSensation('VAULT_THUD', {
    userId,
    metadata: { reason },
    broadcast,
  })
}
