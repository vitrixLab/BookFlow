// pages/api/health/[service].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

interface ShieldResponse {
  schemaVersion: 1
  label: string
  message: string
  color: string
}

type HealthStatus = 'up' | 'down' | 'degraded' | 'unknown'
type HealthColor = 'brightgreen' | 'green' | 'yellow' | 'orange' | 'red' | 'lightgrey'

interface HealthResult {
  status: HealthStatus
  color: HealthColor
}

async function checkHttpStatus(url: string, expectedStatus = 200, timeoutMs = 5000): Promise<HealthResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' })
    clearTimeout(timeout)
    if (res.ok || res.status === expectedStatus) return { status: 'up', color: 'brightgreen' }
    if (res.status >= 500) return { status: 'down', color: 'red' }
    return { status: 'degraded', color: 'yellow' }
  } catch (err: any) {
    clearTimeout(timeout)
    return err.name === 'AbortError' ? { status: 'down', color: 'red' } : { status: 'down', color: 'red' }
  }
}

const services: Record<string, { label: string; check: () => Promise<HealthResult> }> = {
  nvidia: {
    label: 'NVIDIA',
    check: () => checkHttpStatus('https://build.nvidia.com/'),
  },
  neon: {
    label: 'Neon DB',
    check: async () => {
      try {
        await prisma.$queryRaw`SELECT 1`
        return { status: 'up', color: 'brightgreen' }
      } catch {
        return { status: 'down', color: 'red' }
      }
    },
  },
  pythonanywhere: {
    label: 'PythonAnywhere',
    check: () => checkHttpStatus('https://soojidano.pythonanywhere.com/api/health'),
  },
}

// ── Simple in‑memory rate limiter ──
const ipCounts = new Map<string, number>()
function isRateLimited(req: NextApiRequest): boolean {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
  const minute = Math.floor(Date.now() / 60000)
  const key = `${ip}::${minute}`
  const count = (ipCounts.get(key) || 0) + 1
  ipCounts.set(key, count)
  return count > 5   // max 5 requests per minute per IP
}

// ── In‑memory cache (5 minutes) ──
const cache = new Map<string, { ts: number; data: ShieldResponse }>()
const CACHE_TTL = 300_000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limit
  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  const { service } = req.query
  const key = (service as string || '').toLowerCase()
  const config = services[key]

  // Return cached badge if fresh
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json(cached.data)
  }

  let result: HealthResult
  if (!config) {
    result = { status: 'unknown', color: 'lightgrey' }
  } else {
    result = await config.check()
  }

  const badge: ShieldResponse = {
    schemaVersion: 1,
    label: config?.label || key,
    message: result.status,
    color: result.color,
  }

  cache.set(key, { ts: Date.now(), data: badge })

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json(badge)
}