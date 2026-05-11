// lib/rateLimit.ts
import { NextApiRequest, NextApiResponse } from 'next'

interface StoreEntry {
  count: number
  windowStart: number
}

const store = new Map<string, StoreEntry>()
const WINDOW_MS = 15 * 60 * 1000   // 15 minutes (default)
const MAX_REQUESTS = 100            // default max requests per window

// Clean up stale entries every minute
const cleanup = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > WINDOW_MS) {
      store.delete(key)
    }
  }
}, 60_000)

// Don't keep the process alive just for cleanup (optional)
if (cleanup.unref) cleanup.unref()

export function rateLimit(req: NextApiRequest, max = MAX_REQUESTS, windowMs = WINDOW_MS) {
  const ip =
    (req.headers['x-forwarded-for'] as string)
      ?.split(',')[0]
      ?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  const now = Date.now()
  const key = `rate:${ip}`

  const entry = store.get(key)

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: max - 1, retryAfter: 0 }
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  entry.count++
  store.set(key, entry)
  return { allowed: true, remaining: max - entry.count, retryAfter: 0 }
}

export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options?: { max?: number; windowMs?: number }
) {
  const max = options?.max ?? MAX_REQUESTS
  const windowMs = options?.windowMs ?? WINDOW_MS

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const result = rateLimit(req, max, windowMs)
    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfter))
      res.setHeader('X-RateLimit-Limit', String(max))
      res.setHeader('X-RateLimit-Remaining', '0')
      return res.status(429).json({
        error: 'Too many requests, please slow down.',
        retryAfter: result.retryAfter,
      })
    }
    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(result.remaining))
    return handler(req, res)
  }
}