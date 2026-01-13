// ============================================
// Krypto Trac: Sensory Sync E2E Tests
// ============================================

import { test, expect } from '@playwright/test'

test.describe('Sensory Sync E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock haptic support
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'vibrate', {
        value: (pattern: number[]) => {
          (window as any).lastHapticPattern = pattern
          return true
        },
        writable: true,
      })
    })
  })

  test('should trigger haptic on profitable trade', async ({ page }) => {
    await page.goto('/dashboard')

    // Mock profitable trade event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('profitable-trade', {
        detail: { amount: 1250, profit_usd: 1250 }
      }))
    })

    // Wait for haptic to trigger
    await page.waitForTimeout(100)

    // Check if haptic was triggered
    const hapticTriggered = await page.evaluate(() => {
      return (window as any).lastHapticPattern
    })

    expect(hapticTriggered).toEqual([20, 50, 20, 30]) // TRADE_CLOSE pattern
  })

  test('should update edge radiance on sensory event', async ({ page }) => {
    await page.goto('/dashboard')

    // Trigger sensory event
    await page.evaluate(() => {
      const event = new CustomEvent('sensory-event', {
        detail: {
          type: 'WINNING_SLOT',
          metadata: { amount: 1250 }
        }
      })
      window.dispatchEvent(event)
    })

    // Wait for radiance update
    await page.waitForTimeout(200)

    // Check if radiance state changed
    const radianceState = await page.evaluate(() => {
      return (window as any).radianceState
    })

    expect(radianceState).toBe('active')
  })
})
