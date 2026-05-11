import { prisma } from '../../lib/db'
import { logger } from '../utils/logger'

export async function createBooking(serviceId: number, clientId: number, datetime: Date): Promise<number> {
  try {
    const appointment = await prisma.bookedAppointment.create({
      data: {
        serviceId,
        clientId,
        datetime,
        status: 'PENDING',
      },
    })
    logger.info(`Booking created: ID ${appointment.id}`)
    return appointment.id
  } catch (error) {
    logger.error(`Failed to create booking: ${error}`)
    throw new Error('Booking creation failed')
  }
}

export async function confirmBooking(appointmentId: number): Promise<void> {
  const appointment = await prisma.bookedAppointment.findUnique({ where: { id: appointmentId } })
  if (!appointment) {
    throw new Error(`Booking ${appointmentId} not found`)
  }
  await prisma.bookedAppointment.update({
    where: { id: appointmentId },
    data: { status: 'CONFIRMED' },
  })
  logger.info(`Booking ${appointmentId} confirmed`)
}
