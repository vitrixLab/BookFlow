// pages/preload.tsx

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { withIronSessionSsr } from 'iron-session/next'
import { sessionOptions } from '../lib/session'
import { buildChatCache } from '../lib/chatbotCache'

// ─── Skeleton primitives ───────────────────────
function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '6px',
  style = {},
}: {
  width?: string | number
  height?: string | number
  borderRadius?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  )
}

// ─── Role‑specific content skeletons (same as before) ───
function AdminContentSkeleton() {
  return (
    <main className="main-content">
      <div className="stats-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card stat-card" style={{ padding: '1rem' }}>
            <Skeleton height="2rem" width="60%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton height="1.5rem" width="30%" />
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '1rem', height: 300, marginBottom: '1rem' }}>
        <Skeleton height="100%" borderRadius="16px" />
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <Skeleton height="2rem" width="40%" style={{ marginBottom: '1rem' }} />
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th><Skeleton height="0.8rem" width="80%" /></th>
              <th><Skeleton height="0.8rem" width="100%" /></th>
              <th><Skeleton height="0.8rem" width="100%" /></th>
              <th><Skeleton height="0.8rem" width="60%" /></th>
              <th><Skeleton height="0.8rem" width="60%" /></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 0 ? '60%' : '80%'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

function EmployeeContentSkeleton() {
  return (
    <main className="main-content">
      <div className="stats-grid">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card stat-card" style={{ padding: '1rem' }}>
            <Skeleton height="2rem" width="60%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton height="1.5rem" width="30%" />
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <Skeleton height="2rem" width="40%" style={{ marginBottom: '1rem' }} />
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th><Skeleton height="0.8rem" width="80%" /></th>
              <th><Skeleton height="0.8rem" width="100%" /></th>
              <th><Skeleton height="0.8rem" width="100%" /></th>
              <th><Skeleton height="0.8rem" width="60%" /></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td style={{ padding: '0.75rem' }}><Skeleton height="1rem" width="60%" /></td>
                <td style={{ padding: '0.75rem' }}><Skeleton height="1rem" width="80%" /></td>
                <td style={{ padding: '0.75rem' }}><Skeleton height="1rem" width="100%" /></td>
                <td style={{ padding: '0.75rem' }}><Skeleton height="1rem" width="40%" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

function ClientContentSkeleton() {
  return (
    <main className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <Skeleton height="2rem" width="30%" style={{ marginBottom: '0.5rem' }} />
        <Skeleton height="1.5rem" width="50%" />
      </div>
      <div className="stats-grid">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card stat-card" style={{ padding: '1rem' }}>
            <Skeleton height="2rem" width="60%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton height="1.5rem" width="30%" />
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <Skeleton height="2rem" width="40%" style={{ marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card" style={{ padding: '1rem', flex: 1 }}>
              <Skeleton height="100px" borderRadius="16px" />
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <Skeleton height="2rem" width="40%" style={{ marginBottom: '1rem' }} />
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th><Skeleton height="0.8rem" width="80%" /></th>
              <th><Skeleton height="0.8rem" width="100%" /></th>
              <th><Skeleton height="0.8rem" width="60%" /></th>
              <th><Skeleton height="0.8rem" width="40%" /></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, i) => (
              <tr key={i}>
                <td style={{ padding: '0.75rem' }}><Skeleton height="1rem" width="60%" /></td>
                <td style={{ padding: '0.75rem' }}><Skeleton height="1rem" width="80%" /></td>
                <td style={{ padding: '0.75rem' }}><Skeleton height="1rem" width="40%" /></td>
                <td style={{ padding: '0.75rem' }}><Skeleton height="1rem" width="30%" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

// ─── Main layout skeleton ──────────────────────
function LayoutSkeleton({ role }: { role: string }) {
  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Skeleton width="150px" height="40px" borderRadius="8px" />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '14px',
            paddingBottom: '14px',
            borderBottom: '0.5px solid rgba(255,255,255,0.3)',
          }}
        >
          <Skeleton width="120px" height="1rem" borderRadius="4px" />
        </div>

        <div className="sidebar-nav">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="nav-item-mock">
              <Skeleton
                width="18px"
                height="18px"
                borderRadius="50%"
                style={{ marginRight: '0.7rem' }}
              />
              <Skeleton
                width={`${70 + Math.random() * 30}%`}
                height="0.9rem"
                borderRadius="4px"
              />
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <Skeleton width="100%" height="2.5rem" borderRadius="10px" />
          <Skeleton width="100%" height="2.5rem" borderRadius="10px" />
        </div>
      </aside>

      {/* Main area */}
      <div className="layout-body">
        {/* Topbar */}
        <header className="topbar-mock">
          <Skeleton width="24px" height="24px" borderRadius="4px" />
          <Skeleton
            width="300px"
            height="2rem"
            borderRadius="10px"
            style={{ flex: 1, maxWidth: 420, marginLeft: '1rem' }}
          />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Skeleton width="80px" height="2rem" borderRadius="10px" />
            <Skeleton width="36px" height="36px" borderRadius="50%" />
            <Skeleton width="36px" height="36px" borderRadius="50%" />
            <Skeleton width="36px" height="36px" borderRadius="50%" />
          </div>
        </header>

        {/* Content skeleton */}
        {role === 'admin' && <AdminContentSkeleton />}
        {role === 'employee' && <EmployeeContentSkeleton />}
        {role === 'client' && <ClientContentSkeleton />}
      </div>

      <style jsx>{`
        .layout {
          display: flex;
          min-height: 100vh;
          background: #f1f1f1;
          font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
        }
        .sidebar {
          width: 220px;
          background: #001e4a;
          display: flex;
          flex-direction: column;
          padding-top: 1rem;
        }
        .sidebar-logo {
          padding: 0 1.25rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sidebar-nav {
          flex: 1;
          padding: 0.75rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .nav-item-mock {
          display: flex;
          align-items: center;
          padding: 0.55rem 0.85rem;
        }
        .sidebar-footer {
          padding: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          gap: 0.5rem;
        }
        .layout-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-left: 0;
        }
        .main-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .topbar-mock {
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        :global(.skeleton) {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite ease-in-out;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        :global(.card) {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        :global(.stats-grid) {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        :global(.stat-card) {
          padding: 1.5rem;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .layout-body { margin-left: 0; width: 100vw; }
          .topbar-mock { padding: 0 1rem; }
          .main-content { padding: 1rem; }
        }
        @media (max-width: 480px) {
          .topbar-mock { padding: 0 0.75rem; }
          .topbar-mock > :global(.skeleton):first-child { display: none; }
        }
      `}</style>
    </div>
  )
}

// ─── Helper ───────────────────────────────────
function getDashboardTarget(role: string): string {
  switch (role.toUpperCase()) {
    case 'ADMIN': return '/admin/dashboard'
    case 'EMPLOYEE': return '/employee/dashboard'
    default: return '/client/dashboard'
  }
}

// ─── Preload Page ─────────────────────────────
export const getServerSideProps = withIronSessionSsr(async ({ req }) => {
  const user = req.session.user
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  // Build chat cache now → available when dashboard loads
  req.session.chatCache = await buildChatCache({ id: user.id, role: user.role })
  await req.session.save()

  return {
    props: {
      role: user.role.toLowerCase(),
      target: getDashboardTarget(user.role),
    },
  }
}, sessionOptions)

export default function Preload({ role, target }: { role: string; target: string }) {
  const router = useRouter()

  useEffect(() => {
    // Prefetch the target dashboard page while skeleton is visible
    router.prefetch(target)

    // Use requestAnimationFrame + push to avoid React DOM conflict
    const timeout = setTimeout(() => {
      requestAnimationFrame(() => {
        router.push(target)
      })
    }, 2500) // 2.5 seconds – cache already built, prefetch started

    return () => clearTimeout(timeout)
  }, [router, target])

  return <LayoutSkeleton role={role} />
}