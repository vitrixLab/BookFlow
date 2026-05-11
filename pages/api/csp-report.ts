// pages/api/csp-report.ts
import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST with JSON body
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Log the violation report (you can send it to a logging service later)
  console.warn('CSP Violation Report:', JSON.stringify(req.body, null, 2))

  // Always return 200 so the browser doesn't retry endlessly
  res.status(200).json({ success: true })
}