'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Search, Filter, TrendingUp, TrendingDown, Clock, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { TradeButton } from '@/components/TradeButton'
import { NewsImage } from '@/components/NewsImage'

interface NewsItem {
  id: string
  title: string
  description?: string
  source: string
  sourceRank?: number
  isVerified?: boolean
  sourceTier?: 'tier1' | 'tier2' | 'tier3'
  url: string
  imageUrl?: string | null
  publishedAt: Date
  sentiment: 'positive' | 'negative' | 'neutral' | 'bullish' | 'bearish'
  sentimentConfidence?: number
  sentimentKeywords?: string[]
  coins?: string[]
  primaryCoin?: string | null
  tags?: string[]
}

export function NewsPageClient() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchNews = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/news?limit=50')
      const result = await response.json()
      
      if (result.success && result.data) {
        const newsWithDates = result.data.map((item: any) => ({
          ...item,
          publishedAt: new Date(item.publishedAt),
        }))
        setNews(newsWithDates)
        setLastUpdate(new Date())
      } else {
        throw new Error('Failed to fetch news')
      }
    } catch (err: any) {
      console.error('Failed to fetch news:', err)
      setError('Failed to load news. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = news

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query) ||
        item.coins?.some(coin => coin.toLowerCase().includes(query)) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Filter by sentiment
    if (sentimentFilter !== 'all') {
      filtered = filtered.filter(item => item.sentiment === sentimentFilter)
    }

    setFilteredNews(filtered)
  }, [news, searchQuery, sentimentFilter])

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
      case 'bullish': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'negative':
      case 'bearish': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
      case 'bullish': return <TrendingUp className="w-4 h-4" />
      case 'negative':
      case 'bearish': return <TrendingDown className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Crypto News</h1>
          <p className="text-gray-400 mt-2">
            Stay updated with the latest crypto market news and insights
            {lastUpdate && (
              <span className="ml-2 text-sm">
                • Last updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchNews}
          disabled={isLoading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news, coins, tags..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Sentiment</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
        </div>
      </div>

      {/* News Grid */}
      {isLoading && news.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12 text-center">
          <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading latest crypto news...</p>
        </div>
      ) : error && news.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchNews}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-semibold transition"
          >
            Retry
          </button>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12 text-center">
          <p className="text-gray-400">No news found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden hover:border-purple-500/50 transition group"
            >
              <div className="relative w-full h-48 bg-slate-700 overflow-hidden">
                <NewsImage
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  coinName={item.primaryCoin || undefined}
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 ${getSentimentColor(item.sentiment)}`}>
                    {getSentimentIcon(item.sentiment)}
                    {item.sentiment}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    {item.source}
                    {item.isVerified && (
                      <CheckCircle2 className="w-3 h-3 text-purple-400" title="Verified Source" />
                    )}
                  </span>
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(item.publishedAt, { addSuffix: true })}
                  </div>
                </div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {item.coins && item.coins.length > 0 && (
                    <>
                      {item.coins.slice(0, 3).map((coin) => (
                        <div key={coin} className="flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300 ${
                              item.primaryCoin === coin ? 'ring-2 ring-purple-400/50 font-semibold' : ''
                            }`}
                          >
                            {coin.toUpperCase()}
                            {item.primaryCoin === coin && ' ⭐'}
                          </span>
                          <TradeButton coinName={coin} size="sm" variant="minimal" />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Results Count */}
      {filteredNews.length > 0 && (
        <div className="text-center text-gray-400 text-sm">
          Showing {filteredNews.length} of {news.length} articles
        </div>
      )}
    </main>
  )
}
