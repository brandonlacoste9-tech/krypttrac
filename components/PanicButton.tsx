// ============================================
// Krypto Trac: Panic Button Component
// Magnum Gold embossed button with haptic feedback
// ============================================

'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface PanicButtonProps {
  onLockdown?: () => void
}

export default function PanicButton({ onLockdown }: PanicButtonProps) {
  const [isActivating, setIsActivating] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  const handlePanicButton = async () => {
    // Confirm action
    const confirmed = window.confirm(
      '🚨 TOTAL LOCKDOWN\n\n' +
      'This will:\n' +
      '• Clear all vault secrets\n' +
      '• Revoke all sessions\n' +
      '• Block all withdrawals\n' +
      '• Lock your account\n\n' +
      'Recovery requires hardware key authentication.\n\n' +
      'Are you absolutely sure?'
    )

    if (!confirmed) return

    setIsActivating(true)

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('You must be logged in to activate panic button')
        return
      }

      // Call panic button Edge Function
      const response = await fetch('/api/panic-button', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          reason: 'User-initiated panic button activation',
        }),
      })

      const result = await response.json()

      if (result.success) {
        setIsLocked(true)
        
        // Haptic feedback (if supported)
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200])
        }

        // Trigger UI update
        if (onLockdown) {
          onLockdown()
        }

        // Show confirmation
        alert('🔒 TOTAL LOCKDOWN ACTIVATED\n\nAccount secured. All access revoked.')
      } else {
        throw new Error(result.error || 'Failed to activate lockdown')
      }
    } catch (error: any) {
      console.error('Panic button error:', error)
      alert(`Failed to activate panic button: ${error.message}`)
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="relative">
      {/* Magnum Gold Panic Button */}
      <button
        onClick={handlePanicButton}
        disabled={isActivating || isLocked}
        className={`
          relative w-32 h-32 rounded-full
          bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600
          border-4 border-yellow-700
          shadow-[0_0_30px_rgba(234,179,8,0.6),inset_0_2px_10px_rgba(255,255,255,0.3)]
          transform transition-all duration-200
          ${isLocked 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:scale-110 active:scale-95'
          }
          ${isActivating ? 'animate-pulse' : ''}
        `}
        style={{
          background: isLocked 
            ? 'linear-gradient(145deg, #6b7280, #4b5563)'
            : 'linear-gradient(145deg, #fbbf24, #f59e0b, #d97706)',
        }}
      >
        {/* Red Pulsing Core */}
        <div className={`
          absolute inset-4 rounded-full
          ${isLocked 
            ? 'bg-gray-600' 
            : 'bg-red-600 animate-pulse'
          }
          shadow-[0_0_20px_rgba(220,38,38,0.8),inset_0_2px_5px_rgba(0,0,0,0.5)]
        `}>
          {/* Embossed Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`
              text-white font-black text-xs uppercase tracking-widest
              ${isLocked ? 'opacity-50' : ''}
            `}>
              {isLocked ? 'LOCKED' : 'PANIC'}
            </span>
          </div>
        </div>

        {/* Gold Foil Press Effect */}
        <div className="absolute inset-0 rounded-full pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-full" />
        </div>
      </button>

      {/* Label */}
      <div className="mt-2 text-center">
        <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider">
          {isLocked ? 'Account Locked' : 'Total Defense'}
        </p>
        {isLocked && (
          <p className="text-[10px] text-gray-400 mt-1">
            Hardware key required
          </p>
        )}
      </div>
    </div>
  )
}
