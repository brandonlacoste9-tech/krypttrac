// ============================================
// Krypto Trac: Vertex AI Sentinel Anomaly Detection
// Detects "smell of danger" - behavioral signatures of theft
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { VertexAI } from 'https://esm.sh/@google-cloud/vertexai@latest'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnomalyDetectionRequest {
  user_id?: string
  transaction_data?: any
  activity_data?: any
  ip_address?: string
  user_agent?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { user_id, transaction_data, activity_data, ip_address, user_agent }: AnomalyDetectionRequest = await req.json()

    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')!,
      location: 'us-central1',
    })

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    })

    // Fetch user's recent activity for context
    let userContext = {}
    if (user_id) {
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: recentActivity } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(20)

      userContext = {
        recent_transactions: recentTransactions || [],
        recent_activity: recentActivity || [],
      }
    }

    // Build anomaly detection prompt
    const prompt = `
You are a cybersecurity Sentinel AI analyzing cryptocurrency transaction patterns for theft detection.

User Context:
${JSON.stringify(userContext, null, 2)}

Current Activity:
${JSON.stringify({
  transaction: transaction_data,
  activity: activity_data,
  ip_address,
  user_agent,
}, null, 2)}

Analyze this activity for behavioral signatures of theft or unauthorized access:

1. **Massive Withdrawal Anomaly**: Unusually large withdrawal compared to user's history
2. **New Mixer Address**: Transaction to known mixer/tumbler address
3. **IP Anomaly**: Login from unusual geographic location
4. **Session Hijack**: Multiple simultaneous sessions from different IPs
5. **API Key Compromise**: Unusual API calls or patterns
6. **Vault Breach Attempt**: Multiple failed authentication attempts

Detect if this activity represents a threat. Consider:
- Deviation from normal user behavior
- Transaction patterns matching known attack vectors
- Geographic/IP anomalies
- Timing anomalies (unusual hours)
- Amount anomalies (unusually large)

Respond with JSON:
{
  "threat_detected": <true|false>,
  "event_type": "<ip_anomaly|unauthorized_access|ai_threat_detected|massive_withdrawal|new_mixer_address|suspicious_transaction|session_hijack_attempt|api_key_compromise|vault_breach_attempt>",
  "severity": "<low|medium|high|critical>",
  "threat_signature": "<description of behavioral signature>",
  "confidence": <0-100>,
  "reasoning": "<explanation>",
  "recommended_action": "<block_ip|revoke_sessions|lock_account|notify_user>"
}
`

    // Optimize prompt for deterministic JSON response
    const jsonGuard = `
IMPORTANT: You MUST respond with ONLY valid JSON. No markdown, no explanations, no code blocks.
Expected JSON schema:
{
  "threat_detected": boolean,
  "event_type": string,
  "severity": "low" | "medium" | "high" | "critical",
  "threat_signature": string,
  "confidence": number (0-100),
  "reasoning": string,
  "recommended_action": string
}
`
    const optimizedPrompt = prompt + '\n\n' + jsonGuard

    // Generate threat analysis
    const result = await model.generateContent(optimizedPrompt)
    const response = result.response
    const analysisText = response.text()

    // Parse analysis JSON with validation
    let cleaned = analysisText.trim()
    cleaned = cleaned.replace(/^```json\s*/i, '')
    cleaned = cleaned.replace(/^```\s*/i, '')
    cleaned = cleaned.replace(/\s*```$/i, '')
    
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse threat analysis JSON')
    }

    const analysis = JSON.parse(jsonMatch[0])
    
    // Validate required fields
    if (typeof analysis.threat_detected !== 'boolean') {
      throw new Error('Invalid threat_detected field')
    }
    if (!['low', 'medium', 'high', 'critical'].includes(analysis.severity)) {
      throw new Error('Invalid severity value')
    }

    // If threat detected, log security event
    if (analysis.threat_detected) {
      const { data: securityEvent, error: eventError } = await supabase
        .from('security_events')
        .insert({
          user_id: user_id || null,
          event_type: analysis.event_type,
          severity: analysis.severity,
          threat_signature: analysis.threat_signature,
          ip_address: ip_address || null,
          user_agent: user_agent || null,
          metadata: {
            transaction_data,
            activity_data,
            reasoning: analysis.reasoning,
            recommended_action: analysis.recommended_action,
          },
          ai_confidence: analysis.confidence,
          vertex_ai_model_version: 'sentinel-v1',
        })
        .select()
        .single()

      if (eventError) {
        throw eventError
      }

      // If critical, trigger immediate actions
      if (analysis.severity === 'critical' && user_id) {
        // Lockdown is automatically triggered by database trigger
        // But we can also broadcast immediately
        await supabase.channel('security_alerts').send({
          type: 'broadcast',
          event: 'critical_threat',
          payload: {
            user_id,
            event_id: securityEvent.id,
            threat_type: analysis.event_type,
            timestamp: new Date().toISOString(),
          },
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          threat_detected: true,
          security_event: {
            id: securityEvent.id,
            event_type: analysis.event_type,
            severity: analysis.severity,
            confidence: analysis.confidence,
            recommended_action: analysis.recommended_action,
          },
          lockdown_triggered: analysis.severity === 'critical',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // No threat detected
    return new Response(
      JSON.stringify({
        success: true,
        threat_detected: false,
        message: 'No threats detected',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Sentinel anomaly detection error:', error)
    
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
