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

    // Sanitize metadata - only keep safe fields (PII hygiene)
    const safeMetadata: Record<string, any> = {}
    if (metadata) {
      // Only allow safe metadata fields
      const allowedKeys = ['stripe_event_id', 'stripe_customer_id', 'subscription_id', 'price_id']
      for (const key of allowedKeys) {
        if (metadata[key]) {
          safeMetadata[key] = metadata[key]
        }
      }
    }

    // Create log entry (PII-safe)
    const logEntry: WebhookLog = {
      event_type: event_type || 'unknown',
      user_id,
      feature,
      status: status || 'success',
      duration_ms,
      error_message,
      metadata: safeMetadata,
    }

    // Insert into webhook_logs table (create if doesn't exist)
    // Use try/catch with EdgeRuntime.waitUntil for background retry (if needed)
    try {
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
        // Insert failed - write to dead-letter table for retry
        console.error('Webhook telemetry error:', error)
        
        try {
          await supabase
            .from('dead_letter_webhook_logs')
            .insert({
              original_log_data: {
                event_type: logEntry.event_type,
                user_id: logEntry.user_id,
                feature: logEntry.feature,
                status: logEntry.status,
                duration_ms: logEntry.duration_ms,
                error_message: logEntry.error_message,
                metadata: logEntry.metadata,
                created_at: new Date().toISOString(),
              },
              failure_reason: error.message || 'Unknown error',
              status: 'pending',
            })
        } catch (dlError: any) {
          // Dead-letter insert also failed - log to console only
          console.error('Dead-letter insert failed:', dlError)
          console.log('Webhook log (fallback):', JSON.stringify(logEntry))
        }
      }
    } catch (telemetryError: any) {
      // Non-blocking: telemetry failures should not break webhook processing
      console.error('Telemetry insert failed (non-blocking):', telemetryError)
      
      // Attempt dead-letter write
      try {
        await supabase
          .from('dead_letter_webhook_logs')
          .insert({
            original_log_data: {
              event_type: logEntry.event_type,
              user_id: logEntry.user_id,
              feature: logEntry.feature,
              status: logEntry.status,
              duration_ms: logEntry.duration_ms,
              error_message: logEntry.error_message,
              metadata: logEntry.metadata,
              created_at: new Date().toISOString(),
            },
            failure_reason: telemetryError.message || 'Unknown error',
            status: 'pending',
          })
      } catch (dlError: any) {
        console.error('Dead-letter insert failed:', dlError)
      }
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
