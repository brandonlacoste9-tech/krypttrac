// ============================================
// Krypto Trac: Alpha Feed Component
// Displays verified AI predictions with blockchain proof
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface AlphaPrediction {
  id: string
  coin_id: string
  symbol: string
  prediction_type: string
  confidence_score: number
  predicted_value: number
  current_price: number
  price_change_pct: number
  verified: boolean
  blockchain_tx_hash?: string
  blockchain_network?: string
  created_at: string
  expires_at: string
}

export default function AlphaFeed() {
  const [predictions, setPredictions] = useState<AlphaPrediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPredictions()
    
    // Subscribe to new predictions
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const channel = supabase
      .channel('alpha_feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_predictions',
        filter: 'verified=eq.true',
      }, () => {
        loadPredictions()
      })
      .subscribe()

    return () => channel.unsubscribe()
  }, [])

  const loadPredictions = async () => {
    setLoading(true)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('verified', true)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error loading predictions:', error)
    } else {
      setPredictions((data || []) as AlphaPrediction[])
    }
    setLoading(false)
  }

  const getExplorerUrl = (txHash: string, network: string) => {
    if (network === 'solana') {
      return `https://solscan.io/tx/${txHash}`
    } else if (network === 'ethereum') {
      return `https://etherscan.io/tx/${txHash}`
    } else if (network === 'polygon') {
      return `https://polygonscan.com/tx/${txHash}`
    }
    return '#'
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-400">Loading alpha feed...</div>
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-2">No verified predictions</p>
        <p className="text-xs text-gray-500">Predictions will appear here when available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {predictions.map((pred) => (
        <div
          key={pred.id}
          className="p-3 bg-black/30 rounded-lg border border-yellow-600/20 hover:border-yellow-600/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold">{pred.symbol}</span>
                <span className="text-xs px-2 py-0.5 bg-green-600/20 text-green-400 rounded">
                  Verified
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {pred.prediction_type === 'price' ? 'Price Prediction' : 'Sentiment Analysis'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Confidence</p>
              <p className="text-yellow-400 font-bold">{pred.confidence_score}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-xs text-gray-400">Current</p>
              <p className="text-white font-bold">${pred.current_price.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Predicted</p>
              <p className="text-yellow-400 font-bold">${pred.predicted_value.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Change</p>
              <p className={`font-bold ${pred.price_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pred.price_change_pct >= 0 ? '+' : ''}{pred.price_change_pct.toFixed(2)}%
              </p>
            </div>
          </div>

          {pred.blockchain_tx_hash && (
            <a
              href={getExplorerUrl(pred.blockchain_tx_hash, pred.blockchain_network || 'ethereum')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300"
            >
              <span>Verify on-chain</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
