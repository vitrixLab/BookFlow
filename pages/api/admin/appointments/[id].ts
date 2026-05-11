// pages/api/admin/appointments/[id].ts
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../../lib/session'
import { prisma } from '../../../../lib/db'
import { withRateLimit } from '../../../../lib/rateLimit'   // 👈 new

async function handler(req: any, res: any) {
  const id = parseInt(req.query.id as string)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' })

  if (req.method === 'DELETE') {
    try {
      await prisma.bookedAppointment.delete({ where: { id } })
      return res.json({ success: true })
    } catch {
      return res.status(500).json({ error: 'Delete failed' })
    }
  }

  if (req.method === 'PUT') {
    const { clientId, serviceId, employeeId, datetime, status, notes } = req.body
    const updateData: any = {}
    if (clientId !== undefined) updateData.clientId = parseInt(clientId, 10)
    if (serviceId !== undefined) updateData.serviceId = parseInt(serviceId, 10)
    if (employeeId !== undefined) updateData.employeeId = employeeId ? parseInt(employeeId, 10) : null
    if (datetime !== undefined) updateData.datetime = new Date(datetime)
    if (status && ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      updateData.status = status
    }
    if (notes !== undefined) updateData.notes = notes

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' })
    }

    try {
      await prisma.bookedAppointment.update({ where: { id }, data: updateData })
      return res.json({ success: true })
    } catch (err: any) {
      console.error('Update error:', err)
      return res.status(500).json({ error: 'Update failed' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}

export default withIronSessionApiRoute(
  withRateLimit(handler, { max: 30, windowMs: 60000 }),
  sessionOptions
)