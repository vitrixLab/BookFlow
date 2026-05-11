// pages/api/admin/services/[id].ts
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../../lib/session'
import { prisma } from '../../../../lib/db'
import { withRateLimit } from '../../../../lib/rateLimit'   // 👈 new

async function handler(req: any, res: any) {
  const user = req.session.user
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const id = parseInt(req.query.id as string)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' })

  if (req.method === 'PUT') {
    const { name, description, durationMin, price } = req.body
    try {
      await prisma.service.update({
        where: { id },
        data: { name, description, durationMin: parseInt(durationMin), price: price ? parseFloat(price) : null },
      })
      return res.json({ success: true })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.service.delete({ where: { id } })
      return res.json({ success: true })
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