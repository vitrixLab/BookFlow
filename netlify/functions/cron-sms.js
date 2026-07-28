// netlify/functions/cron-sms.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Simple logger (Netlify logs go to console)
const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  warn: (msg) => console.warn(`WARN: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`),
}

async function sendSmsWithRetry(phone, message) {
  // Your actual SMS sending logic – for now just a placeholder
  logger.info(`Sending SMS to ${phone}: ${message}`)
  // In real code, call Twilio etc. with retry
}

exports.handler = async function (event, context) {
  logger.info('Netlify cron triggered - checking for pending SMS jobs')

  const testPhone = process.env.TEST_PHONE || '+1234567890'
  await sendSmsWithRetry(testPhone, 'Your appointment is confirmed for tomorrow at 2 PM.')

  try {
    const firstService = await prisma.service.findFirst()
    const firstClient = await prisma.user.findFirst({ where: { role: 'CLIENT' } })

    if (firstService && firstClient) {
      const booking = await prisma.bookedAppointment.create({
        data: {
          serviceId: firstService.id,
          clientId: firstClient.id,
          datetime: new Date(Date.now() + 86400000),
          status: 'PENDING',
        },
      })
      logger.info(`Demo booking created with ID: ${booking.id}`)
    } else {
      logger.warn('No service or client found – seed your database first')
    }

    // Return a 200 to Netlify
    return { statusCode: 200, body: 'Cron job completed' }
  } catch (err) {
    logger.error(`Fatal: ${err.message}`)
    return { statusCode: 500, body: err.message }
  } finally {
    await prisma.$disconnect()
  }
}