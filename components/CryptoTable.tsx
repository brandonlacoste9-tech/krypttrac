'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Star, Eye } from 'lucide-react'
import { formatCurrency, formatPercentage, formatCompactNumber, getChangeColor } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import Link from 'next/link'

interface Crypto {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  sparkline_in_7d?: {
    price: number[]
  }
}

interface CryptoTableProps {
  cryptos: Crypto[]
  showWatchlist?: boolean
}

export function CryptoTable({ cryptos, showWatchlist = true }: CryptoTableProps) {
  const [sortBy, setSortBy] = useState<'market_cap' | 'price_change' | 'volume'>('market_cap')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const { watchlist, addToWatchlist, removeFromWatchlist } = useAppStore()

  const sortedCryptos = [...cryptos].sort((a, b) => {
    let aVal = 0
    let bVal = 0

    switch (sortBy) {
      case 'market_cap':
        aVal = a.market_cap
        bVal = b.market_cap
        break
      case 'price_change':
        aVal = a.price_change_percentage_24h
        bVal = b.price_change_percentage_24h
        break
      case 'volume':
        aVal = a.total_volume
        bVal = b.total_volume
        break
    }

    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
  })

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const isInWatchlist = (coinId: string) => watchlist.includes(coinId)

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <h3 className="text-2xl font-bold text-white">Live Market Data</h3>
        <p className="text-gray-400 text-sm mt-1">Real-time prices • Updates every 30s</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-6 py-4 text-gray-400 font-semibold text-sm">#</th>
              <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Asset</th>
              <th 
                className="px-6 py-4 text-gray-400 font-semibold text-sm cursor-pointer hover:text-white transition"
                onClick={() => handleSort('market_cap')}
              >
                Price
                {sortBy === 'market_cap' && (
                  <span className="ml-2">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                )}
              </th>
              <th 
                className="px-6 py-4 text-gray-400 font-semibold text-sm cursor-pointer hover:text-white transition"
                onClick={() => handleSort('price_change')}
              >
                24h Change
                {sortBy === 'price_change' && (
                  <span className="ml-2">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                )}
              </th>
              <th 
                className="px-6 py-4 text-gray-400 font-semibold text-sm hidden md:table-cell cursor-pointer hover:text-white transition"
                onClick={() => handleSort('volume')}
              >
                Volume
                {sortBy === 'volume' && (
                  <span className="ml-2">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                )}
              </th>
              <th className="px-6 py-4 text-gray-400 font-semibold text-sm hidden lg:table-cell">Market Cap</th>
              {showWatchlist && (
                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Watch</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedCryptos.map((crypto, index) => (
              <tr 
                key={crypto.id} 
                className="border-b border-slate-800 hover:bg-slate-800/50 transition group"
              >
                <td className="px-6 py-4 text-gray-400 text-sm">{index + 1}</td>
                <td className="px-6 py-4">
                  <Link href={`/coin/${crypto.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                    <img 
                      src={crypto.image} 
                      alt={crypto.name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/kk-logo.png'
                      }}
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{crypto.name}</div>
                      <div className="text-xs text-gray-400 uppercase">{crypto.symbol}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-white font-semibold">
                  {formatCurrency(crypto.current_price)}
                </td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-1 ${getChangeColor(crypto.price_change_percentage_24h)}`}>
                    {crypto.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-semibold">
                      {formatPercentage(crypto.price_change_percentage_24h)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300 text-sm hidden md:table-cell">
                  {formatCompactNumber(crypto.total_volume)}
                </td>
                <td className="px-6 py-4 text-gray-300 text-sm hidden lg:table-cell">
                  {formatCompactNumber(crypto.market_cap)}
                </td>
                {showWatchlist && (
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        if (isInWatchlist(crypto.id)) {
                          removeFromWatchlist(crypto.id)
                        } else {
                          addToWatchlist(crypto.id)
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-slate-700/50 transition"
                    >
                      {isInWatchlist(crypto.id) ? (
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <Star className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
