// pages/settings.tsx
import { useState, useEffect, useRef } from 'react'
import { withSsrAuth } from '../lib/withAuth'
import DashboardLayout from '../components/DashboardLayout'
import Head from 'next/head'

export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { props: { user } }
})

// ── Metrics helpers ─────────────────────────────
interface MetricEntry {
  name: string
  labels: Record<string, string>
  value: number
}

function parsePrometheusText(text: string): MetricEntry[] {
  const lines = text.split('\n')
  const metrics: MetricEntry[] = []
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{?(.*?)\}?\s+([0-9.e+\-]+)/)
    if (!match) continue
    const name = match[1]
    const labelsStr = match[2]
    const value = parseFloat(match[3])
    const labels: Record<string, string> = {}
    if (labelsStr) {
      const parts = labelsStr.split(',')
      for (const part of parts) {
        const labelMatch = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"([^"]*)"$/)
        if (labelMatch) labels[labelMatch[1]] = labelMatch[2]
      }
    }
    metrics.push({ name, labels, value })
  }
  return metrics
}

function useAnimatedValue(target: number, duration = 600) {
  const [display, setDisplay] = useState(0)
  const frame = useRef<number>(0)

  useEffect(() => {
    const start = display
    const diff = target - start
    if (diff === 0) return
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) frame.current = requestAnimationFrame(animate)
    }
    frame.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame.current)
  }, [target])

  return display
}

