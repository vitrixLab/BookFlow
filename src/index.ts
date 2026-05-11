import { logger } from './utils/logger'
import { sendSmsWithRetry } from './background-jobs/sms-retry-job'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  logger.info('Background worker started – listening for SMS jobs')

  const testPhone = process.env.TEST_PHONE || '+1234567890'
  await sendSmsWithRetry(testPhone, 'Your appointment is confirmed for tomorrow at 2 PM.')

  const firstService = await prisma.service.findFirst()
  const firstClient = await prisma.user.findFirst({ where: { role: 'CLIENT' } })

  if (firstService && firstClient) {
    const bookingId = await prisma.bookedAppointment.create({
      data: {
        serviceId: firstService.id,
        clientId: firstClient.id,
        datetime: new Date(Date.now() + 86400000),
        status: 'PENDING',
      },
    }).then(b => b.id)
    logger.info(`Demo booking created with ID: ${bookingId}`)
  } else {
    logger.warn('No service or client found – seed your database first')
  }

  logger.info('Worker finished demo cycle')
  process.exit(0)
}

main().catch(e => {
  logger.error(`Fatal: ${e.message}`)
  process.exit(1)
})