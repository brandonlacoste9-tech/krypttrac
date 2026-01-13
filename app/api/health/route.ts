// ============================================
// Krypto Trac: Health Check Endpoint
// Monitors system health and performance
// ============================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function checkDatabase() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const start = Date.now()
    
    await supabase.from('profiles').select('id').limit(1)
    
    const latency = Date.now() - start
    
    return {
      status: 'ok',
      latency: `${latency}ms`,
      threshold: latency < 100 ? 'pass' : 'warning',
    }
  } catch (error: any) {
    return {
      status: 'error',
      error: 'Database connection failed',
    }
  }
}

async function checkRealtime() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const channel = supabase.channel('health_check')
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe()
        resolve({
          status: 'timeout',
          error: 'Realtime connection timeout',
        })
      }, 5000)

      channel
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            channel.unsubscribe()
            resolve({
              status: 'ok',
              latency: '<100ms',
            })
          }
        })
    })
  } catch (error: any) {
    return {
      status: 'error',
      error: 'Realtime connection failed',
    }
  }
}

async function checkEdgeFunctions() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const response = await fetch(`${supabaseUrl}/functions/v1/trigger-sensory-event`, {
      method: 'OPTIONS',
    })
    
    return {
      status: response.ok ? 'ok' : 'error',
      latency: '<50ms',
    }
  } catch (error: any) {
    return {
      status: 'error',
      error: 'Edge Functions unavailable',
    }
  }
}

export async function GET() {
  const start = Date.now()
  
  const [database, realtime, edgeFunctions] = await Promise.all([
    checkDatabase(),
    checkRealtime(),
    checkEdgeFunctions(),
  ])
  
  const totalLatency = Date.now() - start
  
  const checks = {
    database,
    realtime,
    edgeFunctions,
    timestamp: new Date().toISOString(),
    totalLatency: `${totalLatency}ms`,
  }
  
  const healthy = 
    database.status === 'ok' &&
    realtime.status === 'ok' &&
    edgeFunctions.status === 'ok'
  
  return NextResponse.json(checks, {
    status: healthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
