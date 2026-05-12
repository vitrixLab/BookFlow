import type { IronSessionOptions } from 'iron-session'

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: 'bookflow_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: 'lax',
  },
}

declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: number
      name: string
      email: string
      role: string
      phone?: string | null
      photo?: string | null
      isSuperAdmin?: boolean        // ← new field
      seenPricing?: boolean         // ← new flag
      plan?: string                 // ← chosen plan (optional)
    }
  }
}
