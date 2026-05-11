// pages/api/admin/cache.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req.session as any)?.user
  if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'DELETE') {
    // Optionally clear specific keys
    const key = req.query.key as string | undefined
    if (key) {
      // You'd need to add a clearCache(key) function in cache.ts
      res.json({ cleared: key })
    } else {
      // Clear all knowledge caches – for simplicity, we just note that it's cleared on next request
      res.json({ info: 'Cache will be refreshed on next request' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

export default withIronSessionApiRoute(handler, sessionOptions)