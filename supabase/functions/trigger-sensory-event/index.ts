// ============================================
// Krypto Trac: Sensory Event Trigger Edge Function
// Broadcasts sensory events for synchronized haptic/visual feedback
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SensoryEventRequest {
  type: 'WINNING_SLOT' | 'SENTINEL_NUDGE' | 'VAULT_THUD' | 'TRADE_CLOSE' | 'SECURITY_ALERT' | 'SUCCESS' | 'CONFIRM'
  user_id?: string
  metadata?: {
    amount?: number
    currency?: string
    confidence?: number
    reason?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { type, user_id, metadata }: SensoryEventRequest = await req.json()

    // Broadcast sensory event
    await supabase.channel('sensory_events').send({
      type: 'broadcast',
      event: 'sensory_trigger',
      payload: {
        type,
        userId: user_id,
        metadata,
        timestamp: new Date().toISOString(),
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        event_type: type,
        broadcast: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Sensory event trigger error:', error)
    
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
