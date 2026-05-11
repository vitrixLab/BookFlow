import { ReactNode, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import siteConfig from '../site.json'

/* ─── SKELETON COMPONENTS ─────────────────────── */
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

/* ─── PAGE‑SPECIFIC ADMIN SKELETONS ─────────────────── */
function AdminDashboardSkeleton() {
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
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <Skeleton height="280px" borderRadius="16px" />
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <Skeleton height="2rem" width="40%" style={{ marginBottom: '1rem' }} />
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['ID', 'Client', 'Service', 'Date', 'Status'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 0 ? '40%' : '70%'} />
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
function AdminServicesSkeleton() {
  return (
    <main className="main-content">
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <Skeleton height="1.5rem" width="30%" style={{ marginBottom: '1rem' }} />
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="40%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
            <div style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="40%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="40%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
            <div style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="40%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <Skeleton height="1.5rem" width="50%" style={{ marginBottom: '1rem' }} />
          <Skeleton height="4rem" borderRadius="8px" style={{ marginBottom: '0.75rem' }} />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="1rem" width="80%" style={{ marginBottom: '0.5rem' }} />
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <Skeleton height="2rem" width="30%" style={{ marginBottom: '1rem' }} />
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['ID', 'Name', 'Duration', 'Price', 'Actions'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(4)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 0 ? '30%' : '70%'} />
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
function AdminUsersSkeleton() {
  return (
    <main className="main-content">
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <Skeleton height="1.5rem" width="30%" style={{ marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {['name', 'email', 'password', 'role'].map((_, i) => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="50%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <Skeleton height="0.8rem" width="50%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton height="2.2rem" borderRadius="8px" />
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <Skeleton height="2rem" width="30%" style={{ marginBottom: '1rem' }} />
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['ID', 'Name', 'Email', 'Role', 'Phone', 'Joined', 'Actions'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(7)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 0 ? '30%' : '70%'} />
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
function AdminAppointmentsSkeleton() {
  return (
    <main className="main-content">
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <Skeleton height="1.5rem" width="30%" style={{ marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {['client', 'service'].map((_, i) => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="50%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {['employee', 'datetime', 'notes'].map((_, i) => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="50%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <Skeleton height="2rem" width="30%" style={{ marginBottom: '1rem' }} />
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['ID', 'Client', 'Service', 'Employee', 'Date', 'Status', 'Actions'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(7)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 0 ? '30%' : '70%'} />
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
/* ─── ROUTE‑MATCHED SKELETON SELECTOR ──────────────── */
function getAdminSkeleton(pathname: string) {
  if (pathname.startsWith('/admin/services')) return <AdminServicesSkeleton />
  if (pathname.startsWith('/admin/users')) return <AdminUsersSkeleton />
  if (pathname.startsWith('/admin/appointments')) return <AdminAppointmentsSkeleton />
  return <AdminDashboardSkeleton />   // fallback to dashboard skeleton
}

/* ─── PAGE‑SPECIFIC EMPLOYEE SKELETONS ─────────────────── */
function EmployeeDashboardSkeleton() {
  return (
    <main className="main-content">
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card stat-card" style={{ padding: '1.2rem' }}>
            <Skeleton height="2rem" width="60%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton height="1rem" width="40%" />
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Skeleton width="1rem" height="1rem" borderRadius="50%" />
          <Skeleton height="1.2rem" width="30%" />
        </div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['Service', 'Client', 'Date', 'Action'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(4)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 3 ? '40%' : '70%'} />
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
function EmployeeAppointmentsSkeleton() {
  return (
    <main className="main-content">
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Skeleton width="1rem" height="1rem" borderRadius="50%" />
          <Skeleton height="1.2rem" width="30%" />
        </div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['Client', 'Service', 'Date', 'Status', 'Action'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 4 ? '40%' : '70%'} />
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
function EmployeeCreateAppointmentSkeleton() {
  return (
    <main className="main-content">
      <div className="card" style={{ padding: '1.5rem', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Skeleton width="1.2rem" height="1.2rem" borderRadius="50%" />
          <Skeleton height="1.5rem" width="40%" />
        </div>
        {['client', 'service', 'datetime', 'notes'].map((_, i) => (
          <div key={i} style={{ marginBottom: '1.2rem' }}>
            <Skeleton height="0.8rem" width="20%" style={{ marginBottom: '0.4rem' }} />
            <Skeleton height="2.2rem" borderRadius="8px" />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <Skeleton height="2.2rem" width="30%" borderRadius="8px" />
        </div>
      </div>
    </main>
  )
}

/* ─── PAGE‑SPECIFIC CLIENT SKELETONS ─────────────────── */
function ClientDashboardSkeleton() {
  return (
    <main className="main-content">
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card stat-card" style={{ padding: '1.2rem' }}>
            <Skeleton height="2rem" width="60%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton height="1rem" width="40%" />
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Skeleton width="1rem" height="1rem" borderRadius="50%" />
          <Skeleton height="1.2rem" width="40%" />
        </div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['Service', 'Description', 'Duration', 'Action'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, i) => (
              <tr key={i}>
                {[...Array(4)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 3 ? '40%' : '70%'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Skeleton width="1rem" height="1rem" borderRadius="50%" />
          <Skeleton height="1.2rem" width="40%" />
        </div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['Service', 'Date', 'Status', 'Action'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, i) => (
              <tr key={i}>
                {[...Array(4)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 3 ? '40%' : '70%'} />
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
function ClientBookingsSkeleton() {
  return (
    <main className="main-content">
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Skeleton width="1rem" height="1rem" borderRadius="50%" />
          <Skeleton height="1.2rem" width="30%" />
          <Skeleton height="1rem" width="2rem" borderRadius="999px" style={{ marginLeft: 'auto' }} />
        </div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['Service', 'Date', 'Status', 'Action'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(4)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 3 ? '40%' : '70%'} />
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
function ClientBookAppointmentSkeleton() {
  return (
    <main className="main-content">
      <div className="card" style={{ padding: '1.5rem', maxWidth: '600px' }}>
        <Skeleton height="1.8rem" width="40%" style={{ marginBottom: '1.5rem' }} />
        {['service', 'datetime', 'phone'].map((_, i) => (
          <div key={i} style={{ marginBottom: '1.2rem' }}>
            <Skeleton height="0.8rem" width="25%" style={{ marginBottom: '0.4rem' }} />
            <Skeleton height="2.2rem" borderRadius="8px" />
          </div>
        ))}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
          <Skeleton height="2.2rem" width="30%" borderRadius="8px" />
          <Skeleton height="2.2rem" width="20%" borderRadius="8px" />
        </div>
      </div>
    </main>
  )
}

function SettingsSkeleton() {
  return (
    <>
      {/* Mobile top pills */}
      <div className="mobile-settings-tabs">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mobile-tab-skeleton skeleton" />
        ))}
      </div>

      <div className="settings-shell">
        {/* LEFT SETTINGS NAV */}
        <aside className="settings-nav-panel">
          <div className="settings-nav-header">
            <div className="tiny-label skeleton" />
          </div>

          <div className="settings-nav-links">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`settings-nav-item ${i === 0 ? 'active' : ''}`}
              >
                <div className="nav-icon skeleton" />
                <div className="nav-text skeleton" />
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="settings-content-panel">
          {/* Header */}
          <div className="settings-page-header">
            <div>
              <div className="page-title skeleton" />
              <div className="page-subtitle skeleton" />
            </div>
          </div>

          {/* Business Profile Card */}
          <div className="settings-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <div className="card-icon skeleton" />
                <div className="card-title skeleton" />
              </div>
            </div>

            <div className="settings-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="field-group">
                  <div className="field-label skeleton" />
                  <div className="field-input skeleton" />
                </div>
              ))}
            </div>

            <div className="button-row">
              <div className="save-btn skeleton" />
            </div>
          </div>

          {/* Owner Profile Card */}
          <div className="settings-card owner-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <div className="card-icon skeleton" />
                <div className="card-title skeleton" />
              </div>
            </div>

            <div className="owner-layout">
              <div className="avatar-skeleton skeleton" />

              <div className="owner-info">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="owner-info-row">
                    <div className="owner-label skeleton" />
                    <div className="owner-value skeleton" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ─────────────────────────────
           LAYOUT (shapes, spacing, etc.)
           No shimmer animation – that's provided globally
        ───────────────────────────── */
        .mobile-settings-tabs {
          display: none;
          gap: 0.75rem;
          overflow-x: auto;
          padding: 1rem;
          border-bottom: 1px solid #e8edf3;
          background: #ffffff;
        }

        .mobile-settings-tabs::-webkit-scrollbar {
          display: none;
        }

        .mobile-tab-skeleton {
          min-width: 90px;
          height: 36px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .settings-shell {
          display: flex;
          flex: 1;
        }

        .settings-nav-panel {
          width: 240px;
          background: #ffffff;
          border-right: 1px solid #e7ebf0;
          padding: 1.25rem 1rem;
          flex-shrink: 0;
        }

        .settings-nav-header {
          margin-bottom: 1.5rem;
          padding: 0 0.4rem;
        }

        .tiny-label {
          width: 72px;
          height: 10px;
          border-radius: 999px;
        }

        .settings-nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.85rem 0.85rem;
          border-radius: 12px;
        }

        .settings-nav-item.active {
          background: #f1f5fb;
        }

        .nav-icon {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .nav-text {
          width: 75%;
          height: 12px;
          border-radius: 999px;
        }

        .settings-content-panel {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .settings-page-header {
          margin-bottom: 1.5rem;
        }

        .page-title {
          width: 180px;
          height: 32px;
          border-radius: 10px;
          margin-bottom: 0.8rem;
        }

        .page-subtitle {
          width: 320px;
          max-width: 100%;
          height: 14px;
          border-radius: 999px;
        }

        .settings-card {
          background: #ffffff;
          border: 1px solid #e8edf3;
          border-radius: 24px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
        }

        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .card-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .card-icon {
          width: 20px;
          height: 20px;
          border-radius: 6px;
        }

        .card-title {
          width: 180px;
          height: 18px;
          border-radius: 999px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.25rem;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .field-label {
          width: 90px;
          height: 11px;
          border-radius: 999px;
        }

        .field-input {
          width: 100%;
          height: 48px;
          border-radius: 14px;
        }

        .button-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .save-btn {
          width: 150px;
          height: 44px;
          border-radius: 14px;
        }

        .owner-layout {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .avatar-skeleton {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .owner-info {
          flex: 1;
        }

        .owner-info-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem 0;
          border-bottom: 1px solid #f1f4f8;
        }

        .owner-label {
          width: 70px;
          height: 11px;
          border-radius: 999px;
        }

        .owner-value {
          width: 180px;
          height: 14px;
          border-radius: 999px;
        }

        /* ─────────────────────────────
           RESPONSIVE
        ───────────────────────────── */
        @media (max-width: 992px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .mobile-settings-tabs {
            display: flex;
          }

          .settings-shell {
            flex-direction: column;
          }

          .settings-nav-panel {
            display: none;
          }

          .settings-content-panel {
            padding: 1rem;
          }

          .settings-card {
            border-radius: 20px;
            padding: 1.2rem;
          }

          .owner-layout {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            width: 140px;
            height: 26px;
          }

          .page-subtitle {
            width: 90%;
          }

          .save-btn {
            width: 100%;
          }

          .button-row {
            justify-content: stretch;
          }
        }
      `}</style>
    </>
  )
}

interface DashboardLayoutProps {
  children: ReactNode
  user: {
    id: number
    name: string
    email: string
    role: string
    photo?: string | null
  }
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const role = user.role.toLowerCase()

  {/* SKELETON ROUTES */}
  const getSkeleton = (): ReactNode => {
      // Settings pages
      if (router.pathname.startsWith('/settings')) return <SettingsSkeleton />
      if (role === 'admin') {
        if (router.pathname.startsWith('/admin/services')) return <AdminServicesSkeleton />
        if (router.pathname.startsWith('/admin/users')) return <AdminUsersSkeleton />
        if (router.pathname.startsWith('/admin/appointments')) return <AdminAppointmentsSkeleton />
        return <AdminDashboardSkeleton />
      }
      if (role === 'employee') {
        if (router.pathname.startsWith('/employee/create-appointment')) return <EmployeeCreateAppointmentSkeleton />
        if (router.pathname.startsWith('/employee/appointments')) return <EmployeeAppointmentsSkeleton />
        return <EmployeeDashboardSkeleton />
      }
      if (role === 'client') {
        if (router.pathname.startsWith('/client/book-appointment')) return <ClientBookAppointmentSkeleton />
        if (router.pathname.startsWith('/client/my-bookings')) return <ClientBookingsSkeleton />
        return <ClientDashboardSkeleton />
      }
    return null
  }

  // ── Page loading state for skeleton views ──
  const [isPageLoading, setIsPageLoading] = useState(false)
 
  useEffect(() => {
    const handleStart = () => setIsPageLoading(true)
    const handleEnd = () => setIsPageLoading(false)

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleEnd)
    router.events.on('routeChangeError', handleEnd)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleEnd)
      router.events.off('routeChangeError', handleEnd)
    }
  }, [router])

  // ── Sidebar toast state ──
  const [sidebarToast, setSidebarToast] = useState<string | null>(null)
  const [toastDismissing, setToastDismissing] = useState(false);

  const dismissSidebarToast = () => {
    setToastDismissing(true);
    setTimeout(() => {
      setSidebarToast(null);
      setToastDismissing(false);
    }, 250); // matches the CSS exit animation duration
  };

  // Auto‑dismiss after 2.5 seconds
  useEffect(() => {
    if (!sidebarToast) return;
    const timer = setTimeout(dismissSidebarToast, 2500);
    return () => clearTimeout(timer);
  }, [sidebarToast]);

  // ── Chat state ──
  const [chatOpen, setChatOpen] = useState(false) 

  const CHAT_STORAGE_KEY = `bookflow_chat_${user.id}`
  const defaultGreeting = [{ role: 'assistant', content: 'Hi! Ask me anything about BookFlow.' }] as ChatMessage[]

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(defaultGreeting)

  useEffect(() => {
    // Load saved chat after hydration – prevents server/client mismatch
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed)
        }
      }
    } catch (_) {}
  }, [])

  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [typingMessage, setTypingMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [fullResponse, setFullResponse] = useState('')
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const chatInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom whenever messages or typing text change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, typingMessage])

  // Typewriter effect
  useEffect(() => {
    if (!isTyping || !fullResponse) return

    let i = 0
    const interval = setInterval(() => {
      setTypingMessage(fullResponse.slice(0, i + 1))
      i++
      if (i >= fullResponse.length) {
        clearInterval(interval)
        setIsTyping(false)
        setChatMessages(prev => [...prev, { role: 'assistant', content: fullResponse }])
        setTypingMessage('')
        setFullResponse('')
      }
    }, 20) // speed in ms per character

    typingIntervalRef.current = interval
    return () => clearInterval(interval)
  }, [isTyping, fullResponse])

  const sendChat = async () => {
    const question = chatInput.trim()
    if (!question || chatLoading || isTyping) return

    // If a typewriter is running, immediately commit the full message
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      setIsTyping(false)
      setChatMessages(prev => [...prev, { role: 'assistant', content: fullResponse }])
      setTypingMessage('')
      setFullResponse('')
    }

    const userMsg: ChatMessage = { role: 'user', content: question }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      const answer = data.answer || "I couldn't find an answer."

      setChatLoading(false)
      // Start typewriter
      setIsTyping(true)
      setFullResponse(answer)
      setTypingMessage('')
    } catch (e) {
      setChatLoading(false)
      setIsTyping(true)
      setFullResponse('Something went wrong. Please try again.')
    }
  }
  const warmChatbot = () => {
    // Fire‑and‑forget warmup – no UI feedback needed
    fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'warmup' }),
    }).catch(() => {})
  }

  // ── Other existing state & logic ──
  const [notifications] = useState([
    { id: '1', message: 'New client registered.', type: 'info', read: false },
    { id: '2', message: 'Appointment confirmed.', type: 'success', read: false },
    { id: '3', message: 'Service update failed.', type: 'error', read: false },
  ])
  const unreadCount = notifications.filter(n => !n.read).length

  const avatarRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const closeAll = () => { setAvatarMenuOpen(false); setNotifOpen(false) }

  const getDashboardUrl = () => {
    if (role === 'admin') return '/admin/dashboard'
    if (role === 'employee') return '/employee/dashboard'
    return '/client/dashboard'
  }

  const getMenuItems = () => {
    if (role === 'admin') {
      return [
        { href: '/admin/dashboard',       icon: 'fas fa-tachometer-alt',  label: siteConfig.pages.admin.sidebar.dashboard       },
        { href: '/admin/services',        icon: 'fas fa-cogs',            label: siteConfig.pages.admin.sidebar.services        },
        { href: '/admin/users',           icon: 'fas fa-users',           label: siteConfig.pages.admin.sidebar.users           },
        { href: '/admin/appointments',    icon: 'fas fa-calendar-alt',    label: siteConfig.pages.admin.sidebar.appointments    },
		{ href: '/admin/ai-assistant',    icon: 'fas fa-robot',           label: siteConfig.pages.admin.sidebar.ai_assistant    },
        { href: '/admin/logging',         icon: 'fas fa-history',         label: siteConfig.pages.admin.sidebar.logging         },
        { href: '/admin/knowledge-base',  icon: 'fas fa-database',        label: siteConfig.pages.admin.sidebar.knowledge_base  },
        { href: '/admin/traces',          icon: 'fas fa-list-alt',        label: siteConfig.pages.admin.sidebar.traces          },
      ]
    } else if (role === 'employee') {
      return [
        { href: '/employee/dashboard',            icon: 'fas fa-tachometer-alt',  label: siteConfig.pages.employee.sidebar.dashboard            },
        { href: '/employee/appointments',         icon: 'fas fa-calendar-alt',    label: siteConfig.pages.employee.sidebar.appointments         },
        { href: '/employee/create-appointment',   icon: 'fas fa-plus-circle',     label: siteConfig.pages.employee.sidebar.create_appointment   },
		{ href: '/ai-assistant',                  icon: 'fas fa-robot',           label: siteConfig.pages.employee.sidebar.ai_assistant         },
      ]
    } else {
      return [
        { href: '/client/dashboard',         icon: 'fas fa-tachometer-alt',   label: siteConfig.pages.client.sidebar.dashboard          },
        { href: '/client/book-appointment',  icon: 'fas fa-calendar-plus',    label: siteConfig.pages.client.sidebar.book_appointment   },
        { href: '/client/my-bookings',       icon: 'fas fa-bookmark',         label: siteConfig.pages.client.sidebar.my_bookings        },
		{ href: '/ai-assistant',             icon: 'fas fa-robot',            label: siteConfig.pages.client.sidebar.ai_assistant       },
      ]
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem(CHAT_STORAGE_KEY)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="layout">
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <a href={getDashboardUrl()} className="logo-link" aria-label={`${siteConfig.site_name} home`}>
            <img
              src="/image/bookflow_primary_logo.png"
              alt="BookFlow logo"
              className="header-logo"
              width="188"
              height="55"
              loading="eager"
              decoding="async"
              style={{
                filter: 'brightness(0) invert(1)',
                marginTop: '-15px',
                marginLeft: '-9px',
              }}
            />
          </a>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             {/* Calendar + Management (Gear) SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
            
                style={{
                  marginTop: '-5px' 
                }}>
              {/* Calendar body */}
              <rect x="2" y="3" width="20" height="19" rx="2" stroke="lightblue" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 9h20M7 3v3M17 3v3" stroke="lightblue" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ color: 'lightblue', margin: 0 }}>
              {siteConfig.site_subname}
            </p>
          </div>

        </div>
        
        <nav className="sidebar-nav" aria-label="Main navigation">
          {getMenuItems().map(item => {
            const active = router.pathname === item.href
            return ( 
              <button
                key={item.href}
                className={`nav-item${active ? ' nav-item--active' : ''}`}
                onClick={() => { if (active) return; router.push(item.href); setSidebarOpen(false) }}
              >
                <span className="nav-icon" aria-hidden="true"><i className={item.icon} /></span>
                <span className="nav-label">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="util-btn"
            data-active={router.pathname.startsWith('/support') ? 'true' : 'false'}
            aria-label="Support"
            onClick={() => {
              if (router.pathname.startsWith('/support')) return;
              setSidebarToast('Support page coming soon!');
            }}
          >
            <i className="fas fa-comment-dots" />
          </button>
          <button
            className="util-btn"
            data-active={router.pathname.startsWith('/settings') ? 'true' : 'false'}
            aria-label="Settings"
            onClick={() => {
              if (router.pathname.startsWith('/settings')) return;
              router.push('/settings');
            }}
          >
            <i className="fas fa-cog" />
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="layout-body">
        {/* Header */}
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <i className="fas fa-bars" />
          </button>

          <div className="topbar-search">
            <i className="fas fa-search search-icon" aria-hidden="true" />
            <input type="search" placeholder="Search anything…" className="search-input" />
          </div>

          <div className="topbar-right">
            <button
              className="create-btn"
              onClick={() => {
                if (router.pathname === '/employee/create-appointment') return
                router.push('/employee/create-appointment')
              }}
            >
              <i className="fas fa-plus" aria-hidden="true" /> Create
            </button>

            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                aria-label={`Notifications (${unreadCount})`}
                onClick={() => { setNotifOpen(!notifOpen); setAvatarMenuOpen(false) }}
              >
                <i className="fas fa-bell" />
                {unreadCount > 0 && <span className="notif-badge" aria-hidden="true">{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="notif-dropdown">
                  {notifications.map(n => (
                    <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                      <span className={`notif-dot ${n.type === 'success' ? 'dot--success' : n.type === 'error' ? 'dot--error' : 'dot--info'}`} />
                      <span>{n.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className={`icon-btn${router.pathname.startsWith('/support') ? ' active' : ''}`}
              aria-label="Support"
              onClick={() => {
                if (router.pathname.startsWith('/support')) return;
                setSidebarToast('Support page coming soon!');
              }}
            >
              <i className="fas fa-comment" />
            </button>

            <div className="user-avatar-wrapper" ref={avatarRef}>
              <button
                className="user-avatar"
                aria-label={`Account menu for ${user.name}`}
                onClick={() => {
                  setAvatarMenuOpen(!avatarMenuOpen);
                  setNotifOpen(false);
                  setChatOpen(false);          // 👈 close chat when opening avatar menu
                }}
              >
                {user.photo ? (
                  <img src={`/${user.photo}`} alt={user.name} className="avatar-img" />
                ) : (
                  <span className="avatar-initials">{initials}</span>
                )}
              </button>
              {avatarMenuOpen && (
              <div className="avatar-dropdown" role="menu">
                <div className="avatar-dropdown-header">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>

                {/* ── NEW: Dashboard link ── */}
                <button
                  className="avatar-dropdown-item"
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    router.push(getDashboardUrl());
                  }}
                  role="menuitem"
                >
                  <i className="fas fa-th-large" aria-hidden="true" /> Dashboard
                </button>

                <button 
                  className="avatar-dropdown-item" 
                  onClick={() => {
                    setAvatarMenuOpen(false); // 👈 Close the menu first
                    router.push('/settings');
                  }} 
                  role="menuitem"
                >
                  <i className="fas fa-cog" aria-hidden="true" /> Settings
                </button>

                <button 
                  className="avatar-dropdown-item" 
                  onClick={() => {
                    setAvatarMenuOpen(false); // 👈 Close on logout too
                    handleLogout();
                  }}
                  role="menuitem"
                >
                  <i className="fas fa-sign-out-alt" aria-hidden="true" /> Log out
                </button>
              </div>
            )} 
            </div>
          </div>
        </header>

        {/* SKELETON or CHILDREN */}
          <main className={`main-content ${!isPageLoading ? 'content-ready' : ''}`}>
            {isPageLoading ? getSkeleton() : children}
          </main>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
      <nav className={`mobile-drawer${sidebarOpen ? ' mobile-drawer--open' : ''}`} aria-label="Mobile navigation">
        <div className="mobile-drawer-header">
          <a href={getDashboardUrl()} className="logo-link" aria-label={`${siteConfig.site_name} home`}>
            <img src="/image/bookflow_primary_logo.png" alt="BookFlow logo" width="157" height="42" style={{ filter: 'brightness(0) invert(1)' }} />
          </a>
          <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" title="Close sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
              <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" stroke-width="2"/>
              <path d="M9 4V20" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
        <div className="mobile-drawer-sidebar-nav">
          {getMenuItems().map(item => {
            const active = router.pathname === item.href
            return (
              <button
                key={item.href}
                className={`nav-item${active ? ' nav-item--active' : ''}`}
                onClick={() => {
                  if (active) return;
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
              >
                <span className="nav-icon" aria-hidden="true"><i className={item.icon} /></span>
                <span className="nav-label">{item.label}</span>
              </button>
            )
          })}
        </div>
        <div className="mobile-drawer-footer">
          <button className="logout-link" onClick={handleLogout}>
            <svg viewBox="0 0 512 512" width="18" height="21" xmlns="http://w3.org">
              <path fill="currentColor" d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 432v32c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V48c0-13.3 10.7-24 24-24h144c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H48v336h120c13.3 0 24 10.7 24 24z"/>
            </svg>
            Sign out
          </button>
        </div>
      </nav>

      {/* ── CHAT WIDGET ── */}
      {router.pathname !== '/admin/ai-assistant' 
      && router.pathname !== '/ai-assistant' && (
        <div className="chat-root">
          {/* Always-visible bubble */}
          <button 
            className={`chat-bubble ${chatOpen ? 'chat-bubble--open' : ''}`} 
            onClick={() => { 
              const opening = !chatOpen; 
              setChatOpen(opening); 
              setAvatarMenuOpen(false); 
              setNotifOpen(false); 

                // 👈 Use a timeout to ensure the element is rendered/visible
                setTimeout(() => {
                  chatInputRef.current?.focus();
                }, 300); 
                
              if (opening) {
                warmChatbot();
              }
            }} 
            aria-label={chatOpen ? 'Close assistant' : 'Open assistant'}
          >
            {chatOpen ? (
              <span className="chat-bubble-x">✕</span>
            ) : (
              <i className="fas fa-robot" />
            )}
          </button>
      
          {chatOpen && (
            <div className="chat-panel">
              <div className="chat-panel-header">
                <span>BookFlow Assistant</span>
                <button
                  onClick={() => setChatOpen(false)}
                  aria-label="Minimize assistant"
                  className="chat-minimize-btn"
                >
                  <i className="fas fa-chevron-down" />
                </button>
              </div>
              <div className="chat-messages">
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`chat-msg ${m.role === 'user' ? 'chat-msg--user' : 'chat-msg--bot'}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {m.content}
                  </div>
                ))}
                {/* Show typewriter text or loading dots */}
                {isTyping && (
                  <div className="chat-msg chat-msg--bot">
                    {typingMessage}
                  </div>
                )}
                {chatLoading && !isTyping && (
                  <div className="chat-msg chat-msg--bot typing-indicator">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-area">
                <input
                  ref={chatInputRef} 
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Type your question..."
                  disabled={chatLoading || isTyping}
                  className="chat-input"
                />
                <button
                  onClick={sendChat}
                  disabled={chatLoading || isTyping}
                  className="chat-send-btn"
                >
                  <i className="fas fa-paper-plane" />
                </button>
              </div>
            </div>
          )} 
        </div>
      )} 

      {sidebarToast && (
          <div
            className={`sidebar-toast${toastDismissing ? ' dismissing' : ''}`}
            role="alert"
            aria-live="polite"
          >
            <i className="fas fa-info-circle" />
            <span>{sidebarToast}</span>
            <button onClick={dismissSidebarToast} aria-label="Dismiss">
              <i className="fas fa-times" />
            </button>
          </div>
        )}

      {/* ── STYLES ── */}
      <style jsx>{`
                /* ── TOKENS ── */
        :global(:root) {
          --sidebar-w: 220px;
          --topbar-h: 64px;
          --bg-page: #f1f1f1;
          --bg-card: #ffffff;
          --bg-sidebar: #001e4a;
          --border: #e8e8e8;
          --text-primary: #111111;
          --text-secondary: #666666;
          --text-muted: #aaaaaa;
          --accent: #111111;
          --accent-green: #22c55e;
          --radius-card: 16px;
          --radius-btn: 10px;
          --navy: #001e4a;
          --sap-primary: #0a6ed1;
          --sap-primary-hover: #0854a0;
        }

        .layout { display: flex; min-height: 100vh; background: var(--bg-page); font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }

        /* ── SIDEBAR ── (unchanged) */
        .sidebar { width: var(--sidebar-w); background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 50; overflow-y: auto; }
        .sidebar-logo { padding: 1.25rem 1.25rem 1rem; border-bottom: 1px solid var(--border); }
        .logo-link { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; }
        .logo-icon { background: transparent; border-radius: 8px; display: flex; align-items: center; 
          justify-content: center; color: #fff; font-size: 0.9rem; flex-shrink: 0; }
        .logo-text { font-size: 0.95rem; font-weight: 700; color: var(--bg-card); letter-spacing: -0.01em; }

        .sidebar-nav { flex: 1; padding: 0.75rem 0.75rem; display: flex; flex-direction: column; gap: 0.15rem; }
        .nav-item {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0.55rem 0.85rem; border-radius: 0;
          text-decoration: none; color: #b0c4de; font-size: 1rem;
          font-weight: 500;
          transition: background 0.15s ease, color 0.15s ease, transform 0.16s var(--ease-out);
          cursor: pointer; background: none; border: none; width: 100%; text-align: left;
        }
         
        .nav-item:active { transform: scale(0.97); }
        .nav-item:hover { background: rgba(255, 255, 255, 0.04); color: #ffffff; }
        .nav-item--active { 
          background: rgba(255, 255, 255, 0.12); 
          color: #ffffff; font-weight: 600; 
          pointer-events: none;   /* prevents accidental re-clicks */
          cursor: default;        /* removes the hand cursor */ 
        }
        .nav-item--active:active { transform: scale(0.97); }
        .nav-item--mobile { padding: 0.75rem 1.5rem; border-radius: 0; }
        .nav-icon { width: 18px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0; }

        .nav-label { font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; } 

        .sidebar-footer { padding: 0.75rem; border-top: 1px solid var(--border); display: flex; gap: 0.5rem; }
        
        .sidebar-toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 1200;
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1rem; border-radius: 10px;
          background: #fff; color: #111; font-size: 0.85rem;
          font-weight: 500;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid #ebebeb;
          border-left: 4px solid #0a6ed1;
          animation: toastIn 0.25s var(--ease-out);
        }
        .sidebar-toast.dismissing {
          animation: toastOut 0.25s var(--ease-out) forwards;
        }
        .sidebar-toast button {
          background: none; border: none; color: #888; cursor: pointer;
          padding: 0; margin-left: 0.5rem; font-size: 0.9rem;
        }
        .sidebar-toast button:hover { color: #111; }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(20px); }
        }
        
        .util-btn {
          flex: 1; padding: 0.6rem; background: none; border: none;
          border-radius: 10px; color: lightblue; cursor: pointer;
          font-size: 1rem;
          transition: background 0.15s, color 0.15s, transform 0.16s var(--ease-out);
        }
        .util-btn:active { transform: scale(0.97); }
        .util-btn:hover { background: #f5f5f5; color: var(--text-primary); }
        .util-btn.active,
        .util-btn[data-active="true"] {background: #e6f0ff; color: #0a6ed1; font-weight: 600;
          pointer-events: none;
          cursor: default;
        }

        /* ── LAYOUT BODY ── */
        .layout-body { flex: 1; margin-left: var(--sidebar-w); display: flex; flex-direction: column; min-height: 100vh; width: calc(100vw - var(--sidebar-w)); }
        .topbar { height: var(--topbar-h); display: flex; align-items: center; gap: 1rem; padding: 0 1.5rem; position: sticky; top: 0; z-index: 40; background: rgba(214,234,255,0.5); backdrop-filter: blur(20px) saturate(2); -webkit-backdrop-filter: blur(20px) saturate(2); border-bottom: 1px solid rgba(10,110,209,0.12); box-shadow: 0 4px 20px rgba(0,30,74,0.06); }
        .mobile-menu-btn { display: none; background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-primary); padding: 0.4rem; }
        .topbar-search { flex: 1; max-width: 420px; position: relative; }
        .search-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.8rem; pointer-events: none; }
        .search-input { width: 100%; padding: 0.55rem 0.85rem 0.55rem 2.3rem; background: #f5f5f5; border: 1px solid transparent; border-radius: 10px; font-size: 0.875rem; color: var(--text-primary); outline: none; transition: border-color 0.15s, background 0.15s; }
        .search-input:focus { background: #fff; border-color: #d0d0d0; }
        .search-input::placeholder { color: var(--text-muted); }
        .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; }
        .create-btn {
          display: flex; align-items: center; gap: 0.4rem;
          background: var(--sap-primary); color: #fff; border: none;
          border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.85rem;
          font-weight: 600; cursor: pointer; text-decoration: none;
          transition: opacity 0.15s, transform 0.16s var(--ease-out);
        }
        .create-btn:active { transform: scale(0.97); }
        .create-btn:hover { opacity: 0.85; }
        .icon-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: transparent; border: none; cursor: pointer;
          color: var(--text-secondary); font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          position: relative;
          transition: background 0.15s ease, color 0.15s ease, transform 0.16s var(--ease-out);
        }
        .icon-btn:active { transform: scale(0.93); }
        .icon-btn:hover { background: #f5f5f5; color: var(--text-primary); }
        .notif-dot { position: absolute; top: 5px; right: 5px; width: 7px; height: 7px; background: var(--accent-green); border-radius: 50%; border: 1.5px solid #fff; }

        .user-avatar-wrapper { position: relative; }
        .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: #e5e7eb; overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; padding: 0; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-initials { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.02em; }

        .notif-badge { position: absolute; top: 2px; right: 2px; min-width: 18px; height: 18px; background: var(--accent-green); color: #fff; border-radius: 50%; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 4px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

        .notif-dropdown, .avatar-dropdown { 
          position: absolute; top: 40px; right: 0; 
          background: #fff; border-radius: 12px; 
          box-shadow: 0 12px 40px rgba(0,0,0,0.15); z-index: 200; 
          overflow: hidden; 
          animation: slideDown 0.2s var(--ease-out); 
        }
        .notif-dropdown { width: 320px; }
        .avatar-dropdown { width: 240px; top: 44px; }
        .notif-item { padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0; display: flex; gap: 0.5rem; align-items: center; font-size: 0.85rem; color: #333; }
        .notif-item.unread { background: #f8faff; font-weight: 600; }
        .dot--success { background: #22c55e; }
        .dot--error   { background: #ef4444; }
        .dot--info    { background: #3b82f6; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .avatar-dropdown-header { padding: 1rem; border-bottom: 1px solid #f0f0f0; }
        .avatar-dropdown-header strong { display: block; color: #111; font-size: 0.95rem; }
        .avatar-dropdown-header span { display: block; color: #666; font-size: 0.8rem; margin-top: 0.2rem; }
        .avatar-dropdown-item { width: 100%; background: none; border: none; padding: 0.75rem 1rem; text-align: left; cursor: pointer; font-size: 0.88rem; color: #333; display: flex; align-items: center; gap: 0.5rem; transition: background 0.15s; }
        .avatar-dropdown-item:hover { background: #f5f5f5; }

        .main-content { flex: 1; padding: 2rem; overflow-y: auto; overflow-x: hidden; }
        .main-content.content-ready > :first-child {
          animation: fadeIn 0.25s var(--ease-out) both;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }
        .mobile-drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; background: #001e4a; z-index: 200; transform: translateX(-100%); transition: transform 0.25s ease; display: flex; flex-direction: column; box-shadow: 4px 0 24px rgba(0,0,0,0.12); }
        .mobile-drawer--open { transform: translateX(0); }
        .mobile-drawer-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
        .mobile-drawer-sidebar-nav { flex: 1; padding: 0.75rem 0.75rem; display: flex; flex-direction: column; gap: 0.15rem; }
        .mobile-close-btn { margin-left: auto; background: none; border: none; font-size: 1.3rem; font-weight: 10; cursor: pointer; color: lightgray; padding: 0.3rem; }
        .mobile-drawer-footer { padding: 1rem 1.25rem; border-top: 1px solid var(--border); }
        .logout-link { background: none; border: none; cursor: pointer; color: #b0c4de; font-size: 0.875rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.85rem; border-radius: 0px; width: 100%; text-align: left; transition: background 0.15s; }
        .logout-link:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }

        /* ── SKELETON / SHIMMER (from preload) ── */
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

        /* ── CHAT WIDGET ROOT ── */
        .chat-root { position: fixed; bottom: 24px; right: 24px; z-index: 1100; }

        /* ── ALWAYS‑VISIBLE BUBBLE ── */
        .chat-bubble {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--sap-primary); color: #fff; border: none;
          font-size: 24px; cursor: pointer;
          box-shadow: 0 6px 20px rgba(10,110,209,0.25);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s var(--ease-out), box-shadow 0.2s ease, background 0.2s ease;
          animation: gentle-pulse 2s infinite;
        }
        .chat-bubble:active { transform: scale(0.93); }
        .chat-bubble:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 28px rgba(10,110,209,0.35);
        }
        .chat-bubble--open {
          background: #fff; color: var(--text-secondary);
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
          animation: none;
        }
        .chat-bubble-x { font-size: 20px; font-weight: 400; }
        @keyframes gentle-pulse {
          0% { box-shadow: 0 0 0 0 rgba(10,110,209,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(10,110,209,0); }
          100% { box-shadow: 0 0 0 0 rgba(10,110,209,0); }
        }

        /* ── CHAT PANEL ── */
        .chat-panel {
          position: absolute; bottom: 72px; right: 0;
          width: 360px; height: 480px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px) saturate(2);
          -webkit-backdrop-filter: blur(20px) saturate(2);
          border: 1px solid rgba(10,110,209,0.15);
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,30,74,0.15);
          display: flex; flex-direction: column; overflow: hidden;
          animation: popIn 0.25s var(--ease-out);
        }
        @keyframes popIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .chat-panel-header {
          padding: 0.9rem 1.25rem;
          background: rgba(10,110,209,0.08);
          border-bottom: 1px solid rgba(10,110,209,0.12);
          display: flex; align-items: center; justify-content: space-between;
          font-weight: 650; font-size: 0.95rem; color: var(--navy);
        }
        .chat-minimize-btn {
          background: none; border: none; font-size: 1.1rem;
          color: var(--text-secondary); cursor: pointer;
          padding: 0.2rem 0.4rem; border-radius: 6px; transition: background 0.15s;
        }
        .chat-minimize-btn:hover { background: rgba(0,0,0,0.05); }

        /* ── MESSAGES (FAST) ── */
        .chat-messages {
          flex: 1; overflow-y: auto; padding: 1rem;
          display: flex; flex-direction: column; gap: 0.5rem;
          will-change: scroll-position; contain: content;
          -webkit-overflow-scrolling: touch;
        }
        .chat-msg {
          max-width: 85%; padding: 0.6rem 1rem;
          border-radius: 18px; font-size: 0.85rem; line-height: 1.4;
          white-space: pre-wrap; word-break: break-word;
          opacity: 1; animation: none; transform: none;
        }
        .chat-msg--user {
          align-self: flex-end; background: var(--sap-primary);
          color: #fff; border-bottom-right-radius: 6px;
        }
        .chat-msg--bot {
          align-self: flex-start; background: rgba(10,110,209,0.07);
          color: var(--text-primary); border-bottom-left-radius: 6px;
        }

        /* ── TYPING INDICATOR (lightweight) ── */
        .typing-indicator {
          display: flex; align-items: center; gap: 4px;
          padding: 0.6rem 1rem; width: fit-content; will-change: contents;
        }
        .typing-indicator .dot {
          width: 6px; height: 6px; background: var(--sap-primary);
          border-radius: 50%; opacity: 0.4;
          will-change: transform;
          animation: bounce 1.2s infinite ease-in-out;
        }
        .typing-indicator .dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-indicator .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); }
          40% { transform: scale(1); }
        }

        /* ── INPUT AREA (immediate feedback) ── */
        .chat-input-area {
          padding: 0.7rem 1rem; border-top: 1px solid rgba(10,110,209,0.12);
          display: flex; gap: 0.5rem; align-items: center; contain: layout style;
        }
        .chat-input {
          flex: 1; padding: 0.6rem 0.9rem;
          border: 1px solid rgba(10,110,209,0.2); border-radius: 14px;
          background: rgba(255,255,255,0.7); outline: none;
          font-size: 0.85rem; color: var(--text-primary);
          transition: border-color 0.1s, box-shadow 0.1s;
          will-change: border-color, box-shadow;
        }
        .chat-input:focus {
          border-color: var(--sap-primary);
          box-shadow: 0 0 0 3px rgba(10,110,209,0.1);
        }
        .chat-send-btn {
          background: var(--sap-primary); color: #fff;
          border: none; border-radius: 50%; width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 0.95rem;
          transition: opacity 0.1s ease, transform 0.16s var(--ease-out);
          will-change: opacity;
        }
        .chat-send-btn:active { transform: scale(0.93); }
        .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .layout-body { margin-left: 0; width: 100vw; }
          .mobile-menu-btn { display: flex; }
          .topbar-search { max-width: none; }
          .main-content { padding: 1rem; }
          .chat-root { right: 16px; bottom: 16px; }
          .chat-panel { width: calc(100vw - 32px); height: 55vh; }
          .chat-bubble { right: 16px; bottom: 16px; }
        }
        @media (max-width: 480px) {
          .topbar-search { display: none; }
        }
      `}</style>
    </div>
  )
}