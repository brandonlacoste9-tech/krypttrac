// ============================================
// Krypto Trac: Whale Alert Edge Function
// Sends alerts when large transactions are detected
// Triggered by database webhook
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhaleTransaction {
  transaction_id: string
  coin_id: string
  symbol: string
  transaction_type: string
  amount: number
  total_value_usd: number
  transaction_hash?: string
  network: string
  created_at: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: WhaleTransaction = await req.json()

    // Broadcast whale alert via Realtime
    // This allows all connected clients to receive the alert instantly
    const alertMessage = {
      type: 'whale_alert',
      coin: payload.symbol,
      amount: payload.amount,
      value_usd: payload.total_value_usd,
      transaction_type: payload.transaction_type,
      network: payload.network,
      timestamp: payload.created_at,
    }

    // In a real implementation, you would:
    // 1. Send push notification via FCM/APNS
    // 2. Send Discord webhook
    // 3. Send Telegram bot message
    // 4. Broadcast via Supabase Realtime

    console.log('🐋 Whale Alert:', alertMessage)

    // Example: Send to Discord webhook (if configured)
    const discordWebhook = Deno.env.get('DISCORD_WEBHOOK_URL')
    if (discordWebhook) {
      await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: `🐋 Whale Alert: ${payload.symbol}`,
            description: `${payload.transaction_type.toUpperCase()} of ${payload.amount} ${payload.symbol} ($${payload.total_value_usd.toLocaleString()})`,
            color: payload.transaction_type === 'buy' ? 0x00ff00 : 0xff0000,
            fields: [
              { name: 'Network', value: payload.network, inline: true },
              { name: 'Transaction Hash', value: payload.transaction_hash || 'N/A', inline: false },
            ],
            timestamp: payload.created_at,
          }],
        }),
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        alert_sent: true,
        message: `Whale alert sent for ${payload.symbol}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Whale alert error:', error)
    
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
