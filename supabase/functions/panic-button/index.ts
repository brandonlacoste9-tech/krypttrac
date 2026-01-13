// ============================================
// Krypto Trac: Panic Button Edge Function
// Total account lockdown with vault clearing
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PanicButtonRequest {
  user_id: string
  reason?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { user_id, reason = 'User-initiated panic button' }: PanicButtonRequest = await req.json()

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (profileError || !profile) {
      throw new Error('User not found')
    }

    // Create security event
    const { data: securityEvent, error: eventError } = await supabase
      .from('security_events')
      .insert({
        user_id,
        event_type: 'panic_button',
        severity: 'critical',
        threat_signature: 'User-initiated total lockdown',
        metadata: {
          reason,
          initiated_by: 'user',
        },
        ai_confidence: 100, // User-initiated, so 100% confidence
      })
      .select()
      .single()

    if (eventError) {
      throw eventError
    }

    // Lock account (triggers vault clearing, session revocation, etc.)
    const { data: lockdown, error: lockError } = await supabase.rpc('lock_account', {
      p_user_id: user_id,
      p_locked_by: 'panic_button',
      p_lock_reason: reason,
      p_security_event_id: securityEvent.id,
    })

    if (lockError) {
      throw lockError
    }

    // Get lockdown details
    const { data: lockdownDetails } = await supabase
      .from('security_lockdown')
      .select('*')
      .eq('id', lockdown)
      .single()

    // Broadcast lockdown event
    await supabase.channel('security_alerts').send({
      type: 'broadcast',
      event: 'panic_lockdown',
      payload: {
        user_id,
        lockdown_id: lockdown,
        timestamp: new Date().toISOString(),
      },
    })

    // Broadcast to user's personal channel for UI update
    await supabase.channel(`user:${user_id}`).send({
      type: 'broadcast',
      event: 'lockdown_activated',
      payload: {
        status: 'locked',
        message: 'Account locked. Vault cleared. All sessions revoked.',
        timestamp: new Date().toISOString(),
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        locked: true,
        lockdown_id: lockdown,
        vault_cleared: lockdownDetails?.vault_cleared || false,
        sessions_revoked: lockdownDetails?.sessions_revoked || false,
        api_keys_revoked: lockdownDetails?.api_keys_revoked || false,
        withdrawals_blocked: lockdownDetails?.withdrawals_blocked || false,
        message: 'Total lockdown activated. Account secured.',
        recovery_method: 'hardware_key', // Panic button requires hardware key recovery
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Panic button error:', error)
    
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
