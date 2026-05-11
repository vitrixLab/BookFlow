// pages/api/admin/services/index.ts
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../../lib/session'
import { prisma } from '../../../../lib/db'
import { withRateLimit } from '../../../../lib/rateLimit'   // 👈 new

async function handler(req: any, res: any) {
  const user = req.session.user
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method === 'GET') {
    const services = await prisma.service.findMany({ orderBy: { createdAt: 'desc' } })
    return res.json(services)
  }

  if (req.method === 'POST') {
    const { name, description, durationMin, price } = req.body
    if (!name || !durationMin) {
      return res.status(400).json({ error: 'Name and duration are required' })
    }
    try {
      const service = await prisma.service.create({
        data: { name, description, durationMin: parseInt(durationMin), price: price ? parseFloat(price) : null },
      })
      return res.json(service)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}

export default withIronSessionApiRoute(
  withRateLimit(handler, { max: 30, windowMs: 60000 }),
  sessionOptions
)