// pages/api/auth/register.ts
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'
import { prisma } from '../../../lib/db'
import bcrypt from 'bcrypt'
import { ensureBloomFilters, emailProbablyExists, addEmailToFilter } from '../../../lib/bloom'
import { withRateLimit } from '../../../lib/rateLimit'          // 👈

async function handler(req: any, res: any) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, password, phone } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password required' })

  await ensureBloomFilters()

  if (emailProbablyExists(email)) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' })
    }
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, password: hashed, phone: phone || null, role: 'CLIENT' },
  })

  addEmailToFilter(email)

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    photo: user.photo,
  }
  await req.session.save()
  return res.json({ role: user.role })
}

export default withIronSessionApiRoute(
  withRateLimit(handler, { max: 5, windowMs: 60000 }),
  sessionOptions
)