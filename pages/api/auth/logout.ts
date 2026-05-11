// pages/api/auth/logout.ts
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'
import { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit } from '../../../lib/rateLimit'          // 👈

async function logoutRoute(req: NextApiRequest, res: NextApiResponse) {
  req.session.destroy()
  res.status(200).json({ success: true })
}

export default withIronSessionApiRoute(
  withRateLimit(logoutRoute, { max: 30, windowMs: 60000 }),
  sessionOptions
)