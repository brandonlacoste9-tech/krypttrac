// ============================================
// Krypto Trac: Auto-Pilot Toggle Component
// With haptic feedback on profitable trades
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useHaptics } from './HapticProvider'
import EdgeRadiance from './EdgeRadiance'
import { triggerWinningSlot } from '@/lib/sensory/sensory-sync'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface AutoPilotToggleProps {
  userId: string
}

export default function AutoPilotToggle({ userId }: AutoPilotToggleProps) {
  const haptics = useHaptics()
  const [isEnabled, setIsEnabled] = useState(false)
  const [recentProfit, setRecentProfit] = useState(0)

  useEffect(() => {
    if (!isEnabled) return

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Subscribe to profitable trades
    const channel = supabase
      .channel('autopilot_trades')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const transaction = payload.new as any
        if (transaction.profit_usd > 0 && transaction.executed_by === 'autopilot') {
          // Trigger "Winning Slot" heartbeat haptic with broadcast
          triggerWinningSlot(
            transaction.profit_usd,
            'USD',
            userId,
            true // Broadcast to all connected clients
          )
          haptics.events.profitableTrade()
          setRecentProfit(transaction.profit_usd)
          
          // Reset after 2 seconds
          setTimeout(() => setRecentProfit(0), 2000)
        }
      })
      .subscribe()

    return () => channel.unsubscribe()
  }, [isEnabled, userId, haptics])

  const handleToggle = async () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    
    // Confirm haptic
    haptics.events.confirm()
    
    // In production, call API to enable/disable Auto-Pilot
    // await fetch('/api/autopilot/toggle', { method: 'POST', body: JSON.stringify({ enabled: newState }) })
  }

  return (
    <EdgeRadiance state={isEnabled ? 'active' : 'idle'}>
      <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-yellow-600/20">
        <div>
          <p className="text-xs text-yellow-400 font-bold">Auto-Pilot</p>
          <p className="text-xs text-gray-400">
            {isEnabled ? 'Automated rebalancing active' : 'Automated rebalancing'}
          </p>
          {recentProfit > 0 && (
            <p className="text-xs text-green-400 mt-1">
              +${recentProfit.toFixed(2)} profit
            </p>
          )}
        </div>
        <button
          onClick={handleToggle}
          className={`
            relative w-14 h-8 rounded-full transition-colors
            ${isEnabled ? 'bg-yellow-600' : 'bg-gray-700'}
          `}
        >
          <div
            className={`
              absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform
              ${isEnabled ? 'translate-x-6' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
    </EdgeRadiance>
  )
}
