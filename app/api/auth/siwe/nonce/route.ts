// ============================================
// Krypto Trac: SIWE Nonce Generator
// Generates unique nonce for Sign-In With Ethereum
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Generate random nonce
    const nonce = crypto.randomUUID()
    
    // Store nonce in session/cache (optional - can use Redis or database)
    // For simplicity, we'll just return it
    // In production, store with expiration (5 minutes)
    
    return NextResponse.json({ nonce }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate nonce' },
      { status: 500 }
    )
  }
}
