// appointments/index.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../src/db/prisma-client'
import { sendSmsWithRetry } from '../../src/background-jobs/sms-retry-job'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { serviceId, clientPhone, datetime } = req.body
    // Simplified booking creation
    const appointment = { id: 'mock-id', serviceId, clientPhone, datetime }
    // Trigger SMS
    await sendSmsWithRetry(clientPhone, `Your booking on ${datetime} is confirmed.`)
    res.status(200).json({ success: true, appointment })
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
