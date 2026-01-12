'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, TrendingUp, TrendingDown, Clock, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { TradeButton } from './TradeButton'
import { NewsImage } from './NewsImage'
import { HighYieldButton } from './HighYieldButton'

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

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchNews = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/news?limit=15')
      const result = await response.json()
      
      if (result.success && result.data) {
        // Convert date strings to Date objects
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
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Crypto News</h3>
            <p className="text-gray-400 text-sm mt-1">
              Latest market updates & insights
              {lastUpdate && (
                <span className="ml-2 text-xs">
                  • Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchNews}
            disabled={isLoading}
            className="p-2 bg-slate-700/50 hover:bg-slate-700 border border-purple-500/20 rounded-lg text-purple-400 transition disabled:opacity-50"
            title="Refresh news"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading && news.length === 0 ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading latest crypto news...</p>
        </div>
      ) : error && news.length === 0 ? (
        <div className="p-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchNews}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition"
          >
            Retry
          </button>
        </div>
      ) : news.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-400">No news available at the moment.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            {news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 hover:bg-slate-800/50 transition group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-700 relative">
                    <NewsImage
                      src={item.imageUrl}
                      alt={item.title}
                      width={80}
                      height={80}
                      coinName={item.primaryCoin || undefined}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                    <h4 className="text-white font-semibold group-hover:text-purple-400 transition mb-2 line-clamp-2">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.coins && item.coins.length > 0 && (
                        <>
                          {item.coins.map((coin) => (
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
                      {item.tags && item.tags.length > 0 && (
                        <>
                          {item.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-slate-700/50 border border-slate-600 rounded text-xs text-gray-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                    {/* High-Yield Staking Button for Bullish News */}
                    {item.sentiment === 'bullish' && item.primaryCoin && (
                      <div className="mt-3">
                        <HighYieldButton
                          coin={item.primaryCoin}
                          sentiment={item.sentiment}
                        />
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>

          <div className="p-4 bg-slate-900/50 border-t border-slate-800 text-center">
            <button
              onClick={fetchNews}
              disabled={isLoading}
              className="text-sm text-purple-400 hover:text-purple-300 transition disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Refresh News →'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
