// ============================================
// Krypto Trac: Momentum Breakout Client
// Frontend client for momentum signals and jump trades
// ============================================

import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface MomentumSignal {
  id: string
  coin_id: string
  symbol: string
  signal_type: 'breakout' | 'breakdown' | 'consolidation' | 'reversal'
  confidence_score: number
  predicted_price: number
  current_price: number
  price_change_pct: number
  volume_surge_pct: number
  rsi: number
  macd_signal: 'bullish' | 'bearish' | 'neutral'
  support_level: number
  resistance_level: number
  timeframe: string
  expires_at: string
  created_at: string
}

/**
 * Get active breakout signals
 */
export async function getActiveBreakouts(
  minConfidence: number = 75,
  timeframe: string = '1h'
): Promise<MomentumSignal[]> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase.rpc('get_active_breakouts', {
    p_min_confidence: minConfidence,
    p_timeframe: timeframe,
  })
  
  if (error) {
    console.error('Error fetching breakouts:', error)
    return []
  }
  
  return (data || []) as MomentumSignal[]
}

/**
 * Subscribe to momentum breakout signals
 */
export function subscribeToBreakouts(
  onBreakout: (signal: MomentumSignal) => void
): RealtimeChannel {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const channel = supabase.channel('momentum_signals')
    .on('broadcast', { event: 'breakout_detected' }, (payload) => {
      // Fetch full signal details
      supabase
        .from('momentum_signals')
        .select('*')
        .eq('id', payload.payload.signal_id)
        .single()
        .then(({ data }) => {
          if (data) {
            onBreakout(data as MomentumSignal)
          }
        })
    })
    .subscribe()
  
  return channel
}

/**
 * Execute jump trade based on signal
 */
export async function executeJumpTrade(
  signalId: string,
  tradeAmount: number,
  operatorSignature: string
): Promise<{ success: boolean; trade?: any; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  const response = await fetch('/api/execute-jump-trade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      signal_id: signalId,
      user_id: user.id,
      operator_signature: operatorSignature,
      trade_amount: tradeAmount,
    }),
  })
  
  const result = await response.json()
  return result
}

/**
 * Analyze coin for momentum (trigger manual scan)
 */
export async function analyzeMomentum(
  coinId: string,
  symbol: string,
  timeframe: '5m' | '15m' | '1h' | '4h' | '24h' = '1h'
): Promise<MomentumSignal | null> {
  const response = await fetch('/api/momentum-breakout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coin_id: coinId,
      symbol: symbol,
      timeframe: timeframe,
    }),
  })
  
  const result = await response.json()
  
  if (result.success) {
    return result.signal as MomentumSignal
  }
  
  return null
}
