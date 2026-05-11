// lib/wrapApiHandler.ts
import { withMetrics } from './withMetrics'

export function wrapApiHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withMetrics(handler)
}