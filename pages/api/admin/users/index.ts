// pages/api/admin/users/index.ts
import { withApiAuth } from '../../../../lib/withAuth'
import { prisma } from '../../../../lib/db'
import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import { checkPlanLimit, ResourceType } from '../../../../lib/planLimits'
import { withRateLimit } from '../../../../lib/rateLimit'       // 👈

async function handler(req: any, res: any) {
  const adminUser = req.session.user
  if (!adminUser || adminUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    })
    return res.json(users)
  }

  if (req.method === 'POST') {
    const { name, email, password, role, phone } = req.body
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields except phone are required' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    const limitError = await checkPlanLimit(adminUser.id, role as ResourceType)
    if (limitError) {
      return res.status(403).json({ error: limitError })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        approvedBy: adminUser.id,
      },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    })

    return res.status(201).json(newUser)
  }

  return res.status(405).end()
}

export default withApiAuth(
  withRateLimit(handler, { max: 30, windowMs: 60000 })
)