// ============================================
// Krypto Trac: Sentinel Command Center Wallet Menu
// Luxury leather & gold theme with real-time security monitoring
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import PanicButton from './PanicButton'
import { getLockdownStatus, subscribeToSecurityAlerts, subscribeToLockdownStatus } from '@/lib/security/sentinel-client'
import { getActiveBreakouts, subscribeToBreakouts } from '@/lib/momentum/breakout-client'
import { getRevenueSummary, subscribeToRevenueUpdates } from '@/lib/revenue/dashboard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface SecurityScore {
  score: number
  status: 'secure' | 'warning' | 'critical'
  threats: number
}

interface WalletMenuProps {
  userId: string
}

export default function WalletMenu({ userId }: WalletMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [securityScore, setSecurityScore] = useState<SecurityScore>({ score: 100, status: 'secure', threats: 0 })
  const [isLocked, setIsLocked] = useState(false)
  const [vaultLocked, setVaultLocked] = useState(false)
  const [activeBreakouts, setActiveBreakouts] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any>(null)
  const [securityLogs, setSecurityLogs] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Load initial data
    loadSecurityScore()
    loadLockdownStatus()
    loadBreakouts()
    loadRevenue()
    loadSecurityLogs()

    // Subscribe to security alerts
    const securityChannel = subscribeToSecurityAlerts(userId, (alert) => {
      if (alert.severity === 'critical') {
        setSecurityScore(prev => ({ ...prev, score: 0, status: 'critical', threats: prev.threats + 1 }))
      }
      loadSecurityLogs() // Refresh logs
    })

    // Subscribe to lockdown status
    const lockdownChannel = subscribeToLockdownStatus(userId, (status) => {
      setIsLocked(status.is_locked)
    })

    // Subscribe to breakouts
    const breakoutChannel = subscribeToBreakouts((signal) => {
      loadBreakouts() // Refresh breakouts
    })

    // Subscribe to revenue updates
    const revenueChannel = subscribeToRevenueUpdates((update) => {
      loadRevenue() // Refresh revenue
    })

    // Subscribe to security events (real-time)
    const eventsChannel = supabase
      .channel('security_events_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_events',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const event = payload.new as any
        if (event.severity === 'critical') {
          setSecurityScore(prev => ({ ...prev, score: 0, status: 'critical', threats: prev.threats + 1 }))
        }
        loadSecurityScore()
        loadSecurityLogs()
      })
      .subscribe()

    return () => {
      securityChannel.unsubscribe()
      lockdownChannel.unsubscribe()
      breakoutChannel.unsubscribe()
      revenueChannel.unsubscribe()
      eventsChannel.unsubscribe()
    }
  }, [userId])

  const loadSecurityScore = async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Calculate security score based on recent events
    const { data: events } = await supabase
      .from('security_events')
      .select('severity')
      .eq('user_id', userId)
      .gte('detected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const criticalCount = events?.filter(e => e.severity === 'critical').length || 0
    const highCount = events?.filter(e => e.severity === 'high').length || 0
    const mediumCount = events?.filter(e => e.severity === 'medium').length || 0

    // Calculate score: 100 - (critical*50 + high*20 + medium*10)
    const score = Math.max(0, 100 - (criticalCount * 50 + highCount * 20 + mediumCount * 10))
    
    let status: 'secure' | 'warning' | 'critical' = 'secure'
    if (score < 30) status = 'critical'
    else if (score < 70) status = 'warning'

    setSecurityScore({
      score,
      status,
      threats: criticalCount + highCount,
    })
  }

  const loadLockdownStatus = async () => {
    const status = await getLockdownStatus(userId)
    setIsLocked(status?.is_locked || false)
  }

  const loadBreakouts = async () => {
    const breakouts = await getActiveBreakouts(75, '1h')
    setActiveBreakouts(breakouts.slice(0, 5))
  }

  const loadRevenue = async () => {
    const summary = await getRevenueSummary()
    setRevenue(summary)
  }

  const loadSecurityLogs = async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .order('detected_at', { ascending: false })
      .limit(10)

    setSecurityLogs(data || [])
  }

  const handleVaultToggle = async () => {
    if (vaultLocked) {
      // Unlock vault (requires MFA)
      const confirmed = window.confirm('Unlock vault? This requires MFA authentication.')
      if (confirmed) {
        // In production, trigger MFA flow
        setVaultLocked(false)
      }
    } else {
      // Lock vault
      const confirmed = window.confirm('Lock vault? This will revoke all API keys and clear cached secrets.')
      if (confirmed) {
        setVaultLocked(true)
        // Call vault lock function
      }
    }
  }

  const handleSovereignUpgrade = async () => {
    // Trigger Stripe checkout for $89.99/yr plan
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'sovereign',
        price_id: process.env.NEXT_PUBLIC_SOVEREIGN_PRICE_ID || 'price_sovereign_89_99',
      }),
    })

    const { url } = await response.json()
    if (url) {
      window.location.href = url
    }
  }

  const handleAddWallet = async () => {
    // SIWE wallet connection
    // Check if user has available slots
    // Charge $2/mo per extra wallet
    router.push('/wallet/connect')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-700 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
      >
        <span className="material-symbols-outlined text-white text-2xl">account_balance_wallet</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`
        w-full max-w-md h-[90vh] rounded-2xl
        bg-gradient-to-b from-[#1a1814] to-[#12100d]
        border-2 ${securityScore.status === 'critical' ? 'border-red-600 animate-pulse' : 'border-yellow-600/30'}
        shadow-2xl overflow-hidden
        relative
      `}>
        {/* Leather Texture Overlay */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" 
          style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/leather.png)' }}
        />

        {/* Zone 1: Sentinel Status (Top) */}
        <div className="relative z-10 p-6 border-b border-yellow-600/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-yellow-400 text-xl font-black uppercase tracking-wider">Sentinel Command</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Live Integrity Meter */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Integrity Meter</span>
              <span className={`text-sm font-bold ${
                securityScore.status === 'critical' ? 'text-red-500' :
                securityScore.status === 'warning' ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {securityScore.score}%
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  securityScore.status === 'critical' ? 'bg-red-600' :
                  securityScore.status === 'warning' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${securityScore.score}%` }}
              />
            </div>
            {securityScore.threats > 0 && (
              <p className="text-xs text-red-400 mt-1">{securityScore.threats} active threat(s)</p>
            )}
          </div>

          {/* Vault Lockdown Toggle */}
          <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-yellow-600/20">
            <div>
              <p className="text-xs text-yellow-400 font-bold uppercase">Vault Status</p>
              <p className="text-xs text-gray-400">{vaultLocked ? 'Locked' : 'Unlocked'}</p>
            </div>
            <button
              onClick={handleVaultToggle}
              className={`
                relative w-14 h-8 rounded-full transition-colors
                ${vaultLocked ? 'bg-red-600' : 'bg-green-600'}
              `}
            >
              <div className={`
                absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform
                ${vaultLocked ? 'translate-x-6' : 'translate-x-0'}
              `} />
            </button>
          </div>
        </div>

        {/* Zone 2: Asset Management (Middle) */}
        <div className="relative z-10 p-6 border-b border-yellow-600/20 overflow-y-auto max-h-[40vh]">
          <h3 className="text-yellow-400 text-sm font-bold uppercase mb-4 tracking-wider">Asset Management</h3>
          
          {/* Multi-Chain Wallet View */}
          <MultiChainWalletView userId={userId} />

          {/* Add Wallet Button */}
          <button
            onClick={handleAddWallet}
            className="w-full mt-4 py-2 bg-yellow-600/20 border border-yellow-600/30 rounded-lg text-xs text-yellow-400 font-bold hover:bg-yellow-600/30 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Wallet ($2/mo per slot)
          </button>
        </div>

        {/* Zone 3: Monetization & AI Add-ons */}
        <div className="relative z-10 p-6 border-b border-yellow-600/20">
          <h3 className="text-yellow-400 text-sm font-bold uppercase mb-4 tracking-wider">AI & Monetization</h3>
          
          {/* Auto-Pilot Toggle */}
          <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-yellow-600/20 mb-3">
            <div>
              <p className="text-xs text-yellow-400 font-bold">Auto-Pilot</p>
              <p className="text-xs text-gray-400">Automated rebalancing</p>
            </div>
            <button className="px-4 py-1.5 bg-yellow-600 text-black text-xs font-bold rounded hover:bg-yellow-500">
              Enable
            </button>
          </div>

          {/* Alpha Feed */}
          <div className="p-3 bg-black/30 rounded-lg border border-yellow-600/20 mb-3 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-yellow-400 font-bold">Alpha Feed (Verified)</p>
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                On-Chain
              </span>
            </div>
            <AlphaFeed />
          </div>

          {/* Sovereign Upgrade Button */}
          <button
            onClick={handleSovereignUpgrade}
            className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all shadow-lg"
          >
            Sovereign Upgrade - $89.99/yr
          </button>
        </div>

        {/* Zone 4: System Logs (Bottom) */}
        <div className="relative z-10 p-6 overflow-y-auto max-h-[30vh]">
          <h3 className="text-yellow-400 text-sm font-bold uppercase mb-4 tracking-wider">Protocol Audit</h3>
          
          <div className="space-y-2 font-mono text-xs">
            {securityLogs.length > 0 ? (
              securityLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded border-l-2 ${
                    log.severity === 'critical' ? 'border-red-600 bg-red-900/20' :
                    log.severity === 'high' ? 'border-yellow-600 bg-yellow-900/20' :
                    'border-gray-600 bg-gray-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">{log.event_type}</span>
                    <span className="text-gray-500">
                      {new Date(log.detected_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.severity === 'critical' && (
                    <p className="text-red-400 mt-1">🚨 ATTACK BLOCKED</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No security events</p>
            )}
          </div>
        </div>

        {/* Panic Button (Fixed Bottom) */}
        <div className="absolute bottom-6 right-6 z-20">
          <PanicButton onLockdown={() => setIsLocked(true)} />
        </div>
      </div>
    </div>
  )
}
