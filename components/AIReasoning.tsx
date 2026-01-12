'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

interface AIReasoningProps {
  coin: string
  currentPrice: number
  marketData?: {
    change24h?: number
    marketCap?: number
  }
  newsItems?: Array<{
    title: string
    sentiment: string
  }>
  className?: string
}

export function AIReasoning({ coin, currentPrice, marketData, newsItems, className = '' }: AIReasoningProps) {
  const [reasoning, setReasoning] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (coin && currentPrice) {
      fetchReasoning()
    }
  }, [coin, currentPrice])

  const fetchReasoning = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/vertex/reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin,
          currentPrice,
          marketData: marketData || {},
          newsItems: newsItems || [],
        }),
      })

      const data = await response.json()
      if (data.success) {
        setReasoning(data.reasoning)
      } else {
        throw new Error(data.error || 'Failed to get AI reasoning')
      }
    } catch (err: any) {
      console.error('Failed to fetch AI reasoning:', err)
      setError('Unable to generate AI reasoning')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-sm">AI analyzing market...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  if (!reasoning) return null

  return (
    <div className={`bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-2 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-white text-sm">AI Market Analysis</h4>
            <span className="text-xs text-purple-400">Powered by Gemini</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{reasoning}</p>
        </div>
      </div>
    </div>
  )
}
