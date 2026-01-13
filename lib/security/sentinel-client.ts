// ============================================
// Krypto Trac: Sentinel Security Client
// Frontend client for security monitoring and lockdown
// ============================================

import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface SecurityEvent {
  id: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  threat_signature?: string
  detected_at: string
  resolved_at?: string
}

export interface LockdownStatus {
  is_locked: boolean
  locked_at?: string
  locked_by?: string
  lock_reason?: string
  recovery_method?: string
}

/**
 * Get user's lockdown status
 */
export async function getLockdownStatus(userId: string): Promise<LockdownStatus | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_locked')
    .eq('user_id', userId)
    .single()

  if (!profile) return null

  if (profile.is_locked) {
    const { data: lockdown } = await supabase
      .from('security_lockdown')
      .select('*')
      .eq('user_id', userId)
      .is('recovery_completed_at', null)
      .single()

    return {
      is_locked: true,
      locked_at: lockdown?.locked_at,
      locked_by: lockdown?.locked_by,
      lock_reason: lockdown?.lock_reason,
      recovery_method: lockdown?.recovery_method,
    }
  }

  return { is_locked: false }
}

/**
 * Get user's security events
 */
export async function getSecurityEvents(userId: string, limit: number = 20): Promise<SecurityEvent[]> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase
    .from('security_events')
    .select('*')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching security events:', error)
    return []
  }

  return (data || []) as SecurityEvent[]
}

/**
 * Subscribe to security alerts
 */
export function subscribeToSecurityAlerts(
  userId: string,
  onAlert: (alert: { type: string; message: string; severity: string }) => void
): RealtimeChannel {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const channel = supabase.channel('security_alerts')
    .on('broadcast', { event: 'critical_threat' }, (payload) => {
      if (payload.payload.user_id === userId) {
        onAlert({
          type: 'critical_threat',
          message: 'Critical security threat detected. Account locked.',
          severity: 'critical',
        })
      }
    })
    .on('broadcast', { event: 'panic_lockdown' }, (payload) => {
      if (payload.payload.user_id === userId) {
        onAlert({
          type: 'panic_lockdown',
          message: 'Panic button activated. Total lockdown in effect.',
          severity: 'critical',
        })
      }
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'security_events',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      const event = payload.new as SecurityEvent
      if (event.severity === 'critical') {
        onAlert({
          type: 'security_event',
          message: `Critical security event: ${event.event_type}`,
          severity: event.severity,
        })
      }
    })
    .subscribe()
  
  return channel
}

/**
 * Subscribe to lockdown status changes
 */
export function subscribeToLockdownStatus(
  userId: string,
  onStatusChange: (status: LockdownStatus) => void
): RealtimeChannel {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const channel = supabase.channel(`user:${userId}`)
    .on('broadcast', { event: 'lockdown_activated' }, (payload) => {
      onStatusChange({
        is_locked: true,
        locked_at: payload.payload.timestamp,
        locked_by: 'system',
        lock_reason: 'Security lockdown activated',
      })
    })
    .on('broadcast', { event: 'lockdown_lifted' }, (payload) => {
      onStatusChange({
        is_locked: false,
      })
    })
    .subscribe()
  
  return channel
}

/**
 * Activate panic button
 */
export async function activatePanicButton(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/panic-button', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      reason: reason || 'User-initiated panic button',
    }),
  })

  const result = await response.json()
  return result
}

/**
 * Unlock account with recovery code
 */
export async function unlockAccount(
  userId: string,
  unlockCode: string,
  recoveryMethod: 'email_verification' | 'mfa' | 'hardware_key' | 'support_review'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase.rpc('unlock_account', {
    p_user_id: userId,
    p_unlock_code: unlockCode,
    p_recovery_method: recoveryMethod,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: data === true }
}
