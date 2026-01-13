// ============================================
// Krypto Trac: Singleton Supabase Client
// Connection pooling for performance
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let supabaseClient: SupabaseClient | null = null

/**
 * Get singleton Supabase client instance
 * Reuses connection for better performance
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'public' },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10, // Rate limit for Realtime
        },
      },
      global: {
        headers: {
          'x-client-info': 'kryptotrac-web',
        },
      },
    })
  }
  return supabaseClient
}

/**
 * Reset client (useful for testing)
 */
export function resetSupabaseClient() {
  supabaseClient = null
}
