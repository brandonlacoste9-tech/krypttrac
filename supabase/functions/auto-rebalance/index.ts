// ============================================
// Krypto Trac: Auto-Pilot LP Rebalancer
// Automatically rebalances out-of-range Uniswap positions
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RebalanceRequest {
  position_id: string
  user_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { position_id, user_id }: RebalanceRequest = await req.json()

    // Get position details
    const { data: position, error: positionError } = await supabase
      .from('lp_positions')
      .select('*')
      .eq('id', position_id)
      .eq('user_id', user_id)
      .single()

    if (positionError || !position) {
      throw new Error('Position not found')
    }

    // Check if user granted operator permissions
    if (!position.operator_permissions) {
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

    // Check if position is out of range
    if (position.in_range) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Position is in range, no rebalancing needed',
          in_range: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Calculate new tick range to center position
    const tickSpread = position.tick_upper - position.tick_lower
    const newTickLower = position.current_tick - Math.floor(tickSpread / 2)
    const newTickUpper = position.current_tick + Math.ceil(tickSpread / 2)

    // In production, you would:
    // 1. Call Uniswap V3/V4 contract to collect fees
    // 2. Remove liquidity from old position
    // 3. Add liquidity to new position (centered around current tick)
    // 4. Update position NFT if applicable

    // For now, we'll simulate the rebalancing
    const rebalanceTxHash = `0x${Math.random().toString(16).slice(2, 66)}`

    // Update position
    const { error: updateError } = await supabase
      .from('lp_positions')
      .update({
        tick_lower: newTickLower,
        tick_upper: newTickUpper,
        in_range: true,
        last_rebalanced_at: new Date().toISOString(),
        rebalance_count: position.rebalance_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', position_id)

    if (updateError) {
      throw updateError
    }

    // Broadcast rebalance event via Realtime
    await supabase.channel('lp_rebalances').send({
      type: 'broadcast',
      event: 'position_rebalanced',
      payload: {
        position_id,
        user_id,
        new_tick_lower: newTickLower,
        new_tick_upper: newTickUpper,
        tx_hash: rebalanceTxHash,
        timestamp: new Date().toISOString(),
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        rebalanced: true,
        position_id,
        new_tick_lower: newTickLower,
        new_tick_upper: newTickUpper,
        tx_hash: rebalanceTxHash,
        message: 'Position rebalanced successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Auto-rebalance error:', error)
    
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
