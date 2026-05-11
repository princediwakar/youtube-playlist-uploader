import { NextRequest } from 'next/server'

interface RateLimitConfig {
  maxRequests?: number
  windowMs?: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

interface TokenBucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, TokenBucket>()

// Lazy cleanup threshold: remove entries idle for longer than this
const MAX_IDLE_MS = 5 * 60 * 1000
let lastCleanup = 0

function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  // Fallback: random per-request ID for serverless environments where
  // IPs may be shared or headers are unavailable. This effectively
  // exempts such requests from rate limiting (acceptable tradeoff).
  return `anon-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Token-bucket rate limiter.
 *
 * @param request - The Next.js request, used to extract a client identifier
 *                  from `x-forwarded-for` or `x-real-ip` headers.
 * @param config  - Optional overrides. Defaults to 30 requests per 60 seconds.
 * @returns An object with `success`, `remaining`, and `resetTime` (epoch ms).
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = {}
): RateLimitResult {
  const maxRequests = config.maxRequests ?? 30
  const windowMs = config.windowMs ?? 60 * 1000

  const clientId = getClientId(request)
  const now = Date.now()

  // Periodic lazy cleanup of stale buckets (avoid unbounded growth in long-running servers)
  if (now - lastCleanup > MAX_IDLE_MS) {
    for (const [key, bucket] of buckets) {
      if (now - bucket.lastRefill > MAX_IDLE_MS) {
        buckets.delete(key)
      }
    }
    lastCleanup = now
  }

  let bucket = buckets.get(clientId)

  if (!bucket) {
    bucket = { tokens: maxRequests, lastRefill: now }
  }

  // Refill tokens proportionally to elapsed time since last request
  const elapsed = now - bucket.lastRefill
  const refillRate = maxRequests / windowMs
  bucket.tokens = Math.min(maxRequests, bucket.tokens + elapsed * refillRate)
  bucket.lastRefill = now

  // Time until the next token becomes available (when bucket is empty)
  const timePerToken = windowMs / maxRequests

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    buckets.set(clientId, bucket)
    const tokensUntilFull = maxRequests - bucket.tokens
    return {
      success: true,
      remaining: Math.floor(bucket.tokens),
      resetTime: now + tokensUntilFull * timePerToken,
    }
  }

  // Bucket empty — deny the request
  buckets.set(clientId, bucket)
  return {
    success: false,
    remaining: 0,
    // Earliest time a token will be available
    resetTime: now + timePerToken * (1 - bucket.tokens),
  }
}
