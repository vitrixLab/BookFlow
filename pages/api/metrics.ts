// pages/api/metrics.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../lib/session'
import { prisma } from '../../lib/db'
import { getCached, setCached } from '../../lib/cache'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as any).session?.user
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const cacheKey = 'metrics'
  let body = getCached(cacheKey)

  if (!body) {
    // Single transaction = 1 round-trip to DB instead of 3
    const [totalUsers, totalAppointments, pendingAppointments] = await prisma.$transaction([
      prisma.user.count(),
      prisma.bookedAppointment.count(),
      prisma.bookedAppointment.count({ where: { status: 'PENDING' } }),
    ])

    body = [
      '# HELP bookflow_users_total Total users',
      '# TYPE bookflow_users_total gauge',
      `bookflow_users_total ${totalUsers}`,
      '',
      '# HELP bookflow_appointments_total Total appointments',
      '# TYPE bookflow_appointments_total gauge',
      `bookflow_appointments_total ${totalAppointments}`,
      '',
      '# HELP bookflow_appointments_pending Pending appointments',
      '# TYPE bookflow_appointments_pending gauge',
      `bookflow_appointments_pending ${pendingAppointments}`,
      '',
    ].join('\n')

    setCached(cacheKey, body)
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end(body)
}

export default withIronSessionApiRoute(handler, sessionOptions)
