// ============================================
// Krypto Trac: Fee Collection Edge Function
// Collects pending fees into corporate wallet
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CollectFeesRequest {
  transaction_ids?: string[] // Optional: specific transactions to collect
  min_amount?: number // Optional: minimum amount to batch collect
  corporate_wallet?: string // Corporate wallet address
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { transaction_ids, min_amount = 100, corporate_wallet }: CollectFeesRequest = await req.json()

    // Get pending transactions
    let query = supabase
      .from('transaction_history')
      .select('*')
      .eq('status', 'pending')

    if (transaction_ids && transaction_ids.length > 0) {
      query = query.in('id', transaction_ids)
    }

    const { data: pendingTransactions, error: fetchError } = await query

    if (fetchError) {
      throw fetchError
    }

    if (!pendingTransactions || pendingTransactions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending transactions to collect',
          collected_count: 0,
          total_amount: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Calculate total amount
    const totalAmount = pendingTransactions.reduce((sum, tx) => sum + parseFloat(tx.fee_amount), 0)

    // Check if meets minimum amount threshold
    if (totalAmount < min_amount) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Total amount $${totalAmount.toFixed(2)} is below minimum $${min_amount}`,
          pending_amount: totalAmount,
          pending_count: pendingTransactions.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Collect fees (in production, this would transfer to corporate wallet)
    const transactionIds = pendingTransactions.map(tx => tx.id)
    
    // In production, you would:
    // 1. Aggregate fees into a single payment
    // 2. Transfer to corporate wallet (Stripe, crypto, etc.)
    // 3. Get transaction hash from payment processor
    
    // For now, we'll simulate collection
    const collectionTxHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`

    // Mark transactions as collected
    const { data: collectedData, error: collectError } = await supabase.rpc('collect_fees', {
      p_transaction_ids: transactionIds,
      p_collection_tx_hash: collectionTxHash,
    })

    if (collectError) {
      throw collectError
    }

    // Broadcast revenue update
    await supabase.channel('revenue_updates').send({
      type: 'broadcast',
      event: 'fees_collected',
      payload: {
        transaction_count: collectedData,
        total_amount: totalAmount,
        tx_hash: collectionTxHash,
        timestamp: new Date().toISOString(),
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        collected_count: collectedData,
        total_amount: totalAmount,
        collection_tx_hash: collectionTxHash,
        message: `Successfully collected $${totalAmount.toFixed(2)} from ${collectedData} transactions`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Collect fees error:', error)
    
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
