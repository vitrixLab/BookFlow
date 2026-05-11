// pages/api/admin/users/[id].ts
import { withApiAuth } from '../../../../lib/withAuth'
import { prisma } from '../../../../lib/db'
import { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit } from '../../../../lib/rateLimit'       // 👈

async function handler(req: any, res: any) {
  const user = req.session.user
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { id } = req.query
  const userId = parseInt(id as string)

  if (req.method === 'PUT') {
    const { name, email, password, role, phone } = req.body
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email and role are required' })
    }

    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } })
    if (existing) {
      return res.status(400).json({ error: 'Email already used by another user' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, email, password: password || undefined, role, phone: phone || null },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    })
    return res.json(updated)
  }

  if (req.method === 'DELETE') {
    if (userId === user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' })
    }
    await prisma.user.delete({ where: { id: userId } })
    return res.status(204).end()
  }

  return res.status(405).end()
}

export default withApiAuth(
  withRateLimit(handler, { max: 30, windowMs: 60000 })
)