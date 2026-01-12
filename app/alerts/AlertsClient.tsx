'use client'

import { useState } from 'react'
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Volume2, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface Alert {
  id: string
  coinId: string
  coinName: string
  coinSymbol: string
  type: 'price_above' | 'price_below' | 'change_24h' | 'volume'
  value: number
  isActive: boolean
  triggered: boolean
  createdAt: Date
}

export function AlertsClient() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      coinId: 'bitcoin',
      coinName: 'Bitcoin',
      coinSymbol: 'BTC',
      type: 'price_above',
      value: 50000,
      isActive: true,
      triggered: false,
      createdAt: new Date(),
    },
    {
      id: '2',
      coinId: 'ethereum',
      coinName: 'Ethereum',
      coinSymbol: 'ETH',
      type: 'change_24h',
      value: 10,
      isActive: true,
      triggered: false,
      createdAt: new Date(),
    },
  ])
  const [showAddModal, setShowAddModal] = useState(false)

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'price_above':
      case 'price_below':
        return <DollarSign className="w-4 h-4" />
      case 'change_24h':
        return <TrendingUp className="w-4 h-4" />
      case 'volume':
        return <Volume2 className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'price_above': return 'Price Above'
      case 'price_below': return 'Price Below'
      case 'change_24h': return '24h Change'
      case 'volume': return 'Volume'
      default: return type
    }
  }

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id))
  }

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ))
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Price Alerts</h1>
          <p className="text-gray-400 mt-2">Get notified when your coins hit targets</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all hover:scale-105 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Alert
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12 text-center">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No alerts set</h3>
          <p className="text-gray-400 mb-6">Create alerts to stay on top of market movements</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-slate-800/50 backdrop-blur-xl border rounded-2xl p-6 ${
                alert.triggered 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : 'border-purple-500/20'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-2">
                    {getAlertTypeIcon(alert.type)}
                  </div>
                  <div>
                    <div className="font-bold text-white">{alert.coinName}</div>
                    <div className="text-sm text-gray-400 uppercase">{alert.coinSymbol}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      alert.isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    {alert.isActive ? 'Active' : 'Paused'}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Alert Type</span>
                  <span className="text-sm font-semibold text-white">
                    {getAlertTypeLabel(alert.type)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Target Value</span>
                  <span className="text-sm font-semibold text-purple-400">
                    {alert.type.includes('price') 
                      ? formatCurrency(alert.value)
                      : formatPercentage(alert.value)
                    }
                  </span>
                </div>
                {alert.triggered && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-semibold">Alert Triggered!</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Create New Alert</h3>
            <p className="text-gray-400 text-sm mb-6">
              This feature is coming soon! Connect your wallet to enable automatic alerts.
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
