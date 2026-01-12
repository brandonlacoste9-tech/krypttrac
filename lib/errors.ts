/**
 * Sanitized Error Messages
 * Fort Knox Security: Never leak server-side information
 */

/**
 * Sanitize error messages for user display
 * Removes sensitive information (stack traces, file paths, database IDs, etc.)
 */
export function sanitizeError(error: unknown, context?: string): string {
  // If error is already sanitized string, return it
  if (typeof error === 'string') {
    return error
  }

  // If error is Error object, extract message
  if (error instanceof Error) {
    const message = error.message

    // Block sensitive patterns
    if (
      message.includes('SQL') ||
      message.includes('database') ||
      message.includes('connection') ||
      message.includes('ENOENT') ||
      message.includes('EACCES') ||
      message.includes('stack') ||
      message.includes('at ') ||
      message.includes('localhost') ||
      message.includes('127.0.0.1') ||
      message.includes('internal') ||
      message.includes('password') ||
      message.includes('secret') ||
      message.includes('key') ||
      message.includes('token')
    ) {
      // Return generic error based on context
      return getGenericError(context)
    }

    // Return sanitized message if safe
    return message
  }

  // Unknown error type
  return getGenericError(context)
}

/**
 * Get generic error message based on context
 */
function getGenericError(context?: string): string {
  const errors: Record<string, string> = {
    'checkout': 'Fort Knox Security: Payment processing failed. Please try again or contact support.',
    'portal': 'Fort Knox Security: Unable to access subscription portal. Please try again.',
    'webhook': 'Fort Knox Security: Subscription sync failed. Please contact support.',
    'security': 'Fort Knox Security: Action blocked. Please verify your request.',
    'signature': 'Sentinel: Signature Invalid. Please re-authenticate.',
    'guardian': 'Sentinel: Security scan failed. Please try again.',
    'transaction': 'Fort Knox Security: Transaction blocked. Please review and try again.',
    'defi': 'Sentinel: Execution blocked. Please verify transaction details.',
    'auth': 'Fort Knox Security: Authentication failed. Please log in again.',
    'subscription': 'Fort Knox Security: Subscription update failed. Please try again.',
  }

  return errors[context || 'default'] || 'Fort Knox Security: Action failed. Please try again or contact support.'
}

/**
 * Safe error response for API routes
 */
export interface SafeErrorResponse {
  error: string
  code?: string
  retry?: boolean
}

/**
 * Create safe error response
 */
export function createSafeErrorResponse(
  error: unknown,
  context?: string,
  code?: string,
  retry: boolean = false
): SafeErrorResponse {
  return {
    error: sanitizeError(error, context),
    code: code || 'FORT_KNOX_ERROR',
    retry,
  }
}

/**
 * Common error codes (for logging, not user display)
 */
export const ERROR_CODES = {
  SIGNATURE_INVALID: 'SENTINEL_SIGNATURE_INVALID',
  TRANSACTION_BLOCKED: 'SENTINEL_TRANSACTION_BLOCKED',
  SECURITY_SCAN_FAILED: 'SENTINEL_SCAN_FAILED',
  PAYMENT_FAILED: 'FORT_KNOX_PAYMENT_FAILED',
  SUBSCRIPTION_FAILED: 'FORT_KNOX_SUBSCRIPTION_FAILED',
  AUTH_FAILED: 'FORT_KNOX_AUTH_FAILED',
  GENERIC_ERROR: 'FORT_KNOX_ERROR',
} as const
