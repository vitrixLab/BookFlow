// pages/api/admin/traces.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'
import { apiTraceRing } from '../../../lib/chat_db'
import { traceRing } from '../../../lib/trace'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only admins can view traces
  const user = (req.session as any)?.user
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  // Merge internal (withTrace) and external (tracedFetch) trace buffers
  const merged = [...traceRing, ...apiTraceRing]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 500) // respect max ring capacity

  const paged = merged.slice(offset, offset + limit)
  res.status(200).json({ total: merged.length, limit, offset, logs: paged })
}

export default withIronSessionApiRoute(handler, sessionOptions)