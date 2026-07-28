import { retryWithBackoff } from '../utils/retry-with-backoff'
import { logger } from '../utils/logger'

// Mock SMS API
async function sendSms(phone: string, message: string): Promise<void> {
  // Simulate random failure
  if (Math.random() < 0.3) {
    throw new Error('SMS provider timeout')
  }
  console.log(`SMS sent to ${phone}: ${message}`)
}

export async function sendSmsWithRetry(phone: string, message: string): Promise<void> {
  await retryWithBackoff(() => sendSms(phone, message), 3, 1000)
  logger.info(`SMS delivered to ${phone}`)
}
