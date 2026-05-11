// pages/api/knowledge-search.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../lib/session'
import { searchStatements } from '../../lib/chat_db'

import { withTrace } from '../../lib/trace';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow admins
  const user = (req as any).session?.user
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const q = (req.query.q as string) || ''
  if (!q.trim()) {
    return res.json([]) // empty search returns nothing
  }

  try {
    const results = await searchStatements(q, 200) // allow more results for client-side pagination
    res.json(results)
  } catch (err: any) {
    console.error('Search error:', err)
    res.status(500).json({ error: 'Search failed' })
  }
}

export default withIronSessionApiRoute(withTrace(handler), sessionOptions); 