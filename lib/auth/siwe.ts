// ============================================
// Krypto Trac: Sign-In With Ethereum (SIWE)
// Wallet-based authentication using Supabase Auth
// ============================================

import { createClient } from '@supabase/supabase-js'
import { SiweMessage } from 'siwe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface SIWESession {
  message: string
  signature: string
  address: string
}

/**
 * Generate SIWE message for user to sign
 */
export async function generateSIWEMessage(
  address: string,
  chainId: number = 1
): Promise<string> {
  const domain = window.location.host
  const origin = window.location.origin
  
  const message = new SiweMessage({
    domain,
    address,
    statement: 'Sign in with Ethereum to Krypto Trac',
    uri: origin,
    version: '1',
    chainId,
    nonce: await generateNonce(),
  })
  
  return message.prepareMessage()
}

/**
 * Generate nonce for SIWE
 */
async function generateNonce(): Promise<string> {
  const response = await fetch('/api/auth/siwe/nonce', {
    method: 'GET',
  })
  
  const { nonce } = await response.json()
  return nonce
}

/**
 * Sign in with Ethereum wallet
 */
export async function signInWithEthereum(
  message: string,
  signature: string,
  address: string
): Promise<{ session: any; error: any }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Verify SIWE message and signature
  const siweMessage = new SiweMessage(message)
  const fields = await siweMessage.validate(signature)
  
  if (!fields) {
    return { session: null, error: { message: 'Invalid signature' } }
  }
  
  // Sign in with Supabase using custom JWT
  // Note: This requires a custom auth provider setup in Supabase
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'wallet',
    token: signature,
    access_token: signature, // Use signature as access token
  })
  
  if (error) {
    // If user doesn't exist, create account
    if (error.message.includes('User not found')) {
      return await signUpWithEthereum(message, signature, address)
    }
    return { session: null, error }
  }
  
  return { session: data.session, error: null }
}

/**
 * Sign up with Ethereum wallet
 */
async function signUpWithEthereum(
  message: string,
  signature: string,
  address: string
): Promise<{ session: any; error: any }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Create user with wallet address
  const { data, error } = await supabase.auth.signUp({
    email: `${address}@wallet.local`, // Placeholder email
    password: signature, // Use signature as password (will be replaced)
    options: {
      data: {
        wallet_address: address,
        auth_provider: 'wallet',
      },
    },
  })
  
  if (error) {
    return { session: null, error }
  }
  
  // Update user metadata with wallet address
  await supabase.auth.updateUser({
    data: {
      wallet_address: address,
      auth_provider: 'wallet',
    },
  })
  
  return { session: data.session, error: null }
}

/**
 * Connect wallet and initiate SIWE flow
 */
export async function connectWallet(): Promise<{
  address: string | null
  error: any
}> {
  try {
    // Request account access
    const accounts = await (window as any).ethereum.request({
      method: 'eth_requestAccounts',
    })
    
    if (accounts.length === 0) {
      return { address: null, error: { message: 'No accounts found' } }
    }
    
    const address = accounts[0]
    
    // Get chain ID
    const chainId = await (window as any).ethereum.request({
      method: 'eth_chainId',
    })
    
    // Generate SIWE message
    const message = await generateSIWEMessage(address, parseInt(chainId, 16))
    
    // Request signature
    const signature = await (window as any).ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    })
    
    // Sign in with Supabase
    const { session, error } = await signInWithEthereum(message, signature, address)
    
    if (error) {
      return { address: null, error }
    }
    
    return { address, error: null }
  } catch (error: any) {
    return { address: null, error }
  }
}
