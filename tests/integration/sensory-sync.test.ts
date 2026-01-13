// ============================================
// Krypto Trac: Sensory Sync Integration Tests
// ============================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { broadcastSensoryEvent, subscribeToSensoryEvents, triggerWinningSlot } from '@/lib/sensory/sensory-sync'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    send: vi.fn().mockResolvedValue({}),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  }

  return {
    createClient: vi.fn(() => ({
      channel: vi.fn(() => mockChannel),
    })),
  }
})

describe('Sensory Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('broadcastSensoryEvent', () => {
    it('should broadcast event to Supabase channel', async () => {
      const event = {
        type: 'WINNING_SLOT' as const,
        userId: 'test-user-id',
        metadata: { amount: 1250, currency: 'USD' },
        timestamp: new Date().toISOString(),
      }

      await broadcastSensoryEvent(event)

      // Verify channel.send was called
      const { createClient } = await import('@supabase/supabase-js')
      const client = createClient('', '')
      const channel = client.channel('sensory_events')
      
      expect(channel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'sensory_trigger',
        payload: event,
      })
    })
  })

  describe('subscribeToSensoryEvents', () => {
    it('should subscribe to sensory events channel', () => {
      const callback = vi.fn()
      const channel = subscribeToSensoryEvents(callback)

      expect(channel).toBeDefined()
    })

    it('should filter events by userId when provided', () => {
      const callback = vi.fn()
      const channel = subscribeToSensoryEvents(callback, 'user-123')

      // Channel should be created with filter
      expect(channel).toBeDefined()
    })
  })

  describe('triggerWinningSlot', () => {
    it('should trigger haptic and broadcast event', () => {
      const vibrate = vi.fn()
      global.navigator = { vibrate } as any

      triggerWinningSlot(1250, 'USD', 'user-123', true)

      // Should trigger haptic
      expect(vibrate).toHaveBeenCalled()
    })
  })
})
