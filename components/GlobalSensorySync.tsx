// ============================================
// Krypto Trac: Global Sensory Sync Component
// Root-level sensory synchronization for Sovereign tier users
// ============================================

'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { createClient } from '@supabase/supabase-js'
import SensorySync from './SensorySync'
import { useSubscriptionStore } from '@/lib/subscriptionStore'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Global radiance state context
interface RadianceContextType {
  state: 'idle' | 'active' | 'sentinel' | 'critical'
  setState: (state: 'idle' | 'active' | 'sentinel' | 'critical') => void
}

const RadianceContext = createContext<RadianceContextType | null>(null)

export function useRadiance() {
  const context = useContext(RadianceContext)
  if (!context) {
    return { state: 'idle' as const, setState: () => {} }
  }
  return context
}

interface GlobalSensorySyncProps {
  children: React.ReactNode
}

export default function GlobalSensorySync({ children }: GlobalSensorySyncProps) {
  const [radianceState, setRadianceState] = useState<'idle' | 'active' | 'sentinel' | 'critical'>('idle')
  const [userId, setUserId] = useState<string | null>(null)
  const [hasSovereign, setHasSovereign] = useState(false)
  const { addOns, refreshProfile } = useSubscriptionStore()

  useEffect(() => {
    // Check if user has Sovereign tier
    const checkSovereign = async () => {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserId(user.id)
        
        // Refresh profile to get latest add-ons
        await refreshProfile()
        
        // Check if user has 'sovereign' in add_ons
        const hasSovereignTier = addOns.includes('sovereign')
        setHasSovereign(hasSovereignTier)
      } else {
        setUserId(null)
        setHasSovereign(false)
      }
    }

    checkSovereign()

    // Listen for auth changes
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSovereign()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [addOns, refreshProfile])

  // Auto-reset radiance state after timeout
  useEffect(() => {
    if (radianceState === 'idle') return

    const timeoutMap = {
      active: 2000,      // 2 seconds for winning slot
      sentinel: 1000,    // 1 second for AI nudge
      critical: 3000,    // 3 seconds for security alert
    }

    const timeout = setTimeout(() => {
      setRadianceState('idle')
    }, timeoutMap[radianceState])

    return () => clearTimeout(timeout)
  }, [radianceState])

  return (
    <RadianceContext.Provider value={{ state: radianceState, setState: setRadianceState }}>
      {/* Only activate SensorySync for Sovereign tier users */}
      {hasSovereign && userId && (
        <SensorySync 
          userId={userId}
          onRadianceChange={setRadianceState}
        />
      )}
      {children}
    </RadianceContext.Provider>
  )
}
