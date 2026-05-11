import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export default withIronSessionApiRoute(async (req, res) => {
  // Generate a random state parameter to prevent CSRF
  const state = Math.random().toString(36).substring(2, 15)
  req.session.oauthState = state
  await req.session.save()

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.NODE_ENV === 'production'
      ? 'https://bookfly-app.netlify.app/api/auth/google/callback'
      : 'http://localhost:3000/api/auth/google/callback',
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })

  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`)
}, sessionOptions)
