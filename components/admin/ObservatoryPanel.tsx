// components/admin/ObservatoryPanel.tsx
import { useState, useEffect, useRef } from 'react'

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
    const match = line.match(
      /^([a-zA-Z_:][a-zA-Z0-9_:]*)\{?(.*?)\}?\s+([0-9.e+\-]+)/
    )
    if (!match) continue
    const name = match[1]
    const labelsStr = match[2]
    const value = parseFloat(match[3])
    const labels: Record<string, string> = {}
    if (labelsStr) {
      const parts = labelsStr.split(',')
      for (const part of parts) {
        const labelMatch = part.match(
          /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"([^"]*)"$/
        )
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

export default function ObservatoryPanel() {
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

  const totalRequests = metrics
    .filter((m) => m.name === 'http_requests_total')
    .reduce((sum, m) => sum + m.value, 0)

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
          .metrics-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 4rem 2rem;
            color: #888;
            font-size: 0.85rem;
          }
          .pulse-ring {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid #0a6ed1;
            animation: pulseRing 1.5s ease-out infinite;
          }
          @keyframes pulseRing {
            0% { box-shadow: 0 0 0 0 rgba(10,110,209,0.4); }
            100% { box-shadow: 0 0 0 20px rgba(10,110,209,0); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="metrics-grid">
      <div className="card">
        <div className="card-head">
          <span className="card-title">Business KPIs</span>
          <span className="badge">live</span>
        </div>
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
        <div className="card-head">
          <span className="card-title">Chatbot</span>
          <span className="badge">ai</span>
        </div>
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
        <div className="card-head">
          <span className="card-title">HTTP Traffic</span>
          <span className="badge">{totalRequests.toLocaleString()} req</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(requestsByPath)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([path, count]) => (
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
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #ebebeb;
          overflow: hidden;
        }
        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.4rem 0.75rem;
        }
        .card-title {
          font-size: .92rem;
          font-weight: 700;
          color: #111;
        }
        .kpi-row {
          display: flex;
          padding: .25rem 1.4rem 1.25rem;
          border-bottom: 1px solid #f5f5f5;
        }
        .kpi { flex: 1; }
        .kpi-sep {
          width: 1px;
          background: #f0f0f0;
          margin: 0 1.5rem;
          flex-shrink: 0;
        }
        .kpi-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #111;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .75rem;
          margin-bottom: .75rem;
        }
        .kpi-icon--soft { background: #f5f5f5; color: #666; }
        .kpi-lbl {
          font-size: .78rem;
          color: #888;
          font-weight: 500;
          margin-bottom: .3rem;
        }
        .kpi-num {
          font-size: 2.6rem;
          font-weight: 800;
          color: #111;
          letter-spacing: -.04em;
          line-height: 1;
          margin-bottom: .35rem;
        }
        .table-wrapper {
          overflow-x: auto;
          padding: 0 1.4rem 1rem;
        }
        table { width: 100%; border-collapse: collapse; }
        th {
          text-align: left;
          padding: 0.6rem 0.5rem;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #888;
          border-bottom: 1px solid #f0f0f0;
        }
        td {
          padding: 0.5rem 0.5rem;
          font-size: 0.85rem;
          color: #111;
          border-bottom: 1px solid #f5f5f5;
        }
        .http-path {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.75rem;
          color: #555;
        }
        .http-count {
          text-align: right;
          font-weight: 700;
          color: #0a6ed1;
          font-family: 'Fraunces', Georgia, serif;
        }
        .badge {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.2rem 0.55rem;
          border-radius: 20px;
          background: rgba(10,110,209,0.08);
          color: #0a6ed1;
        }
        @media (max-width: 768px) {
          .metrics-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}