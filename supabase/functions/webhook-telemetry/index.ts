// ============================================
// Krypto Trac: Webhook Telemetry Edge Function
// Logs webhook invocations and durations for observability
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookLog {
  event_type: string
  user_id?: string
  feature?: string
  status: 'success' | 'error'
  duration_ms: number
  error_message?: string
  metadata?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { event_type, user_id, feature, status, error_message, metadata } = body

    // Calculate duration
    const duration_ms = Date.now() - startTime

    // Create log entry
    const logEntry: WebhookLog = {
      event_type: event_type || 'unknown',
      user_id,
      feature,
      status: status || 'success',
      duration_ms,
      error_message,
      metadata,
    }

    // Insert into webhook_logs table (create if doesn't exist)
    const { error } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: logEntry.event_type,
        user_id: logEntry.user_id,
        feature: logEntry.feature,
        status: logEntry.status,
        duration_ms: logEntry.duration_ms,
        error_message: logEntry.error_message,
        metadata: logEntry.metadata,
        created_at: new Date().toISOString(),
      })

    if (error) {
      // If table doesn't exist, log to console (non-blocking)
      console.error('Webhook telemetry error:', error)
      console.log('Webhook log:', JSON.stringify(logEntry))
    }

    return new Response(
      JSON.stringify({ success: true, logged: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    const duration_ms = Date.now() - startTime
    
    console.error('Telemetry function error:', error)
    console.log('Failed webhook log:', {
      event_type: 'telemetry_error',
      status: 'error',
      duration_ms,
      error_message: error.message,
    })

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
