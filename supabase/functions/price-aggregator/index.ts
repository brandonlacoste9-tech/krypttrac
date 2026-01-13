// ============================================
// Krypto Trac: Price Aggregator Edge Function
// Fetches prices from multiple sources and stores in DB
// Triggered by pg_cron every minute
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CoinGeckoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  total_volume: number
  price_change_24h: number
  price_change_percentage_24h: number
  high_24h: number
  low_24h: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Top 100 coins by market cap
    const coinIds = [
      'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana',
      'usd-coin', 'xrp', 'cardano', 'dogecoin', 'avalanche-2',
      'shiba-inu', 'polkadot', 'polygon', 'litecoin', 'chainlink',
      'bitcoin-cash', 'near', 'uniswap', 'ethereum-classic', 'stellar',
      // Add more as needed
    ]

    // Fetch from CoinGecko
    const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false`
    
    const response = await fetch(coingeckoUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const prices: CoinGeckoPrice[] = await response.json()

    // Prepare batch insert
    const priceHistoryEntries = prices.map((coin) => ({
      coin_id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      price_usd: coin.current_price,
      market_cap_usd: coin.market_cap,
      volume_24h_usd: coin.total_volume,
      price_change_24h: coin.price_change_24h,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      high_24h: coin.high_24h,
      low_24h: coin.low_24h,
      source: 'coingecko',
      created_at: new Date().toISOString(),
    }))

    // Insert into price_history table
    const { error: insertError } = await supabase
      .from('price_history')
      .insert(priceHistoryEntries)

    if (insertError) {
      console.error('Error inserting price history:', insertError)
      throw insertError
    }

    // Broadcast price updates via Realtime
    // This allows frontend to receive updates without polling
    const broadcastData = prices.map((coin) => ({
      coin_id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price,
      change_24h: coin.price_change_percentage_24h,
      timestamp: new Date().toISOString(),
    }))

    // Broadcast to 'price_updates' channel
    const { error: broadcastError } = await supabase.channel('price_updates').send({
      type: 'broadcast',
      event: 'price_update',
      payload: {
        prices: broadcastData,
        timestamp: new Date().toISOString(),
      },
    })

    if (broadcastError) {
      console.error('Broadcast error (non-critical):', broadcastError)
      // Don't fail the function if broadcast fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        coins_updated: prices.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Price aggregator error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
