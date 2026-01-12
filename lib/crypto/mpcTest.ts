/**
 * MPC Key Verification Tests
 * Verifies that reconstructed keys match original public keys
 */

import { generateShards, reconstructKey, KeyShard } from './mpc'
import { generateKeyPair } from './signature'
import { ed25519 } from '@noble/ed25519'

/**
 * Test MPC key reconstruction
 * Verifies that 2-of-3 shards correctly reconstruct the original private key
 */
export async function testMPCKeyReconstruction(): Promise<{
  success: boolean
  error?: string
  details?: {
    originalPublicKey: string
    reconstructedPublicKey: string
    match: boolean
  }
}> {
  try {
    // Step 1: Generate original key pair
    const { publicKey: originalPublicKey, privateKey: originalPrivateKey } = await generateKeyPair()

    // Step 2: Generate shards
    const deviceId = 'test-device-' + Date.now()
    const shards = await generateShards(originalPrivateKey, deviceId)

    if (shards.length !== 3) {
      return {
        success: false,
        error: `Expected 3 shards, got ${shards.length}`,
      }
    }

    // Step 3: Reconstruct from 2-of-3 shards (shards 0 and 1)
    const twoShards: KeyShard[] = [shards[0], shards[1]]
    const reconstructedPrivateKey = await reconstructKey(twoShards, deviceId)

    if (!reconstructedPrivateKey) {
      return {
        success: false,
        error: 'Failed to reconstruct private key from 2 shards',
      }
    }

    // Step 4: Get public key from reconstructed private key
    const privateKeyBytes = hexToBytes(reconstructedPrivateKey)
    const reconstructedPublicKeyBytes = await ed25519.getPublicKey(privateKeyBytes)
    const reconstructedPublicKey = bytesToHex(reconstructedPublicKeyBytes)

    // Step 5: Verify public keys match
    const match = originalPublicKey.toLowerCase() === reconstructedPublicKey.toLowerCase()

    if (!match) {
      return {
        success: false,
        error: 'Reconstructed public key does not match original',
        details: {
          originalPublicKey,
          reconstructedPublicKey,
          match: false,
        },
      }
    }

    return {
      success: true,
      details: {
        originalPublicKey,
        reconstructedPublicKey,
        match: true,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'MPC key reconstruction test failed',
    }
  }
}

/**
 * Test MPC key reconstruction with different shard combinations
 * Tests all possible 2-of-3 combinations
 */
export async function testAllShardCombinations(): Promise<{
  success: boolean
  passed: number
  total: number
  errors: string[]
}> {
  try {
    const { privateKey } = await generateKeyPair()
    const deviceId = 'test-device-' + Date.now()
    const shards = await generateShards(privateKey, deviceId)

    const combinations = [
      [0, 1], // Shard 0 + Shard 1
      [0, 2], // Shard 0 + Shard 2
      [1, 2], // Shard 1 + Shard 2
    ]

    let passed = 0
    const errors: string[] = []

    for (const [idx1, idx2] of combinations) {
      try {
        const testShards: KeyShard[] = [shards[idx1], shards[idx2]]
        const reconstructed = await reconstructKey(testShards, deviceId)

        if (!reconstructed) {
          errors.push(`Failed to reconstruct with shards ${idx1} and ${idx2}`)
          continue
        }

        // Verify public key matches
        const privateKeyBytes = hexToBytes(reconstructed)
        const publicKeyBytes = await ed25519.getPublicKey(privateKeyBytes)
        const publicKey = bytesToHex(publicKeyBytes)

        const originalPrivateKeyBytes = hexToBytes(privateKey)
        const originalPublicKeyBytes = await ed25519.getPublicKey(originalPrivateKeyBytes)
        const originalPublicKey = bytesToHex(originalPublicKeyBytes)

        if (publicKey.toLowerCase() === originalPublicKey.toLowerCase()) {
          passed++
        } else {
          errors.push(`Public key mismatch with shards ${idx1} and ${idx2}`)
        }
      } catch (error: any) {
        errors.push(`Error testing shards ${idx1} and ${idx2}: ${error.message}`)
      }
    }

    return {
      success: passed === combinations.length,
      passed,
      total: combinations.length,
      errors,
    }
  } catch (error: any) {
    return {
      success: false,
      passed: 0,
      total: 3,
      errors: [error.message || 'Test failed'],
    }
  }
}

// Helper functions
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Run all MPC tests (for testing/debugging)
 */
export async function runAllMPCTests(): Promise<void> {
  console.log('Running MPC Key Reconstruction Tests...\n')

  // Test 1: Basic reconstruction
  console.log('Test 1: Basic 2-of-3 Reconstruction')
  const test1 = await testMPCKeyReconstruction()
  console.log(test1.success ? '✅ PASSED' : '❌ FAILED')
  if (test1.error) console.log('Error:', test1.error)
  if (test1.details) {
    console.log('Original Public Key:', test1.details.originalPublicKey.slice(0, 16) + '...')
    console.log('Reconstructed Public Key:', test1.details.reconstructedPublicKey.slice(0, 16) + '...')
    console.log('Match:', test1.details.match)
  }
  console.log('')

  // Test 2: All combinations
  console.log('Test 2: All 2-of-3 Shard Combinations')
  const test2 = await testAllShardCombinations()
  console.log(`${test2.passed}/${test2.total} combinations passed`)
  if (test2.errors.length > 0) {
    console.log('Errors:')
    test2.errors.forEach(err => console.log('  -', err))
  }
  console.log('')
}
