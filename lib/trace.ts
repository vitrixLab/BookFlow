// lib/trace.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

export interface TraceEntry {
  timestamp: string
  method: string
  url: string
  status: number | null
  error?: string
}

const MAX_TRACE_ENTRIES = 500
export const traceRing: TraceEntry[] = []

function pushTrace(entry: TraceEntry) {
  if (process.env.DEBUG_API === 'true') {
    console.log(
      `[TRACE] ${entry.method} ${entry.url} → ${entry.status ?? 'ERR'}`,
      entry.error || ''
    )
  }
  traceRing.push(entry)
  if (traceRing.length > MAX_TRACE_ENTRIES) traceRing.shift()
}

/**
 * Wraps an API handler to record method, URL, status, and errors.
 */
export function withTrace(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const entry: TraceEntry = {
      timestamp: new Date().toISOString(),
      method: req.method || 'GET',
      url: req.url || '',
      status: null,
    }

    const originalStatus = res.status.bind(res)
    const originalJson = res.json.bind(res)
    const originalEnd = res.end.bind(res)

    res.status = function (code: number) {
      entry.status = code
      return originalStatus(code)
    }

    res.json = function (body: any) {
      entry.status = entry.status ?? 200
      pushTrace(entry)
      return originalJson(body)
    }

    res.end = function (...args: any[]) {
      entry.status = entry.status ?? 200
      pushTrace(entry)
      return (originalEnd as any).apply(res, args)
    }

    try {
      await handler(req, res)
    } catch (err: any) {
      entry.status = 500
      entry.error = err.message
      pushTrace(entry)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
}