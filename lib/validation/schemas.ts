// ============================================
// Krypto Trac: Input Validation Schemas
// Zod schemas for type-safe validation
// ============================================

import { z } from 'zod'

/**
 * Sensory Event Schema
 */
export const sensoryEventSchema = z.object({
  type: z.enum([
    'WINNING_SLOT',
    'SENTINEL_NUDGE',
    'VAULT_THUD',
    'TRADE_CLOSE',
    'SECURITY_ALERT',
    'SUCCESS',
    'CONFIRM',
  ]),
  user_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
})

export type SensoryEventInput = z.infer<typeof sensoryEventSchema>

/**
 * Security Event Schema
 */
export const securityEventSchema = z.object({
  event_type: z.enum([
    'ip_anomaly',
    'unauthorized_access',
    'ai_threat_detected',
    'panic_button',
    'massive_withdrawal',
    'new_mixer_address',
    'suspicious_transaction',
    'session_hijack_attempt',
    'api_key_compromise',
    'vault_breach_attempt',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  threat_signature: z.string().optional(),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Transaction Schema
 */
export const transactionSchema = z.object({
  coin_id: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10),
  transaction_type: z.enum(['buy', 'sell', 'swap', 'stake', 'unstake']),
  amount: z.number().positive(),
  price_usd: z.number().nonnegative(),
  total_value_usd: z.number().nonnegative(),
  profit_usd: z.number().optional(),
})

/**
 * Wallet Slot Schema
 */
export const walletSlotSchema = z.object({
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$|^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  network: z.enum(['ethereum', 'solana', 'polygon', 'arbitrum', 'base', 'optimism']),
  wallet_name: z.string().max(100).optional(),
})

/**
 * Checkout Session Schema
 */
export const checkoutSessionSchema = z.object({
  feature: z.enum(['core', 'defi', 'whale', 'magnum', 'sovereign']),
  price_id: z.string().startsWith('price_').optional(),
  trial_period_days: z.number().int().min(0).max(30).optional(),
})

/**
 * Panic Button Schema
 */
export const panicButtonSchema = z.object({
  user_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
})

/**
 * Validate and sanitize input
 */
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
    }
    throw error
  }
}

/**
 * Safe parse (returns result instead of throwing)
 */
export function safeParse<T>(schema: z.ZodSchema<T>, input: unknown): { success: boolean; data?: T; error?: string } {
  const result = schema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
  }
}
