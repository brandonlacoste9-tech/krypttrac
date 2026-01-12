'use client'

import { AlertTriangle, Eye, EyeOff, TrendingDown, TrendingUp } from 'lucide-react'
import { FeatureGate } from './FeatureGate'
import { useState } from 'react'
import { useSubscriptionStore } from '@/lib/subscriptionStore'

interface WhaleAlert {
  id: string
  coin: string
  amount: number
  direction: 'buy' | 'sell'
  exchange: string
  hash: string
  timestamp: Date
}

// Mock whale alerts data (replace with real API)
const mockAlerts: WhaleAlert[] = [
  {
    id: '1',
    coin: 'BTC',
    amount: 12500000,
    direction: 'sell',
    exchange: 'Binance',
    hash: '0x1234567890abcdef1234567890abcdef12345678',
    timestamp: new Date(),
  },
  {
    id: '2',
    coin: 'ETH',
    amount: 8500000,
    direction: 'buy',
    exchange: 'Coinbase',
    hash: '0xabcdef1234567890abcdef1234567890abcdef12',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
]

export function WhaleAlerts() {
  const hasWhale = useSubscriptionStore((state) => state.hasWhale())
  const [alerts] = useState<WhaleAlert[]>(mockAlerts)

  const formatAmount = (amount: number) => {
    if (hasWhale) {
      return `$${amount.toLocaleString()}`
    }
    return '$$•••,•••,•••'
  }

  const formatHash = (hash: string) => {
    if (hasWhale) {
      return `${hash.slice(0, 6)}...${hash.slice(-4)}`
    }
    return '••••••...••••'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Whale Alerts</h2>
        </div>
        {!hasWhale && (
          <span className="text-xs text-gray-400 bg-purple-900/30 px-2 py-1 rounded">
            Premium Feature
          </span>
        )}
      </div>

      <FeatureGate feature="whale" blurIntensity="medium">
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-800/50 backdrop-blur-xl border border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      alert.direction === 'buy'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {alert.direction === 'buy' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{alert.coin}</span>
                      <span className="text-xs text-gray-400 uppercase">
                        {alert.direction}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{alert.exchange}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {formatAmount(alert.amount)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {alert.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <code className="bg-slate-900/50 px-2 py-1 rounded font-mono">
                  {formatHash(alert.hash)}
                </code>
                {hasWhale && (
                  <button className="text-purple-400 hover:text-purple-300">
                    View on Explorer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </FeatureGate>
    </div>
  )
}
