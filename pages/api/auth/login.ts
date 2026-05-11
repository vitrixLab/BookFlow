// pages/api/auth/login.ts
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'
import { prisma } from '../../../lib/db'
import bcrypt from 'bcrypt'
import { withRateLimit } from '../../../lib/rateLimit'          // 👈

async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST')
      return res.status(405).json({ error: 'Method not allowed' })

    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' })

    const ip =
      req.headers['x-forwarded-for']?.toString() ||
      req.socket.remoteAddress ||
      'unknown'
    const device = req.headers['user-agent']?.toString() || 'unknown'

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      await prisma.loginTrace.create({
        data: { userId: 0, email, ip, device, success: false },
      })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    let isValid = false
    try {
      isValid = await bcrypt.compare(password, user.password)
    } catch (bcryptErr) {
      console.error('Bcrypt error:', bcryptErr)
      return res.status(500).json({ error: 'Internal authentication error' })
    }

    if (!isValid) {
      await prisma.loginTrace.create({
        data: { userId: user.id, email, ip, device, success: false },
      })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      photo: user.photo,
    }
    await req.session.save()

    await prisma.loginTrace.create({
      data: { userId: user.id, email, ip, device, success: true },
    })

    return res.json({ redirect: '/preload' })
  } catch (err: any) {
    console.error('LOGIN ERROR:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}

export default withIronSessionApiRoute(
  withRateLimit(handler, { max: 10, windowMs: 60000 }),
  sessionOptions
)