function MetricsContent() {
  const [metrics, setMetrics] = useState<MetricEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics')
      const text = await res.text()
      setMetrics(parsePrometheusText(text))
    } catch (err) {
      console.error('Failed to fetch metrics', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30_000)
    return () => clearInterval(interval)
  }, [])

  const getValue = (name: string, labels?: Record<string, string>) => {
    const match = metrics.find((m) => {
      if (m.name !== name) return false
      if (!labels) return true
      return Object.entries(labels).every(([k, v]) => m.labels[k] === v)
    })
    return match?.value ?? 0
  }

  const totalRequests = metrics.filter((m) => m.name === 'http_requests_total').reduce((sum, m) => sum + m.value, 0)

  const requestsByPath: Record<string, number> = {}
  for (const m of metrics) {
    if (m.name === 'http_requests_total' && m.labels.path) {
      const key = `${m.labels.method || 'GET'} ${m.labels.path}`
      requestsByPath[key] = (requestsByPath[key] || 0) + m.value
    }
  }

  const rawUsers = getValue('bookflow_users_total')
  const rawAppointments = getValue('bookflow_appointments_total')
  const rawPending = getValue('bookflow_appointments_pending')
  const rawLlama = getValue('bookflow_chatbot_requests_total', { source: 'llm' })
  const rawCache = getValue('bookflow_chatbot_requests_total', { source: 'cache' })
  const rawDb = getValue('bookflow_chatbot_requests_total', { source: 'db' })

  const users = useAnimatedValue(rawUsers)
  const appointments = useAnimatedValue(rawAppointments)
  const pending = useAnimatedValue(rawPending)
  const llama = useAnimatedValue(rawLlama)
  const cacheDb = useAnimatedValue(rawCache + rawDb)

  if (loading) {
    return (
      <div className="metrics-loading">
        <div className="pulse-ring" />
        <span>Polling observatory…</span>
        <style jsx>{`
          .metrics-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 4rem 2rem; color: #888; font-size: 0.85rem; }
          .pulse-ring { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #0a6ed1; animation: pulseRing 1.5s ease-out infinite; }
          @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(10,110,209,0.4); } 100% { box-shadow: 0 0 0 20px rgba(10,110,209,0); } }
        `}</style>
      </div>
    )
  }

  return (
    <div className="metrics-grid">
      <div className="card">
        <div className="card-head"><span className="card-title">Business KPIs</span><span className="badge">live</span></div>
        <div className="kpi-row">
          <div className="kpi">
            <div className="kpi-icon"><i className="fas fa-users" /></div>
            <div className="kpi-lbl">Total Users</div>
            <div className="kpi-num">{users.toLocaleString()}</div>
          </div>
          <div className="kpi-sep" />
          <div className="kpi">
            <div className="kpi-icon kpi-icon--soft"><i className="fas fa-calendar-check" /></div>
            <div className="kpi-lbl">Appointments</div>
            <div className="kpi-num">{appointments.toLocaleString()}</div>
          </div>
        </div>
        <div className="kpi-row" style={{ borderTop: '1px solid #f5f5f5' }}>
          <div className="kpi">
            <div className="kpi-icon kpi-icon--soft"><i className="fas fa-clock" /></div>
            <div className="kpi-lbl">Pending review</div>
            <div className="kpi-num" style={{ fontSize: '1.6rem' }}>{pending.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-title">Chatbot</span><span className="badge">ai</span></div>
        <div className="kpi-row" style={{ borderBottom: 'none' }}>
          <div className="kpi">
            <div className="kpi-icon" style={{ background: '#dbeafe', color: '#1e40af' }}><i className="fas fa-robot" /></div>
            <div className="kpi-lbl">LLaMA</div>
            <div className="kpi-num">{llama.toLocaleString()}</div>
          </div>
          <div className="kpi-sep" />
          <div className="kpi">
            <div className="kpi-icon" style={{ background: '#dcfce7', color: '#166534' }}><i className="fas fa-database" /></div>
            <div className="kpi-lbl">Cache + DB</div>
            <div className="kpi-num">{cacheDb.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-head"><span className="card-title">HTTP Traffic</span><span className="badge">{totalRequests.toLocaleString()} req</span></div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(requestsByPath).sort(([, a], [, b]) => b - a).slice(0, 8).map(([path, count]) => (
                <tr key={path}>
                  <td className="http-path">{path}</td>
                  <td className="http-count">{count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .card { background: #F9F9F9; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .card-head { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.4rem 0.75rem; }
        .card-title { font-size: .92rem; font-weight: 700; color: #111; }
        .kpi-row { display: flex; padding: .25rem 1.4rem 1.25rem; border-bottom: 1px solid #e2e0e0; }
        .kpi { flex: 1; }
        .kpi-sep { width: 1px; background: #e2e0e0; margin: 0 1.5rem; flex-shrink: 0; }
        .kpi-icon { width: 30px; height: 30px; border-radius: 8px; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; font-size: .75rem; margin-bottom: .75rem; }
        .kpi-icon--soft { background: #f5f5f5; color: #666; }
        .kpi-lbl { font-size: .78rem; color: #888; font-weight: 500; margin-bottom: .3rem; }
        .kpi-num { font-size: 2.6rem; font-weight: 800; color: #111; letter-spacing: -.04em; line-height: 1; margin-bottom: .35rem; }
        .table-wrapper { overflow-x: auto; padding: 0 1.4rem 1rem; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.6rem 0.5rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; border-bottom: 1px solid #f0f0f0; }
        td { padding: 0.5rem 0.5rem; font-size: 0.85rem; color: #111; border-bottom: 1px solid #e2e0e0; }
        .http-path { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.75rem; color: #555; }
        .http-count { text-align: right; font-weight: 700; color: #0a6ed1; font-family: 'Fraunces', Georgia, serif; }
        .badge { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; padding: 0.2rem 0.55rem; border-radius: 20px; background: rgba(10,110,209,0.08); color: #0a6ed1; }
        @media (max-width: 768px) { .metrics-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}

export default function SettingsPage({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<string>('profile')
  const [leaving, setLeaving] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const switchTab = (key: string) => {
    if (key === activeTab) return
    setLeaving(true)
    setTimeout(() => {
      setActiveTab(key)
      setLeaving(false)
    }, 180)
  }

  const tabs = [
    { key: 'profile', label: 'Profile', icon: 'fas fa-user-circle' },
    ...(user.role === 'ADMIN' ? [
      { key: 'metrics', label: 'Observatory', icon: 'fas fa-chart-line' },
      { key: 'health', label: 'System Health', icon: 'fas fa-heartbeat' },
    ] : []),
  ]

  return (
    <>
      <Head>
        <title>Settings | BookFlow</title>
      </Head>
      <DashboardLayout user={user}>
        <div className="settings-shell">
          <div className="settings-header">
            <h1 className="settings-title">Settings</h1>
            <span className="settings-role-tag">
              <i className={user.role === 'ADMIN' ? 'fas fa-shield-haltered' : user.role === 'EMPLOYEE' ? 'fas fa-user-check' : 'fas fa-user'} />
              {user.role}
            </span>
          </div>

          <div className="tab-bar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab-btn ${activeTab === tab.key ? 'tab-btn--active' : ''}`}
                onClick={() => switchTab(tab.key)}
              >
                <i className={tab.icon} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div ref={contentRef} className={`tab-content ${leaving ? 'leaving' : 'entering'}`}>
            {activeTab === 'profile' && (
              <div className="profile-sheet">
                <div className="profile-avatar">
                  {user.photo ? (
                    <img src={user.photo.startsWith('http') ? user.photo : `/${user.photo}`} alt={user.name} />
                  ) : (
                    <span className="profile-initials">{user.name.split(' ').slice(0,2).map((n:string) => n[0]).join('')}</span>
                  )}
                </div>
                <div className="profile-fields">
                  <div className="pf-row"><span className="pf-label">Name</span><span className="pf-value">{user.name}</span></div>
                  <div className="pf-row"><span className="pf-label">Email</span><span className="pf-value">{user.email}</span></div>
                  <div className="pf-row"><span className="pf-label">Role</span><span className="pf-value accent">{user.role}</span></div>
                  <div className="pf-row"><span className="pf-label">Plan</span><span className="pf-value accent">{user.plan || 'Solo'}</span></div>
                </div>
              </div>
            )}

            {activeTab === 'metrics' && user.role === 'ADMIN' && <MetricsContent />}

            {activeTab === 'health' && user.role === 'ADMIN' && (
              <div className="health-sheet">
                <div className="health-status">
                  <div className="status-indicator ok" />
                  <span>All systems operational</span>
                </div>
                <p className="health-note">
                  Bloom filter statistics and detailed health indicators will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .settings-shell { max-width: 1100px; margin: 0 auto; width: 100%; }
          .settings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
          .settings-title { font-family: 'Fraunces', Georgia, serif; font-size: 2rem; font-weight: 800; color: #111; letter-spacing: -0.04em; margin: 0; }
          .settings-role-tag { display: flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.35rem 0.75rem; border-radius: 20px; background: rgba(10,110,209,0.08); color: #0a6ed1; border: 1px solid rgba(10,110,209,0.15); }

          .tab-bar { display: flex; gap: 0.25rem; border-bottom: 1px solid #ebebeb; margin-bottom: 1.5rem; }
          .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.2rem; border: none; background: none; font-size: 0.85rem; font-weight: 600; color: #888; cursor: pointer; transition: color 0.2s, box-shadow 0.2s; border-radius: 8px 8px 0 0; position: relative; }
          .tab-btn:hover { color: #111; }
          .tab-btn--active { color: #0a6ed1; box-shadow: 0 -2px 12px rgba(10,110,209,0.08); }
          .tab-btn--active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #0a6ed1; border-radius: 2px 2px 0 0; }
          .tab-btn i { font-size: 0.9rem; }

          .tab-content { transition: opacity 0.18s ease, transform 0.18s ease; }
          .tab-content.entering { opacity: 1; transform: translateY(0); }
          .tab-content.leaving { opacity: 0; transform: translateY(6px); }

          .profile-sheet { display: flex; gap: 2rem; align-items: flex-start; background: #F9F9F9; border: 1px solid #ebebeb; border-radius: 14px; padding: 2rem; }
          .profile-avatar { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 2px solid #e8e8e8; }
          .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
          .profile-initials { font-family: 'Fraunces', Georgia, serif; font-size: 1.6rem; font-weight: 800; color: #0a6ed1; }
          .profile-fields { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
          .pf-row { display: flex; align-items: baseline; gap: 1rem; padding-bottom: 0.6rem; border-bottom: 1px solid #e2e0e0; }
          .pf-row:last-child { border-bottom: none; }
          .pf-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: #888; font-weight: 600; min-width: 60px; }
          .pf-value { font-size: 0.95rem; color: #111; font-weight: 500; }
          .pf-value.accent { color: #0a6ed1; font-weight: 700; }

          .health-sheet {
            background: #F9F9F9;
            border: 1px solid #ebebeb;
            border-radius: 14px;
            padding: 2rem;
          }
          .health-status {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            margin-bottom: 1rem;
            font-size: 0.95rem;
            font-weight: 600;
            color: #198038;
          }
          .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #198038;
            box-shadow: 0 0 8px rgba(25, 128, 56, 0.5);
            animation: healthPulse 2s infinite ease-in-out;
          }
          @keyframes healthPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 8px rgba(25, 128, 56, 0.5);
            }
            50% {
              transform: scale(1.3);
              box-shadow: 0 0 14px rgba(25, 128, 56, 0.8);
            }
          }
          .health-note {
            font-size: 0.82rem;
            color: #666;
            line-height: 1.6;
          }
          @media (max-width: 768px) {
            .settings-title { font-size: 1.5rem; }
            .profile-sheet { flex-direction: column; align-items: center; text-align: center; }
            .pf-row { flex-direction: column; gap: 0.2rem; }
            .tab-btn { padding: 0.6rem 0.9rem; font-size: 0.78rem; }
          }
          @media (max-width: 480px) {
            .tab-bar { gap: 0; overflow-x: auto; }
            .tab-btn span { display: none; }
            .tab-btn i { font-size: 1rem; }
          }
        `}</style>
      </DashboardLayout>
    </>
  )
}