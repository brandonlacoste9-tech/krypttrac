'use client'

import { useEffect, useState } from 'react'
import { Star, TrendingUp, TrendingDown, Search, X } from 'lucide-react'
import { CryptoTable } from '@/components/CryptoTable'
import { useAppStore } from '@/lib/store'
import { formatCurrency, formatPercentage, getChangeColor } from '@/lib/utils'

export function WatchlistClient() {
  const { watchlist, cryptos, setCryptos, setLoading } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCryptos, setFilteredCryptos] = useState(cryptos)

  useEffect(() => {
    const fetchAllCryptos = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/crypto?endpoint=markets&limit=250')
        const result = await response.json()
        if (result.success) {
          setCryptos(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch cryptos:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAllCryptos()
  }, [])

  useEffect(() => {
    let filtered = cryptos

    // Filter by watchlist
    if (watchlist.length > 0) {
      filtered = filtered.filter(c => watchlist.includes(c.id))
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.symbol.toLowerCase().includes(query)
      )
    }

    setFilteredCryptos(filtered)
  }, [cryptos, watchlist, searchQuery])

  const watchlistCryptos = filteredCryptos.filter(c => watchlist.includes(c.id))

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">My Watchlist</h1>
          <p className="text-gray-400 mt-2">Track your favorite coins</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coins..."
            className="w-full sm:w-80 pl-10 pr-10 py-2.5 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12 text-center">
          <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No coins in watchlist</h3>
          <p className="text-gray-400 mb-6">Start adding coins to track their performance</p>
          <p className="text-sm text-gray-500">Click the star icon on any coin in the dashboard to add it</p>
        </div>
      ) : (
        <>
          {watchlistCryptos.length > 0 ? (
            <CryptoTable cryptos={watchlistCryptos} showWatchlist={true} />
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 text-center">
              <p className="text-gray-400">No coins match your search</p>
            </div>
          )}
        </>
      )}

      {/* All Cryptos Section */}
      {searchQuery && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Search Results</h2>
          <CryptoTable cryptos={filteredCryptos.slice(0, 50)} showWatchlist={true} />
        </div>
      )}
    </main>
  )
}
