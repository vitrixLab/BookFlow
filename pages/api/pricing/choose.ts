// pages/api/pricing/choose.ts
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'
import { prisma } from '../../../lib/db'
import { withRateLimit } from '../../../lib/rateLimit'   // 👈 new

const PLAN_LIMITS: Record<string, {
  maxEmployees: number | null
  maxClients: number | null
  maxAdmins: number | null
}> = {
  solo:     { maxEmployees: 1,  maxClients: 25,  maxAdmins: 0 },
  studio:   { maxEmployees: 5,  maxClients: 250, maxAdmins: 1 },
  business: { maxEmployees: null, maxClients: null, maxAdmins: null },
}

async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const plan = (req.query.plan as string) || 'solo'
  const userId = req.session.user?.id

  if (!userId) {
    return res.redirect(302, '/login')
  }

  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.solo

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      maxEmployees: limits.maxEmployees,
      maxClients: limits.maxClients,
      maxAdmins: limits.maxAdmins,
    },
  })

  req.session.user.plan = plan
  req.session.user.seenPricing = true
  await req.session.save()

  res.redirect(302, '/client/dashboard')
}

export default withIronSessionApiRoute(
  withRateLimit(handler, { max: 20, windowMs: 60000 }),   // 20 requests per minute
  sessionOptions
)