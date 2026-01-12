import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hiuemmkhwiaarpdyncgj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDgxNDAsImV4cCI6MjA4MDc4NDE0MH0.FRHPXLUx-okrpdVUnhBPZdagg4MCTvUDGowa0dsSMrQ'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwODE0MCwiZXhwIjoyMDgwNzg0MTQwfQ.-3y1gFjuhkamg5L6wMVIQWhCUy9SXU5cSWo7uNpQdbc'

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Server-side Supabase client (uses service role key, bypasses RLS)
// Only use this in API routes/server components
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
