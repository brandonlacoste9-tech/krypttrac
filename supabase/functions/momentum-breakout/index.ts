// ============================================
// Krypto Trac: Momentum Breakout Detection
// Uses Vertex AI to predict momentum breakouts for jump trades
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { VertexAI } from 'https://esm.sh/@google-cloud/vertexai@latest'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MomentumRequest {
  coin_id: string
  symbol: string
  timeframe?: '5m' | '15m' | '1h' | '4h' | '24h'
}

interface MarketFeatures {
  price: number
  volume_24h: number
  price_change_24h: number
  price_change_pct_24h: number
  high_24h: number
  low_24h: number
  rsi: number
  macd: number
  macd_signal: number
  macd_histogram: number
  support_level: number
  resistance_level: number
  volume_surge: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { coin_id, symbol, timeframe = '1h' }: MomentumRequest = await req.json()

    // Fetch current market data
    const { data: latestPrice } = await supabase
      .from('price_history')
      .select('*')
      .eq('coin_id', coin_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!latestPrice) {
      throw new Error('Price data not found')
    }

    // Fetch historical price data for technical analysis
    const { data: priceHistory } = await supabase
      .from('price_history')
      .select('price_usd, volume_24h_usd, created_at')
      .eq('coin_id', coin_id)
      .order('created_at', { ascending: false })
      .limit(100)

    // Calculate technical indicators
    const prices = (priceHistory || []).map(p => parseFloat(p.price_usd)).reverse()
    const volumes = (priceHistory || []).map(p => parseFloat(p.volume_24h_usd || '0')).reverse()

    // Calculate RSI (simplified)
    const rsi = calculateRSI(prices, 14)
    
    // Calculate MACD (simplified)
    const macd = calculateMACD(prices)
    
    // Calculate support/resistance levels
    const supportLevel = Math.min(...prices.slice(-20))
    const resistanceLevel = Math.max(...prices.slice(-20))
    
    // Calculate volume surge
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
    const currentVolume = volumes[volumes.length - 1] || 0
    const volumeSurge = ((currentVolume - avgVolume) / avgVolume) * 100

