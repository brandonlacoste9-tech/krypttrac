// ============================================
// Krypto Trac: Sovereign Tier Gate
// Wraps premium features for Sovereign tier users
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useSubscriptionStore } from '@/lib/subscriptionStore'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface SovereignGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function SovereignGate({ children, fallback }: SovereignGateProps) {
  const { addOns, refreshProfile } = useSubscriptionStore()
  const [isLoading, setIsLoading] = useState(true)
  const [hasSovereign, setHasSovereign] = useState(false)

  useEffect(() => {
    const checkSovereign = async () => {
      setIsLoading(true)
      await refreshProfile()
      const hasSovereignTier = addOns.includes('sovereign')
      setHasSovereign(hasSovereignTier)
      setIsLoading(false)
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

  if (isLoading) {
    return null // Or a loading spinner
  }

  if (!hasSovereign) {
    return fallback || (
      <div className="p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg text-center">
        <p className="text-yellow-400 font-bold mb-2">Sovereign Tier Required</p>
        <p className="text-gray-400 text-sm mb-4">
          Upgrade to Sovereign tier to unlock synchronized sensory feedback
        </p>
        <a
          href="/api/checkout?feature=sovereign"
          className="px-4 py-2 bg-yellow-600 text-black font-bold rounded hover:bg-yellow-500 transition-colors"
        >
          Upgrade to Sovereign - $89.99/yr
        </a>
      </div>
    )
  }

  return <>{children}</>
}
