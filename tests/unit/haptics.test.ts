// ============================================
// Krypto Trac: Haptic Patterns Unit Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { triggerHaptic, supportsHaptics, HapticEvents } from '@/lib/haptics/casino-haptics'

describe('Haptic Patterns', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
  })

  describe('supportsHaptics', () => {
    it('should return true when navigator.vibrate exists', () => {
      global.navigator = { vibrate: vi.fn() } as any
      expect(supportsHaptics()).toBe(true)
    })

    it('should return false when navigator.vibrate does not exist', () => {
      global.navigator = {} as any
      expect(supportsHaptics()).toBe(false)
    })
  })

  describe('triggerHaptic', () => {
    it('should trigger SUCCESS pattern', () => {
      const vibrate = vi.fn()
      global.navigator = { vibrate } as any

      triggerHaptic('SUCCESS')
      expect(vibrate).toHaveBeenCalledWith([20, 40, 20])
    })

    it('should trigger SENTINEL pattern', () => {
      const vibrate = vi.fn()
      global.navigator = { vibrate } as any

      triggerHaptic('SENTINEL')
      expect(vibrate).toHaveBeenCalledWith([15])
    })

    it('should trigger LOCKDOWN pattern', () => {
      const vibrate = vi.fn()
      global.navigator = { vibrate } as any

      triggerHaptic('LOCKDOWN')
      expect(vibrate).toHaveBeenCalledWith([50, 20, 10])
    })

    it('should handle unsupported devices gracefully', () => {
      global.navigator = {} as any
      
      expect(() => triggerHaptic('SUCCESS')).not.toThrow()
    })
  })

  describe('HapticEvents', () => {
    it('should trigger profitable trade haptic', () => {
      const vibrate = vi.fn()
      global.navigator = { vibrate } as any

      HapticEvents.profitableTrade()
      expect(vibrate).toHaveBeenCalledWith([20, 50, 20, 30])
    })

    it('should trigger sentinel signal haptic', () => {
      const vibrate = vi.fn()
      global.navigator = { vibrate } as any

      HapticEvents.sentinelSignal()
      expect(vibrate).toHaveBeenCalledWith([15])
    })

    it('should trigger vault locked haptic', () => {
      const vibrate = vi.fn()
      global.navigator = { vibrate } as any

      HapticEvents.vaultLocked()
      expect(vibrate).toHaveBeenCalledWith([50, 20, 10])
    })
  })
})
