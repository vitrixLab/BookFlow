// pages/api/service/procurement/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_PROCUREMENT_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!BACKEND_URL) {
    return res.status(500).json({ detail: 'Backend URL not configured' });
  }

  // Build the full URL
  const { path } = req.query;
  const endpoint = `/${(path as string[]).join('/')}`;
  const url = `${BACKEND_URL}${endpoint}`;

  try {
    const backendRes = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body:
        req.method !== 'GET' && req.method !== 'HEAD'
          ? JSON.stringify(req.body)
          : undefined,
    });

    const contentType = backendRes.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await backendRes.json();
      return res.status(backendRes.status).json(data);
    }
    res.status(backendRes.status).end();
  } catch (error) {
    console.error('Procurement proxy error:', error);
    res.status(502).json({ detail: 'Upstream service unavailable' });
  }
}