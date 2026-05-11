import { logger } from './logger'

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      logger.warn(`Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  logger.error(`All ${maxRetries} attempts failed`)
  throw lastError
}
