// lib/withAuth.ts
import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next'
import { sessionOptions } from './session'
import type {
  NextApiHandler,
  NextApiRequest,
  NextApiResponse,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next'
import { withTrace } from './trace'

// ─── Base session wrappers (unchanged) ──────────
export function withApiAuth(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions)
}

export function withSsrAuth(
  handler: (context: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<any>>
) {
  return withIronSessionSsr(handler, sessionOptions)
}

// ─── Role‑checked API wrapper with optional tracing ──
type AuthOptions = {
  trace?: boolean
}

/**
 * Protect an API route with role checks.
 * @param handler      The API route handler
 * @param allowedRoles Roles that can access this route (default: ['admin'])
 * @param options      Optional settings (e.g. { trace: true } to enable request logging)
 */
export function withAuth(
  handler: NextApiHandler,
  allowedRoles: string[] = ['admin'],
  options?: AuthOptions
) {
  // Apply tracing first if requested
  let wrappedHandler = handler
  if (options?.trace) {
    wrappedHandler = withTrace(wrappedHandler)
  }

  // Wrap with iron-session, then enforce roles
  return withIronSessionApiRoute(async (req, res) => {
    const { user } = req.session

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    return wrappedHandler(req, res)
  }, sessionOptions)
}

// ─── Role‑checked SSR wrapper for pages ──────────
export function withAuthSsr(allowedRoles: string[] = ['admin']) {
  return (
    gssp?: (
      context: GetServerSidePropsContext & { user?: any }
    ) => Promise<GetServerSidePropsResult<any>>
  ) =>
    withIronSessionSsr(async (context) => {
      const user = (context.req.session as any)?.user

      if (!user || !allowedRoles.includes(user.role)) {
        return {
          redirect: {
            destination: '/login',
            permanent: false,
          },
        }
      }

      if (gssp) {
        const result = await gssp(context)
        if ('props' in result) {
          return { props: { ...result.props, user } }
        }
        return result
      }

      return { props: { user } }
    }, sessionOptions)
}