    // Prepare features for Vertex AI
    const marketFeatures: MarketFeatures = {
      price: parseFloat(latestPrice.price_usd),
      volume_24h: parseFloat(latestPrice.volume_24h_usd || '0'),
      price_change_24h: parseFloat(latestPrice.price_change_24h || '0'),
      price_change_pct_24h: parseFloat(latestPrice.price_change_percentage_24h || '0'),
      high_24h: parseFloat(latestPrice.high_24h || '0'),
      low_24h: parseFloat(latestPrice.low_24h || '0'),
      rsi: rsi,
      macd: macd.macd,
      macd_signal: macd.signal,
      macd_histogram: macd.histogram,
      support_level: supportLevel,
      resistance_level: resistanceLevel,
      volume_surge: volumeSurge,
    }

    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')!,
      location: 'us-central1',
    })

    // Use Vertex AI AutoML Tabular Model for momentum prediction
    // In production, you would train a custom model, but for now we'll use Gemini
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    })

    // Build prediction prompt with market features
    const prompt = `
You are an expert cryptocurrency momentum trader. Analyze the following market data and predict if a momentum breakout is imminent.

Market Data for ${symbol} (${coin_id}):
- Current Price: $${marketFeatures.price}
- 24h Change: ${marketFeatures.price_change_pct_24h}%
- Volume 24h: $${marketFeatures.volume_24h.toLocaleString()}
- Volume Surge: ${marketFeatures.volume_surge.toFixed(2)}%
- RSI: ${marketFeatures.rsi.toFixed(2)}
- MACD: ${marketFeatures.macd.toFixed(4)}
- MACD Signal: ${marketFeatures.macd_signal.toFixed(4)}
- MACD Histogram: ${marketFeatures.macd_histogram.toFixed(4)}
- Support Level: $${marketFeatures.support_level}
- Resistance Level: $${marketFeatures.resistance_level}
- High 24h: $${marketFeatures.high_24h}
- Low 24h: $${marketFeatures.low_24h}

Timeframe: ${timeframe}

Analyze these indicators and predict:
1. Signal Type: 'breakout', 'breakdown', 'consolidation', or 'reversal'
2. Confidence Score: 0-100 (how confident are you?)
3. Predicted Price: Expected price after ${timeframe}
4. Price Change %: Expected percentage change
5. Reasoning: Brief explanation of key factors

Key factors to consider:
- RSI > 70 = overbought (bearish), RSI < 30 = oversold (bullish)
- MACD crossing above signal = bullish momentum
- Volume surge + price near resistance = potential breakout
- Price near support with high volume = potential bounce

Format as JSON:
{
  "signal_type": "<breakout|breakdown|consolidation|reversal>",
  "confidence_score": <0-100>,
  "predicted_price": <number>,
  "price_change_pct": <number>,
  "reasoning": "<text>",
  "key_factors": ["<factor1>", "<factor2>"],
  "macd_signal": "<bullish|bearish|neutral>"
}
`

    // Generate prediction
    const result = await model.generateContent(prompt)
    const response = result.response
    const predictionText = response.text()

    // Parse prediction JSON
    const jsonMatch = predictionText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse prediction JSON')
    }

    const prediction = JSON.parse(jsonMatch[0])

    // Calculate expiration time based on timeframe
    const expiresAt = new Date()
    switch (timeframe) {
      case '5m':
        expiresAt.setMinutes(expiresAt.getMinutes() + 5)
        break
      case '15m':
        expiresAt.setMinutes(expiresAt.getMinutes() + 15)
        break
      case '1h':
        expiresAt.setHours(expiresAt.getHours() + 1)
        break
      case '4h':
        expiresAt.setHours(expiresAt.getHours() + 4)
        break
      case '24h':
        expiresAt.setHours(expiresAt.getHours() + 24)
        break
    }

    // Store momentum signal
    const { data: signal, error: insertError } = await supabase
      .from('momentum_signals')
      .insert({
        coin_id,
        symbol,
        signal_type: prediction.signal_type,
        confidence_score: prediction.confidence_score,
        predicted_price: prediction.predicted_price,
        predicted_timeframe: timeframe,
        current_price: marketFeatures.price,
        price_change_pct: prediction.price_change_pct,
        volume_surge_pct: marketFeatures.volume_surge,
        rsi: marketFeatures.rsi,
        macd_signal: prediction.macd_signal,
        support_level: marketFeatures.support_level,
        resistance_level: marketFeatures.resistance_level,
        vertex_ai_model_version: 'momentum-breakout-v1',
        model_confidence: prediction.confidence_score,
        feature_importance: {
          rsi_contribution: marketFeatures.rsi > 70 ? -0.3 : marketFeatures.rsi < 30 ? 0.3 : 0,
          macd_contribution: marketFeatures.macd_histogram > 0 ? 0.25 : -0.25,
          volume_contribution: marketFeatures.volume_surge > 50 ? 0.2 : 0,
          support_resistance: marketFeatures.price > marketFeatures.resistance_level * 0.98 ? 0.15 : 0,
        },
        market_context: {
          price_change_24h: marketFeatures.price_change_pct_24h,
          volume_24h: marketFeatures.volume_24h,
          high_low_spread: ((marketFeatures.high_24h - marketFeatures.low_24h) / marketFeatures.low_24h) * 100,
        },
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // If breakout signal with high confidence, trigger jump trade notification
    if (prediction.signal_type === 'breakout' && prediction.confidence_score >= 80) {
      // Broadcast breakout signal via Realtime
      await supabase.channel('momentum_signals').send({
        type: 'broadcast',
        event: 'breakout_detected',
        payload: {
          coin_id,
          symbol,
          confidence: prediction.confidence_score,
          predicted_price: prediction.predicted_price,
          price_change_pct: prediction.price_change_pct,
          timeframe,
          signal_id: signal.id,
          timestamp: new Date().toISOString(),
        },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        signal: {
          id: signal.id,
          coin_id,
          symbol,
          signal_type: prediction.signal_type,
          confidence_score: prediction.confidence_score,
          predicted_price: prediction.predicted_price,
          current_price: marketFeatures.price,
          price_change_pct: prediction.price_change_pct,
          timeframe,
          reasoning: prediction.reasoning,
          key_factors: prediction.key_factors,
          expires_at: expiresAt.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Momentum breakout error:', error)
    
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

// Helper function to calculate RSI
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50 // Default neutral RSI

  const changes = []
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1])
  }

  const gains = changes.filter(c => c > 0)
  const losses = changes.filter(c => c < 0).map(c => Math.abs(c))

  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

// Helper function to calculate MACD
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 }
  }

  // Calculate EMA12 and EMA26
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  const macd = ema12 - ema26

  // Calculate signal line (EMA of MACD)
  const macdValues = [macd] // Simplified - would need full MACD history
  const signal = calculateEMA(macdValues, 9)

  return {
    macd,
    signal,
    histogram: macd - signal,
  }
}

// Helper function to calculate EMA
function calculateEMA(values: number[], period: number): number {
  if (values.length === 0) return 0
  if (values.length === 1) return values[0]

  const multiplier = 2 / (period + 1)
  let ema = values[0]

  for (let i = 1; i < values.length; i++) {
    ema = (values[i] * multiplier) + (ema * (1 - multiplier))
  }

  return ema
}
