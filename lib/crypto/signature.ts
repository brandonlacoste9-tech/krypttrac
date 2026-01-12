/**
 * Ed25519 Cryptographic Signing for Colony OS
 * Zero-trust authentication using elliptic curve cryptography
 * No passwords, no session tokens - only cryptographic proofs
 */

import { ed25519 } from '@noble/ed25519'

// Convert string to Uint8Array
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Generate a new Ed25519 key pair
 * Private key should be stored securely on the device
 * Public key is stored in Supabase for verification
 */
export async function generateKeyPair(): Promise<{
  publicKey: string
  privateKey: string
}> {
  const privateKey = ed25519.utils.randomPrivateKey()
  const publicKey = await ed25519.getPublicKey(privateKey)

  return {
    publicKey: bytesToHex(publicKey),
    privateKey: bytesToHex(privateKey),
  }
}

/**
 * Sign a message with the user's private key
 * This creates a cryptographic proof that only the owner could generate
 */
export async function signMessage(
  message: string,
  privateKeyHex: string
): Promise<string> {
  const messageBytes = stringToBytes(message)
  const privateKeyBytes = hexToBytes(privateKeyHex)
  const signature = await ed25519.sign(messageBytes, privateKeyBytes)
  return bytesToHex(signature)
}

/**
 * Verify a signature using the user's public key
 * Used by the backend to verify request authenticity
 */
export async function verifySignature(
  message: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const messageBytes = stringToBytes(message)
    const signatureBytes = hexToBytes(signatureHex)
    const publicKeyBytes = hexToBytes(publicKeyHex)
    
    const isValid = await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes)
    return isValid
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Create a signed request payload
 * Includes timestamp and nonce for replay protection
 */
export interface SignedRequest {
  message: string
  signature: string
  publicKey: string
  timestamp: number
  nonce: string
}

export async function createSignedRequest(
  payload: Record<string, any>,
  privateKeyHex: string
): Promise<SignedRequest> {
  const timestamp = Date.now()
  const nonce = crypto.randomUUID()
  
  const messagePayload = {
    ...payload,
    timestamp,
    nonce,
  }
  
  const message = JSON.stringify(messagePayload)
  const signature = await signMessage(message, privateKeyHex)
  
  // Get public key from private key
  const privateKeyBytes = hexToBytes(privateKeyHex)
  const publicKey = await ed25519.getPublicKey(privateKeyBytes)
  
  return {
    message,
    signature,
    publicKey: bytesToHex(publicKey),
    timestamp,
    nonce,
  }
}

/**
 * Verify a signed request (server-side)
 * Checks signature validity and replay protection
 */
export async function verifySignedRequest(
  signedRequest: SignedRequest,
  publicKeyHex: string,
  maxAge: number = 5 * 60 * 1000 // 5 minutes default
): Promise<{ valid: boolean; error?: string }> {
  // Check timestamp (replay protection)
  const age = Date.now() - signedRequest.timestamp
  if (age > maxAge) {
    return { valid: false, error: 'Request expired' }
  }
  
  if (age < 0) {
    return { valid: false, error: 'Invalid timestamp' }
  }
  
  // Verify signature
  const isValid = await verifySignature(
    signedRequest.message,
    signedRequest.signature,
    publicKeyHex
  )
  
  if (!isValid) {
    return { valid: false, error: 'Invalid signature' }
  }
  
  return { valid: true }
}
