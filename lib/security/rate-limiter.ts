// ============================================
// Krypto Trac: Rate Limiter
// Prevents abuse of API endpoints and Edge Functions
// ============================================

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(identifier: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    
    // Filter out requests outside the window
    const recent = requests.filter(timestamp => now - timestamp < config.windowMs)
    
    if (recent.length >= config.maxRequests) {
      const oldest = Math.min(...recent)
      const resetAt = oldest + config.windowMs
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      }
    }
    
    // Add current request
    recent.push(now)
    this.requests.set(identifier, recent)
    
    return {
      allowed: true,
      remaining: config.maxRequests - recent.length,
      resetAt: now + config.windowMs,
    }
  }

  /**
   * Cleanup old entries
   */
  private cleanup() {
    const now = Date.now()
    const maxAge = 3600000 // 1 hour
    
    for (const [identifier, requests] of this.requests.entries()) {
      const recent = requests.filter(timestamp => now - timestamp < maxAge)
      if (recent.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, recent)
      }
    }
  }

  /**
   * Clear all entries for an identifier
   */
  clear(identifier: string) {
    this.requests.delete(identifier)
  }

  /**
   * Destroy rate limiter (cleanup interval)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.requests.clear()
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  // Sensory events: 10 per minute per user
  SENSORY_EVENT: { maxRequests: 10, windowMs: 60000 },
  
  // Security events: 5 per minute per user
  SECURITY_EVENT: { maxRequests: 5, windowMs: 60000 },
  
  // Panic button: 3 per hour per user
  PANIC_BUTTON: { maxRequests: 3, windowMs: 3600000 },
  
  // Checkout: 5 per hour per user
  CHECKOUT: { maxRequests: 5, windowMs: 3600000 },
  
  // API routes: 100 per minute per IP
  API_ROUTE: { maxRequests: 100, windowMs: 60000 },
} as const

/**
 * Check rate limit for identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.API_ROUTE
): { allowed: boolean; remaining: number; resetAt: number } {
  return rateLimiter.checkLimit(identifier, config)
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetAt).toISOString(),
  }
}
