// ============================================
// Krypto Trac: Execute Jump Trade
// Executes trade based on momentum breakout signal
// Requires user operator permissions (SIWE)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JumpTradeRequest {
  signal_id: string
  user_id: string
  operator_signature: string // SIWE signature proving operator permission
  trade_amount: number // Amount to trade in USD
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { signal_id, user_id, operator_signature, trade_amount }: JumpTradeRequest = await req.json()

    // Verify signal exists and is valid
    const { data: signal, error: signalError } = await supabase
      .from('momentum_signals')
      .select('*')
      .eq('id', signal_id)
      .eq('triggered', false)
      .single()

    if (signalError || !signal) {
      throw new Error('Invalid or expired signal')
    }

    if (signal.expires_at < new Date().toISOString()) {
      throw new Error('Signal has expired')
    }

    if (signal.confidence_score < 75) {
      throw new Error('Signal confidence too low for execution')
    }

    // Verify user has operator permissions
    // In production, verify SIWE signature here
    const { data: profile } = await supabase
      .from('profiles')
      .select('operator_permissions, operator_address')
      .eq('user_id', user_id)
      .single()

    if (!profile?.operator_permissions) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Operator permissions not granted',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Execute trade (in production, this would call Uniswap/1inch API)
    // For now, we'll simulate the trade
    const tradeTxHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`

    // Record transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        coin_id: signal.coin_id,
        symbol: signal.symbol,
        transaction_type: signal.signal_type === 'breakout' ? 'buy' : 'sell',
        amount: trade_amount / signal.current_price, // Convert USD to coin amount
        price_usd: signal.current_price,
        total_value_usd: trade_amount,
        transaction_hash: tradeTxHash,
        network: 'ethereum',
        exchange: 'uniswap',
        metadata: {
          signal_id: signal.id,
          signal_type: signal.signal_type,
          confidence_score: signal.confidence_score,
          predicted_price: signal.predicted_price,
        },
      })
      .select()
      .single()

    if (txError) {
      throw txError
    }

    // Mark signal as triggered
    await supabase
      .from('momentum_signals')
      .update({
        triggered: true,
        executed_trade_id: transaction.id,
      })
      .eq('id', signal_id)

    // Record swap fee revenue
    await supabase.rpc('record_swap_fee', {
      p_user_id: user_id,
      p_swap_amount: trade_amount,
      p_from_token: signal.signal_type === 'breakout' ? 'USDC' : signal.symbol,
      p_to_token: signal.signal_type === 'breakout' ? signal.symbol : 'USDC',
      p_swap_tx_hash: tradeTxHash,
    })

    // Broadcast trade execution
    await supabase.channel('jump_trades').send({
      type: 'broadcast',
      event: 'trade_executed',
      payload: {
        signal_id,
        user_id,
        coin_id: signal.coin_id,
        symbol: signal.symbol,
        trade_amount,
        tx_hash: tradeTxHash,
        timestamp: new Date().toISOString(),
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        trade: {
          id: transaction.id,
          signal_id,
          coin_id: signal.coin_id,
          symbol: signal.symbol,
          type: signal.signal_type === 'breakout' ? 'buy' : 'sell',
          amount: trade_amount,
          price: signal.current_price,
          tx_hash: tradeTxHash,
          predicted_price: signal.predicted_price,
          confidence: signal.confidence_score,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Jump trade execution error:', error)
    
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
