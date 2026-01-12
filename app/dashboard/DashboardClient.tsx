'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { TierBadge } from '@/components/TierBadge'
import { AIAgent } from '@/components/AIAgent'
import { CryptoTable } from '@/components/CryptoTable'
import { Leaderboard } from '@/components/Leaderboard'
import { NewsFeed } from '@/components/NewsFeed'
import { Achievements } from '@/components/Achievements'
import { PriceChart } from '@/components/PriceChart'
import { TrendingUp, TrendingDown, DollarSign, Activity, Crown, Sparkles, RefreshCw, CheckCircle2, X } from 'lucide-react'
import { SuccessNotification } from '@/components/SuccessNotification'
import { useAppStore } from '@/lib/store'
import { useSubscriptionStore } from '@/lib/subscriptionStore'
import { formatCurrency, formatPercentage } from '@/lib/utils'

export function DashboardClient() {
  const [userTier] = useState<'free' | 'silver' | 'gold' | 'platinum'>('platinum')
  const { cryptos, setCryptos, isLoading, setLoading, lastUpdate } = useAppStore()
  const { refreshProfile, isLoading: isRefreshing } = useSubscriptionStore()
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [successFeature, setSuccessFeature] = useState<string | null>(null)
  const [showCanceled, setShowCanceled] = useState(false)
  const [portfolio, setPortfolio] = useState({
    value: 127543.89,
    change: 12456.78,
    changePercent: 10.82,
  })

  const fetchCryptoData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/crypto?endpoint=markets&limit=50')
      const result = await response.json()
      
      if (result.success) {
        setCryptos(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch crypto data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCryptoData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchCryptoData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle checkout success callback
  useEffect(() => {
    const success = searchParams.get('success')
    const feature = searchParams.get('feature')
    const canceled = searchParams.get('canceled')

    if (success === 'true' && feature) {
      setSuccessFeature(feature)
      setShowSuccess(true)
      // Refresh profile to get updated add-ons
      refreshProfile()
      // Clear URL params after showing success
      setTimeout(() => {
        window.history.replaceState({}, '', '/dashboard')
      }, 3000)
    }

    if (canceled === 'true') {
      setShowCanceled(true)
      setTimeout(() => {
        setShowCanceled(false)
        window.history.replaceState({}, '', '/dashboard')
      }, 3000)
    }

    // Initial profile refresh on mount
    refreshProfile()
  }, [searchParams, refreshProfile])

  const topGainers = cryptos
    .filter(c => c.price_change_percentage_24h > 0)
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
    .slice(0, 5)

  const topLosers = cryptos
    .filter(c => c.price_change_percentage_24h < 0)
    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
    .slice(0, 5)

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 sm:space-y-8">
      {/* Success Notification */}
      <SuccessNotification
        show={showSuccess}
        feature={successFeature ? successFeature.toUpperCase() : null}
        onClose={() => setShowSuccess(false)}
        duration={5000}
      />

      {/* Canceled Notification */}
      {showCanceled && (
        <div className="fixed top-20 right-4 z-50 bg-yellow-500/90 backdrop-blur-xl border border-yellow-400/50 rounded-xl p-4 shadow-2xl animate-slide-in">
          <div className="flex items-center gap-3">
            <X className="w-6 h-6 text-white" />
            <div>
              <div className="font-bold text-white">Checkout Canceled</div>
              <div className="text-sm text-yellow-100">
                You can try again anytime
              </div>
            </div>
            <button
              onClick={() => setShowCanceled(false)}
              className="ml-4 text-white hover:text-yellow-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Welcome, King 👑</h2>
          <p className="text-gray-400 mt-2">Your royal crypto dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <TierBadge tier={userTier} size="lg" />
          <button
            onClick={fetchCryptoData}
            disabled={isLoading}
            className="p-2 bg-slate-800/50 hover:bg-slate-700/50 border border-purple-500/20 rounded-xl text-purple-400 transition disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-gray-400">
            <DollarSign className="w-5 h-5" />
            <span className="font-semibold">Total Portfolio</span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-white">
            {formatCurrency(portfolio.value)}
          </div>
          <div className="text-green-400 text-sm font-semibold">
            {formatCurrency(portfolio.change)} ({formatPercentage(portfolio.changePercent)})
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Activity className="w-5 h-5" />
            <span className="font-semibold">24h Performance</span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-green-400">
            {formatPercentage(portfolio.changePercent)}
          </div>
          <div className="text-gray-400 text-sm">Above market average</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-6 space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-purple-300">
            <Crown className="w-5 h-5" />
            <span className="font-semibold">Premium Features</span>
          </div>
          <div className="text-2xl font-bold text-white">Unlocked</div>
          <div className="flex items-center gap-2 text-purple-300 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI Agent • Live Alerts • Kings Lounge</span>
          </div>
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-xl font-bold text-white">Top Gainers</h3>
          </div>
          <div className="space-y-3">
            {topGainers.map((crypto, index) => (
              <div key={crypto.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-bold">#{index + 1}</span>
                  <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="font-semibold text-white text-sm">{crypto.name}</div>
                    <div className="text-xs text-gray-400 uppercase">{crypto.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-sm">
                    {formatPercentage(crypto.price_change_percentage_24h)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatCurrency(crypto.current_price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="text-xl font-bold text-white">Top Losers</h3>
          </div>
          <div className="space-y-3">
            {topLosers.map((crypto, index) => (
              <div key={crypto.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-bold">#{index + 1}</span>
                  <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="font-semibold text-white text-sm">{crypto.name}</div>
                    <div className="text-xs text-gray-400 uppercase">{crypto.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold text-sm">
                    {formatPercentage(crypto.price_change_percentage_24h)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatCurrency(crypto.current_price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Data Table */}
      {cryptos.length > 0 && <CryptoTable cryptos={cryptos} />}

      {/* Social & News Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Leaderboard />
        <NewsFeed />
      </div>

      {/* Achievements */}
      <Achievements />

      {/* Premium Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-yellow-600/10 to-yellow-600/5 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6">
          <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400 mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Kings Lounge</h3>
          <p className="text-gray-400 mb-4 text-sm sm:text-base">
            Exclusive chat for Gold & Platinum members. Share alpha and connect with premium traders.
          </p>
          <button className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 rounded-xl text-white font-semibold transition-all hover:scale-105">
            Enter Lounge →
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/5 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
          <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">AI Agent</h3>
          <p className="text-gray-400 mb-4 text-sm sm:text-base">
            Your personal crypto assistant. Get instant market analysis, price alerts, and trading insights.
          </p>
          <button className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all hover:scale-105">
            Chat with AI →
          </button>
        </div>
      </div>

      {/* AI Agent Component - Floating */}
      <AIAgent
        dashboardData={{ 
          gainers: topGainers,
          losers: topLosers,
          stablecoins: cryptos.filter(c => c.symbol.toLowerCase().includes('usd'))
        }}
        portfolioData={{ value: portfolio.value }}
      />
    </main>
  )
}
