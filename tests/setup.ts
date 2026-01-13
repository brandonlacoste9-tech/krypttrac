// ============================================
// Krypto Trac: Test Setup
// ============================================

import { vi } from 'vitest'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        send: vi.fn().mockResolvedValue({}),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn(),
      })),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }
})

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
