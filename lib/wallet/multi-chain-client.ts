// ============================================
// Krypto Trac: Multi-Chain Wallet Client
// Unified interface for Ethereum, Solana, and L2s
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface WalletSlot {
  id: string
  wallet_address: string
  network: 'ethereum' | 'solana' | 'polygon' | 'arbitrum' | 'base' | 'optimism'
  wallet_name?: string
  is_active: boolean
  connected_at: string
  last_used_at?: string
}

/**
 * Get user's connected wallets
 */
export async function getConnectedWallets(userId: string): Promise<WalletSlot[]> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase
    .from('wallet_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false })

  if (error) {
    console.error('Error fetching wallets:', error)
    return []
  }

  return (data || []) as WalletSlot[]
}

/**
 * Check if user can add another wallet
 */
export async function canAddWallet(userId: string): Promise<{ canAdd: boolean; reason?: string }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase.rpc('can_add_wallet', {
    p_user_id: userId,
  })

  if (error) {
    return { canAdd: false, reason: error.message }
  }

  if (data === true) {
    return { canAdd: true }
  }

  // Check current slot count
  const { data: slotCount } = await supabase.rpc('get_wallet_slot_count', {
    p_user_id: userId,
  })

  return {
    canAdd: false,
    reason: `Free tier allows 1 wallet. Additional slots: $2/mo. You have ${slotCount || 0} slots.`,
  }
}

/**
 * Connect wallet via SIWE
 */
export async function connectWallet(
  userId: string,
  walletAddress: string,
  network: WalletSlot['network'],
  walletName?: string
): Promise<{ success: boolean; slotId?: string; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Check if can add
  const { canAdd, reason } = await canAddWallet(userId)
  if (!canAdd) {
    // If not free tier, trigger Stripe checkout
    if (reason?.includes('$2/mo')) {
      // Trigger checkout for wallet slot
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'wallet_slot',
          price_id: process.env.NEXT_PUBLIC_WALLET_SLOT_PRICE_ID || 'price_wallet_slot_2',
        }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
        return { success: false, error: 'Redirecting to checkout...' }
      }
    }
    return { success: false, error: reason }
  }

  // Add wallet slot
  const { data: slotId, error } = await supabase.rpc('add_wallet_slot', {
    p_user_id: userId,
    p_wallet_address: walletAddress,
    p_network: network,
    p_wallet_name: walletName,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, slotId }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(slotId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { error } = await supabase
    .from('wallet_slots')
    .update({ is_active: false })
    .eq('id', slotId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get wallet balance (using blockchain wrappers)
 */
export async function getWalletBalance(
  walletAddress: string,
  network: WalletSlot['network']
): Promise<{ balance: number; currency: string } | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  if (network === 'ethereum' || network === 'polygon' || network === 'arbitrum' || network === 'base' || network === 'optimism') {
    // Use Ethereum RPC function
    const { data, error } = await supabase.rpc('fetch_token_balance', {
      p_address: walletAddress,
      p_token_address: null, // ETH balance
    })

    if (error) {
      console.error('Error fetching balance:', error)
      return null
    }

    return { balance: parseFloat(data || '0'), currency: 'ETH' }
  } else if (network === 'solana') {
    // Solana balance fetch (would use Solana RPC)
    // Placeholder for now
    return { balance: 0, currency: 'SOL' }
  }

  return null
}
