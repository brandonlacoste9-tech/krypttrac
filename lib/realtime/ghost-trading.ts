// ============================================
// Krypto Trac: Ghost Trading Realtime Client
// Shows live presence and notifies when whales are active
// ============================================

import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface GhostTradingSignal {
  type: 'whale_active' | 'heatmap_update' | 'coin_trending'
  coin_id: string
  symbol: string
  whale_count: number
  viewer_count: number
  timestamp: string
}

/**
 * Subscribe to ghost trading signals
 */
export function subscribeToGhostTrading(
  onSignal: (signal: GhostTradingSignal) => void
): RealtimeChannel {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const channel = supabase.channel('ghost_trading')
    .on('broadcast', { event: 'whale_active' }, (payload) => {
      onSignal({
        type: 'whale_active',
        coin_id: payload.payload.coin_id,
        symbol: payload.payload.symbol,
        whale_count: payload.payload.whale_count,
        viewer_count: payload.payload.viewer_count,
        timestamp: payload.payload.timestamp,
      })
    })
    .on('broadcast', { event: 'heatmap_update' }, (payload) => {
      onSignal({
        type: 'heatmap_update',
        coin_id: payload.payload.coin_id,
        symbol: payload.payload.symbol,
        whale_count: payload.payload.whale_count,
        viewer_count: payload.payload.viewer_count,
        timestamp: payload.payload.timestamp,
      })
    })
    .subscribe()
  
  return channel
}

/**
 * Track user presence when viewing a coin
 */
export async function trackCoinView(coinId: string, symbol: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return
  
  // Update presence channel
  const channelName = `coin:${coinId}`
  
  // Upsert presence
  const { error } = await supabase
    .from('presence_channels')
    .upsert({
      channel_name: channelName,
      user_id: user.id,
      coin_id: coinId,
      last_seen: new Date().toISOString(),
    }, {
      onConflict: 'channel_name,user_id',
    })
  
  if (error) {
    console.error('Error tracking presence:', error)
    return
  }
  
  // Check if user is a whale
  const { data: whaleUsers } = await supabase.rpc('get_whale_users', {
    p_days: 7,
    p_min_activities: 50,
  })
  
  const isWhale = whaleUsers?.some((w: any) => w.user_id === user.id)
  
  if (isWhale) {
    // Broadcast whale activity
    await supabase.channel('ghost_trading').send({
      type: 'broadcast',
      event: 'whale_active',
      payload: {
        coin_id: coinId,
        symbol: symbol,
        whale_count: 1,
        viewer_count: 1,
        timestamp: new Date().toISOString(),
      },
    })
  }
  
  // Get current heatmap and broadcast update
  const { data: heatmap } = await supabase.rpc('get_coin_heatmap')
  
  if (heatmap) {
    const coinData = heatmap.find((h: any) => h.coin_id === coinId)
    if (coinData) {
      await supabase.channel('ghost_trading').send({
        type: 'broadcast',
        event: 'heatmap_update',
        payload: {
          coin_id: coinId,
          symbol: symbol,
          whale_count: coinData.whale_count,
          viewer_count: coinData.viewer_count,
          timestamp: new Date().toISOString(),
        },
      })
    }
  }
}

/**
 * Get current coin heatmap
 */
export async function getCoinHeatmap() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase.rpc('get_coin_heatmap')
  
  if (error) {
    console.error('Error fetching heatmap:', error)
    return []
  }
  
  return data || []
}

/**
 * Get active viewers for a coin
 */
export async function getCoinViewers(coinId: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase.rpc('get_coin_viewers', {
    p_coin_id: coinId,
  })
  
  if (error) {
    console.error('Error fetching viewers:', error)
    return []
  }
  
  return data || []
}
