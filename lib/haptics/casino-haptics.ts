// ============================================
// Krypto Trac: Casino-Style Haptic Patterns
// Refined, non-flashy physical feedback
// ============================================

/**
 * Haptic pattern types for refined casino-style feedback
 */
export type HapticPattern = 
  | 'SUCCESS'        // Winning slot heartbeat
  | 'SENTINEL'       // AI signal nudge
  | 'LOCKDOWN'       // Vault door thud
  | 'TRADE_CLOSE'    // Profitable trade completion
  | 'ALERT'          // Security alert
  | 'CONFIRM'        // Action confirmation

/**
 * Haptic pattern definitions (milliseconds)
 * Refined, micro-pulse patterns for luxury feel
 */
const HAPTIC_PATTERNS: Record<HapticPattern, number[]> = {
  // The "Winning Slot" Heartbeat: Quick double-tap
  SUCCESS: [20, 40, 20],
  
  // The "Sentinel" Nudge: Ultra-soft tick
  SENTINEL: [15],
  
  // The "Vault" Thud: Descending heavy pulse
  LOCKDOWN: [50, 20, 10],
  
  // Trade close: Success pattern with slight variation
  TRADE_CLOSE: [20, 50, 20, 30],
  
  // Alert: Double nudge
  ALERT: [20, 30, 20],
  
  // Confirm: Single soft tap
  CONFIRM: [10],
}

/**
 * Check if device supports haptic feedback
 */
export function supportsHaptics(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

/**
 * Trigger haptic pattern
 * Returns true if pattern was triggered, false if unsupported
 */
export function triggerHaptic(pattern: HapticPattern): boolean {
  if (!supportsHaptics()) {
    return false
  }

  const sequence = HAPTIC_PATTERNS[pattern]
  if (!sequence) {
    console.warn(`Unknown haptic pattern: ${pattern}`)
    return false
  }

  try {
    navigator.vibrate(sequence)
    return true
  } catch (error) {
    console.error('Haptic feedback error:', error)
    return false
  }
}

/**
 * Trigger custom haptic pattern
 * For advanced use cases
 */
export function triggerCustomHaptic(pattern: number[]): boolean {
  if (!supportsHaptics()) {
    return false
  }

  try {
    navigator.vibrate(pattern)
    return true
  } catch (error) {
    console.error('Custom haptic feedback error:', error)
    return false
  }
}

/**
 * Cancel any ongoing haptic pattern
 */
export function cancelHaptic(): void {
  if (supportsHaptics()) {
    try {
      navigator.vibrate(0)
    } catch (error) {
      console.error('Cancel haptic error:', error)
    }
  }
}

/**
 * Haptic feedback for specific events
 */
export const HapticEvents = {
  /**
   * Triggered when Auto-Pilot closes a profitable trade
   */
  profitableTrade: () => triggerHaptic('TRADE_CLOSE'),
  
  /**
   * Triggered when Sentinel AI detects a high-confidence signal
   */
  sentinelSignal: () => triggerHaptic('SENTINEL'),
  
  /**
   * Triggered when vault is locked
   */
  vaultLocked: () => triggerHaptic('LOCKDOWN'),
  
  /**
   * Triggered on security alert
   */
  securityAlert: () => triggerHaptic('ALERT'),
  
  /**
   * Triggered on successful action
   */
  success: () => triggerHaptic('SUCCESS'),
  
  /**
   * Triggered on confirmation
   */
  confirm: () => triggerHaptic('CONFIRM'),
}
