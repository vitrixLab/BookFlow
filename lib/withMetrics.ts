// lib/withMetrics.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { httpRequestsTotal, httpRequestDuration } from './metrics'

export function withMetrics(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  path?: string
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const route = path || req.url || '/'
    const method = req.method || 'GET'
    const end = httpRequestDuration.startTimer({ method, path: route })

    // Intercept res.end to capture the status code
    const originalEnd = res.end.bind(res)
    res.end = function (...args: any[]) {
      httpRequestsTotal.inc({ method, path: route, status: res.statusCode.toString() })
      end()
      return originalEnd(...args)
    } as any

    return handler(req, res)
  }
}