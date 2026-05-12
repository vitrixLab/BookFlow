// pages/api/admin/users/[id].ts
import { withApiAuth } from '../../../../lib/withAuth'
import { prisma } from '../../../../lib/db'
import bcrypt from 'bcrypt'
import { withRateLimit } from '../../../../lib/rateLimit'

async function handler(req: any, res: any) {
  const adminUser = req.session.user
  if (!adminUser || adminUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { id } = req.query
  const userId = parseInt(id as string)

  // Fetch the target user once, needed by both PUT and DELETE
  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' })
  }

  // ─── UPDATE ──────────────────────────────
  if (req.method === 'PUT') {
    const { name, email, password, role, phone } = req.body
    // ❗️ approvedBy is intentionally ignored – it must never be changed

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email and role are required' })
    }

    // Only a super‑admin can assign the Admin role
    if (role === 'ADMIN' && !adminUser.isSuperAdmin) {
      return res.status(403).json({ error: 'Only a super‑admin can assign the Admin role' })
    }

    // Email uniqueness check (exclude current user)
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
    })
    if (existing) {
      return res.status(400).json({ error: 'Email already used by another user' })
    }

    // Build updateData – never include approvedBy
    const updateData: any = { name, email, role, phone: phone || null }
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    })

    return res.json(updated)
  }

  // ─── DELETE ───────────────────────────────
  if (req.method === 'DELETE') {
    // Prevent self-deletion
    if (userId === adminUser.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' })
    }

    // Only super‑admin can delete another admin
    if (targetUser.role === 'ADMIN' && !adminUser.isSuperAdmin) {
      return res.status(403).json({ error: 'Only a super‑admin can delete an admin user' })
    }

    await prisma.user.delete({ where: { id: userId } })
    return res.status(200).json({ success: true })
  }

  return res.status(405).end()
}

export default withApiAuth(
  withRateLimit(handler, { max: 30, windowMs: 60000 })
)