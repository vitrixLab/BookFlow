//pages/login.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import siteConfig from '../site.json'
import { withIronSessionSsr } from 'iron-session/next'
import { sessionOptions } from '../lib/session'

export const getServerSideProps = withIronSessionSsr(async ({ req }) => {
  const user = req.session.user
  if (user) {
    const role = user.role.toLowerCase()
    let destination = '/client/dashboard'
    if (role === 'admin') destination = '/admin/dashboard'
    else if (role === 'employee') destination = '/employee/dashboard'
    return { redirect: { destination, permanent: false } }
  }
  return { props: {} }
}, sessionOptions)

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      // Try to parse JSON; if the server returns HTML, catch it gracefully
      let data: any
      try {
        data = await res.json()
      } catch {
        throw new Error('Server returned an invalid response. Please try again later.')
      }

      if (res.ok) {
        router.push(data.redirect || '/preload')
      } else {
        setError(data.error || 'Invalid email or password.')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sap-login-container">
      <Head>
        <title>{siteConfig.pages.login.title}</title>
      </Head>
      <div className="sap-login-card">
        <div className="logo">
          <a href="/" className="nav-brand" aria-label="home">
            <img
              src="/image/bookflow_primary_logo.png"
              alt="BookFlow logo"
              className="hero-img"
              width="240"
              height="65"
              loading="eager"
              decoding="async"
            />
          </a>
        </div>
        <div className="sub">
          <h2>{siteConfig.pages.login.heading}</h2>
          {siteConfig.pages.login.subheading}
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <i className="fas fa-envelope" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>
              <i className="fas fa-lock" /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : (
              <i className="fas fa-sign-in-alt" />
            )}{' '}
            {siteConfig.pages.login.button_text}
          </button>
        </form>

        <div className="divider">
          <span className="divider-text">or continue with</span>
        </div>

        <div className="social-login">
          <button
            className="social-btn google"
            aria-label="Sign in with Google"
            onClick={() => window.location.href = '/api/auth/google'}
          >
            <i className="fab fa-google" />
            <span>Google</span>
          </button>
          <button className="social-btn facebook" aria-label="Sign in with Facebook">
            <i className="fab fa-facebook-f" />
            <span>Facebook</span>
          </button> 
        </div>

        <div className="links-horizontal">
          <Link href="/">← Back to Home</Link>
          <Link href="/register">Create an account</Link>
        </div>
      </div>

      <style jsx>{`
        .divider {
          display: flex;
          align-items: center;
          margin: 1.8rem 0 1rem;
          color: #7a869a;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(0, 0, 0, 0.1);
        }
        .divider-text {
          padding: 0 1rem;
        }
        .social-login {
          display: flex;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
        }
        .social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.65rem 0.5rem;
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: white;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #4a6278;
        }
        .social-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .social-btn.google:hover {
          border-color: #ea4335;
          color: #ea4335;
        }
        .social-btn.facebook:hover {
          border-color: #1877f2;
          color: #1877f2;
        }
        .social-btn.microsoft:hover {
          border-color: #00a4ef;
          color: #00a4ef;
        }
        .social-btn i {
          font-size: 1.1rem;
        }
        .links-horizontal {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 1rem;
          font-size: 0.8rem;
        }
        .links-horizontal a {
          color: #4a6278;
          text-decoration: none;
          transition: color 0.2s;
        }
        .links-horizontal a:hover {
          color: #0a6ed1;
        }

        /* Loading spinner */
        .spinner {
          display: inline-block;
          width: 1em;
          height: 1em;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          vertical-align: middle;
          margin-right: 4px;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Disabled button state */
        button.btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
