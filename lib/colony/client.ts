/**
 * Colony OS Client Integration
 * Cryptographic wallet signing with Ed25519
 */

import { signMessage, createSignedRequest, SignedRequest } from '@/lib/crypto/signature'
import { scanTransaction, SecurityAuditResult, TransactionMetadata } from '@/lib/security/guardian'

export interface ColonyTransaction {
  contractAddress: string
  functionName: string
  functionArgs?: any[]
  value?: string
  chainId: number
}

export interface ColonyClient {
  isConnected: boolean
  address?: string
  publicKey?: string
}

/**
 * Initialize Colony OS wallet connection
 * Returns a Colony client if wallet is available
 */
export async function initColonyOS(): Promise<ColonyClient | null> {
  try {
    // Check if Colony OS provider is available (window.colony)
    if (typeof window !== 'undefined' && (window as any).colony) {
      const colony = (window as any).colony
      
      // Request connection
      await colony.request({ method: 'colony_connect' })
      
      // Get public key
      const accounts = await colony.request({ method: 'colony_accounts' })
      const publicKey = await colony.request({ method: 'colony_getPublicKey' })
      
      return {
        isConnected: true,
        address: accounts[0],
        publicKey: publicKey,
      }
    }
    
    // Fallback: Use MetaMask or other wallet providers
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      
      return {
        isConnected: true,
        address: accounts[0],
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to initialize Colony OS:', error)
    return null
  }
}

/**
 * Sign a transaction using Colony OS wallet
 * Prepares transaction for Magnum Opus staking
 */
export async function signTransaction(
  transaction: ColonyTransaction,
  client: ColonyClient
): Promise<SignedRequest | null> {
  try {
    if (!client.isConnected || !client.publicKey) {
      throw new Error('Colony OS wallet not connected')
    }
    
    // Convert transaction to message for signing
    const message = JSON.stringify({
      contractAddress: transaction.contractAddress,
      functionName: transaction.functionName,
      functionArgs: transaction.functionArgs || [],
      value: transaction.value || '0',
      chainId: transaction.chainId,
      timestamp: Date.now(),
    })
    
    // Sign with Colony OS provider
    if (typeof window !== 'undefined' && (window as any).colony) {
      const colony = (window as any).colony
      const signature = await colony.request({
        method: 'colony_signMessage',
        params: [message],
      })
      
      // Create signed request object
      return {
        signature: signature,
        publicKey: client.publicKey,
        message: message,
        timestamp: Date.now(),
        nonce: Date.now().toString(),
      }
    }
    
    // Fallback: This would require private key (not recommended for production)
    // In production, use Colony OS provider or similar wallet extension
    throw new Error('Colony OS provider not available')
  } catch (error: any) {
    console.error('Failed to sign transaction:', error)
    return null
  }
}

/**
 * Sign a transaction using Colony OS
 * Includes security scanning before signing
 */
export async function signTransactionWithColony(
  transaction: ColonyTransaction,
  privateKeyHex: string
): Promise<{
  signedRequest: SignedRequest
  auditResult: SecurityAuditResult
  proceed: boolean
}> {
  // First, scan transaction for security risks
  const auditResult = await scanTransaction({
    contractAddress: transaction.to,
    value: transaction.value,
    chainId: transaction.chainId,
  })

  // If blocked, don't sign
  if (auditResult.status === 'BLOCK') {
    return {
      signedRequest: {} as SignedRequest,
      auditResult,
      proceed: false,
    }
  }

  // Create signed request
  const signedRequest = await createSignedRequest(
    {
      transaction,
      timestamp: Date.now(),
    },
    privateKeyHex
  )

  return {
    signedRequest,
    auditResult,
    proceed: true,
  }
}

/**
 * Execute a signed transaction via Colony OS
 */
export async function executeSignedTransaction(
  signedRequest: SignedRequest,
  apiEndpoint: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signedRequest.signature,
        'x-public-key': signedRequest.publicKey,
        'x-message': signedRequest.message,
        'x-timestamp': signedRequest.timestamp.toString(),
        'x-nonce': signedRequest.nonce,
      },
      body: JSON.stringify({
        transaction: JSON.parse(signedRequest.message),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Transaction failed',
      }
    }

    return {
      success: true,
      txHash: data.txHash,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to execute transaction',
    }
  }
}
