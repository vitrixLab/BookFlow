// pages/api/admin/users/index.ts
import { withApiAuth } from '../../../../lib/withAuth'
import { prisma } from '../../../../lib/db'
import bcrypt from 'bcrypt'
import { checkPlanLimit, ResourceType } from '../../../../lib/planLimits'
import { withRateLimit } from '../../../../lib/rateLimit'

async function handler(req: any, res: any) {
  const adminUser = req.session.user
  if (!adminUser || adminUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // ─── GET ──────────────────────────────
  if (req.method === 'GET') {
    // Build where clause: super‑admin sees all, normal admin only sees users they approved
    const where: any = {}
    if (!adminUser.isSuperAdmin) {
      where.approvedBy = adminUser.id
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        approvedBy: true,        // optionally shown in the UI later
        isSuperAdmin: true,      // may be used to hide super‑admins from non‑super‑admins
      },
    })
    return res.json(users)
  }

  // ─── POST ─────────────────────────────
  if (req.method === 'POST') {
    const { name, email, password, role, phone } = req.body
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields except phone are required' })
    }

    // Only super‑admin can create an ADMIN user
    if (role === 'ADMIN' && !adminUser.isSuperAdmin) {
      return res.status(403).json({ error: 'Only a super‑admin can create an admin user' })
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
        approvedBy: adminUser.id,          // immutable record of who created this user
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