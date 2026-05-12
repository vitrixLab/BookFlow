// pages/admin/dashboard.tsx
import { withSsrAuth } from '../../lib/withAuth'
import { prisma } from '../../lib/db'
import siteConfig from '../../site.json'
import DashboardLayout from '../../components/DashboardLayout'
import Link from 'next/link'
import { useState, useCallback, useEffect, useRef } from 'react'
import { formatDate } from '../../lib/formatDate'
import Head from 'next/head'
import { getBloomStats } from '../../lib/bloom'
import { useRouter } from 'next/router'
import ObservatoryPanel from '../../components/admin/ObservatoryPanel'
import Footer from '../../components/Footer'

/* ── TYPES ──────────────────────────────────────────── */
interface AppointmentSummary {
  id: number
  client: { name: string }
  service: { name: string }
  status: string
  formattedDatetime: string
}

interface UserSummary {
  id: number
  name: string
  role: string
  formattedCreatedAt: string
}

interface WeekDay {
  label: string
  count: number
  isToday: boolean
}

interface DashboardProps {
  user: { id: number; name: string; email: string; role: string; photo?: string | null }
  todayAppointments: number
  pendingAppointments: number
  overdueAppointments: AppointmentSummary[]
  recentUsers: UserSummary[]
  recentAppointments: AppointmentSummary[]
  weeklyStats: WeekDay[]
  bloomStats: { emailChecks: number; emailSaved: number; appointmentChecks: number; appointmentSaved: number }
  config: typeof siteConfig
}

/* ── SERVER ─────────────────────────────────────────── */
export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user || user.role !== 'ADMIN') {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86_400_000)

  const bloomStats = getBloomStats()

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayStart)
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  const [
    todayAppointments,
    pendingAppointments,
    overdueRaw,
    recentUsersRaw,
    recentPendingRaw,
    ...dailyCounts
  ] = await Promise.all([
    prisma.bookedAppointment.count({
      where: { datetime: { gte: todayStart, lt: todayEnd }, status: { not: 'CANCELLED' } },
    }),
    prisma.bookedAppointment.count({ where: { status: 'PENDING' } }),
    prisma.bookedAppointment.findMany({
      where: { status: 'PENDING', datetime: { lt: now } },
      include: { client: true, service: true },
      orderBy: { datetime: 'asc' },
      take: 10,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, name: true, role: true, createdAt: true },
    }),
    prisma.bookedAppointment.findMany({
      where: { status: 'PENDING' },
      orderBy: { datetime: 'asc' },
      take: 6,
      include: { client: true, service: true },
    }),
    ...last7.map(d =>
      prisma.bookedAppointment.count({
        where: {
          datetime: { gte: d, lt: new Date(d.getTime() + 86_400_000) },
          status: { not: 'CANCELLED' },
        },
      })
    ),
  ])

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeklyStats: WeekDay[] = last7.map((d, i) => ({
    label: DAYS[d.getDay()],
    count: dailyCounts[i] as number,
    isToday: i === 6,
  }))

  const fmtUser = (d: Date) => formatDate(d.toISOString(), 'MMM d, yyyy')
  const fmtAppt = (d: Date) => formatDate(d.toISOString(), 'MMM d · h:mm a')

  return {
    props: {
      user,
      todayAppointments,
      pendingAppointments,
      overdueAppointments: (overdueRaw as any[]).map(a => ({
        id: a.id,
        client: { name: a.client.name },
        service: { name: a.service.name },
        status: a.status,
        formattedDatetime: fmtAppt(a.datetime),
      })),
      recentUsers: recentUsersRaw.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        formattedCreatedAt: fmtUser(u.createdAt),
      })),
      recentAppointments: (recentPendingRaw as any[]).map(a => ({
        id: a.id,
        client: { name: a.client.name },
        service: { name: a.service.name },
        status: a.status,
        formattedDatetime: fmtAppt(a.datetime),
      })),
      weeklyStats,
      bloomStats,
      config: siteConfig,
    },
  }
})

/* ── MODAL ──────────────────────────────────────────── */
function AppointmentModal({
  appointment,
  onClose,
  onUpdate,
  loading,
  feedback,
}: {
  appointment: AppointmentSummary
  onClose: () => void
  onUpdate: (id: number, status: string) => void
  loading: boolean
  feedback: { type: 'success' | 'error'; message: string } | null
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const focusable = ref.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled])'
    )
    focusable?.[0]?.focus()
    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !focusable?.length) return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [onClose])

  const statusMeta: Record<string, { label: string; bg: string; color: string }> = {
    PENDING:   { label: 'Pending',   bg: '#fef9c3', color: '#854d0e' },
    CONFIRMED: { label: 'Confirmed', bg: '#dcfce7', color: '#166534' },
    COMPLETED: { label: 'Completed', bg: '#dbeafe', color: '#1e40af' },
    CANCELLED: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b' },
  }
  const meta = statusMeta[appointment.status] ?? { label: appointment.status, bg: '#f5f5f5', color: '#666' }

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-ttl"
      onClick={onClose}
    >
      <div className="modal" ref={ref} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="modal-ttl">Appointment Details</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="modal-body">
          {[
            { label: 'Client',  value: appointment.client.name },
            { label: 'Service', value: appointment.service.name },
            { label: 'Date',    value: appointment.formattedDatetime },
          ].map(row => (
            <div key={row.label} className="detail-row">
              <span className="dl">{row.label}</span>
              <span className="dv">{row.value}</span>
            </div>
          ))}
          <div className="detail-row">
            <span className="dl">Status</span>
            <span
              className="status-pill"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        {feedback && (
          <div role="status" className={`fb fb--${feedback.type}`}>
            <i className={`fas fa-${feedback.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
            {feedback.message}
          </div>
        )}

        <div className="modal-foot">
          {appointment.status === 'PENDING' && (
            <>
              <button
                className="m-btn m-btn--dark"
                disabled={loading}
                onClick={() => onUpdate(appointment.id, 'CONFIRMED')}
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin" /> Approving…</>
                  : <><i className="fas fa-check" /> Approve</>}
              </button>
              <button
                className="m-btn m-btn--red"
                disabled={loading}
                onClick={() => onUpdate(appointment.id, 'CANCELLED')}
              >
                <i className="fas fa-ban" /> Cancel
              </button>
            </>
          )}
          <button className="m-btn m-btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>

      <style jsx>{`
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:500;padding:1rem;backdrop-filter:blur(4px);animation:oFade .15s ease}
        @keyframes oFade{from{opacity:0}to{opacity:1}}
        .modal{background:#fff;border-radius:16px;width:100%;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,0.18);animation:mUp .2s ease}
        @keyframes mUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .modal-head{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #f0f0f0}
        .modal-head h2{font-size:1rem;font-weight:700;color:#111;margin:0}
        .close-btn{background:none;border:none;font-size:1rem;cursor:pointer;color:#aaa;padding:.3rem;border-radius:6px;transition:background .15s,color .15s}
        .close-btn:hover{background:#f5f5f5;color:#111}
        .modal-body{padding:1rem 1.5rem}
        .detail-row{display:flex;justify-content:space-between;align-items:center;padding:.55rem 0;border-bottom:1px solid #f5f5f5}
        .detail-row:last-child{border:none}
        .dl{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#aaa}
        .dv{font-size:.9rem;font-weight:500;color:#111}
        .status-pill{font-size:.72rem;font-weight:700;padding:.2rem .7rem;border-radius:999px}
        .fb{display:flex;align-items:center;gap:.5rem;margin:0 1.5rem .5rem;padding:.65rem 1rem;border-radius:10px;font-size:.85rem;font-weight:600}
        .fb--success{background:#f0fdf4;color:#166534}
        .fb--error{background:#fef2f2;color:#dc2626}
        .modal-foot{display:flex;gap:.5rem;justify-content:flex-end;padding:.75rem 1.5rem 1.25rem}
        .m-btn{display:inline-flex;align-items:center;gap:.4rem;font-size:.82rem;font-weight:600;padding:.45rem 1rem;border-radius:10px;border:none;cursor:pointer;transition:opacity .15s;font-family:inherit}
        .m-btn:disabled{opacity:.6;cursor:not-allowed}
        .m-btn--dark{background:#111;color:#fff}
        .m-btn--dark:hover:not(:disabled){opacity:.8}
        .m-btn--red{background:#fee2e2;color:#dc2626}
        .m-btn--red:hover:not(:disabled){background:#fecaca}
        .m-btn--ghost{background:#f5f5f5;color:#555;border:1px solid #e8e8e8}
        .m-btn--ghost:hover{background:#ebebeb}
      `}</style>
    </div>
  )
}

/* ── HELPERS ── */
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const PALETTE = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fecaca', '#e9d5ff', '#fed7aa']
function serviceColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

/* ── MAIN ─────────────────────────────────────────── */
export default function AdminDashboard({
  user,
  todayAppointments,
  pendingAppointments,
  overdueAppointments,
  recentUsers,
  recentAppointments,
  weeklyStats,
  bloomStats,
  config,
}: DashboardProps) {
  const router = useRouter()
  const dc = config.pages.admin.dashboard   // shortcut for labels

  const [selected, setSelected] = useState<AppointmentSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [localPending, setLocalPending] = useState(recentAppointments)
  const [localOverdue, setLocalOverdue] = useState(overdueAppointments)
  const [observatoryOpen, setObservatoryOpen] = useState(false)

  const maxCount = Math.max(...weeklyStats.map(d => d.count), 1)
  const weekTotal = weeklyStats.reduce((s, d) => s + d.count, 0)

  const openModal = (a: AppointmentSummary) => { setFeedback(null); setSelected(a) }
  const closeModal = () => { setSelected(null); setFeedback(null) }

  const handleUpdate = useCallback(async (id: number, status: string) => {
    setLoading(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setLocalPending(p => p.filter(a => a.id !== id))
      setLocalOverdue(p => p.filter(a => a.id !== id))
      setFeedback({ type: 'success', message: 'Appointment updated.' })
      setTimeout(closeModal, 1_200)
    } catch {
      setFeedback({ type: 'error', message: 'Update failed. Try again.' })
    } finally {
      setLoading(false)
    }
  }, [])

  return (
  <>
    <Head>
      <title>{dc.title}</title>
    </Head>
    <DashboardLayout user={user}>
      <div className="page">

        {/* ── TITLE ROW ── */}
        <div className="page-header">
          <h1 className="page-title">{dc.heading}</h1>
          {localOverdue.length > 0 && !alertDismissed && (
            <div className="alert-chip" role="alert">
              <i className="fas fa-exclamation-circle" />
              {localOverdue.length} overdue
              <button className="chip-cta" onClick={() => openModal(localOverdue[0])}>Review</button>
              <button className="chip-x" aria-label="Dismiss" onClick={() => setAlertDismissed(true)}>
                <i className="fas fa-times" />
              </button>
            </div>
          )}
        </div>

        {/* ── TWO-COLUMN BODY ── */}
        <div className="two-col">

          {/* LEFT */}
          <div className="col-left">

            {/* Overview card */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">{dc.overview_title}</span>
              </div>

              <div className="kpi-row">
                <div className="kpi">
                  <div className="kpi-icon"><i className="fas fa-calendar-day" /></div>
                  <div className="kpi-lbl">{dc.today_label}</div>
                  <div className="kpi-num">{todayAppointments}</div>
                  <div className="kpi-sub">{dc.today_sub}</div>
                </div>
                <div className="kpi-sep" />
                <div className="kpi">
                  <div className="kpi-icon kpi-icon--soft"><i className="fas fa-clock" /></div>
                  <div className="kpi-lbl">{dc.pending_label}</div>
                  <div className="kpi-num">{pendingAppointments}</div>
                  <div className="kpi-sub">{dc.pending_sub}</div>
                </div>
              </div>

              <div className="users-row">
                <div className="users-text">
                  <strong>{recentUsers.length} {dc.new_users_label}</strong>
                  <span>{dc.new_users_sub}</span>
                </div>
                <div className="avatars" style={{ textAlign: 'center' }}>
                  {recentUsers.slice(0, 5).map(u => (
                    <Link key={u.id} href={`/admin/users?highlight=${u.id}`} className="av" title={u.name}>
                      <div className="av-circle">{getInitials(u.name)}</div>
                      <span className="av-name">{u.name.split(' ')[0]}</span>
                    </Link>
                  ))}
                  <Link href="/admin/users" className="av" title={dc.view_all_users}>
                    <div className="av-circle av-circle--ghost"><i className="fas fa-arrow-right" /></div>
                    <span className="av-name">{dc.view_all_users}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Chart card */}
            <div className="card chart-card">
              <div className="card-head">
                <span className="card-title">{dc.chart_title}</span>
              </div>
              <div className="chart-wrap">
                <div className="chart-bg-num" aria-hidden="true">{weekTotal}</div>
                <div className="chart" role="img" aria-label="Bar chart showing appointments per day this week">
                  {weeklyStats.map((d, i) => (
                    <div key={i} className="bar-col">
                      {d.isToday && (
                        <div className="tooltip">{d.count}</div>
                      )}
                      <div
                        className={`bar${d.isToday ? ' bar--green' : ''}`}
                        style={{ height: `${Math.max((d.count / maxCount) * 100, 5)}%` }}
                      />
                      <span className="bar-lbl">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── OBSERVATORY (collapsible) ────────  */}
            <div className="card">
              <div className="card-head" style={{ cursor: 'pointer' }} onClick={() => setObservatoryOpen(!observatoryOpen)}>
                <span className="card-title">{dc.observatory_title}</span> 
                <span className="see-all">{observatoryOpen ? dc.observatory_collapse : dc.observatory_expand}</span>
              </div>
              {observatoryOpen && (
                <div style={{ padding: '0 1.4rem 1.25rem' }}>
                  <ObservatoryPanel labels={dc} />
                </div>
              )}
            </div>

          </div>

          {/* RIGHT */}
          <div className="col-right">

            {/* Pending */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">{dc.pending_appointments_title}</span>
                <Link href="/admin/appointments?status=PENDING" className="see-all">{dc.all_pending_link}</Link>
              </div>
              {localPending.length === 0 ? (
                <p className="empty"><i className="fas fa-check-circle" /> All caught up!</p>
              ) : (
                <ul className="item-list">
                  {localPending.map(a => (
                    <li key={a.id}>
                      <button className="item" onClick={() => openModal(a)}>
                        <div className="item-thumb" style={{ background: serviceColor(a.service.name) }}>
                          {a.service.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="item-info">
                          <span className="item-name">{a.client.name}</span>
                          <span className="item-meta">{a.service.name}</span>
                        </div>
                        <div className="item-right">
                          <span className="item-date">{a.formattedDatetime}</span>
                          <span className="dot dot--amber" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Overdue */}
            {localOverdue.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <span className="card-title">{dc.overdue_title}</span>
                  <span className="overdue-count">{localOverdue.length}</span>
                </div>
                <ul className="item-list">
                  {localOverdue.slice(0, 4).map(a => (
                    <li key={a.id}>
                      <button className="item" onClick={() => openModal(a)}>
                        <div className="item-thumb item-thumb--red">
                          {a.service.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="item-info">
                          <span className="item-name">{a.client.name}</span>
                          <span className="item-meta">{a.service.name}</span>
                        </div>
                        <div className="item-right">
                          <span className="item-date item-date--red">{a.formattedDatetime}</span>
                          <span className="dot dot--red" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── SYSTEM HEALTH (enhanced) ──────────── */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">{dc.system_health_title}</span>
              </div>
              <div className="health-status-row">
                <div className="status-indicator ok" />
                <span>{dc.health_ok}</span>
              </div>
              <div className="kpi-row">
                <div className="kpi">
                  <div className="kpi-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
                    <i className="fas fa-shield-alt" />
                  </div>
                  <div className="kpi-lbl">{dc.bloom_email_label}</div>
                  <div className="kpi-num" style={{ fontSize: '1.6rem' }}>{bloomStats.emailSaved}</div>
                  <div className="kpi-sub">{dc.bloom_email_sub}</div>
                </div>
                <div className="kpi-sep" />
                <div className="kpi">
                  <div className="kpi-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
                    <i className="fas fa-shield-alt" />
                  </div>
                  <div className="kpi-lbl">{dc.bloom_appt_label}</div>
                  <div className="kpi-num" style={{ fontSize: '1.6rem' }}>{bloomStats.appointmentSaved}</div>
                  <div className="kpi-sub">{dc.bloom_appt_sub}</div>
                </div>
              </div>
              <div className="users-row" style={{ paddingTop: 0 }}>
                <span className="activity-meta" style={{ fontSize: '0.73rem', color: '#888' }}>
                  {bloomStats.emailChecks + bloomStats.appointmentChecks} {dc.total_checks_label}
                </span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">{dc.quick_actions_title}</span>
              </div>
              <div className="qa-grid">
                {[
                  { href: '/admin/services',            icon: 'fas fa-plus-circle',    label: 'Add Service' },
                  { href: '/admin/users',               icon: 'fas fa-user-plus',      label: 'Add User'    },
                  { href: '/employee/create-appointment', icon: 'fas fa-calendar-check', label: 'New Booking' },
                  { href: '/admin/appointments',        icon: 'fas fa-list-alt',       label: 'All Bookings' },
                ].map(q => (
                  <button
                    key={q.href}
                    type="button"
                    className="qa"
                    onClick={() => router.push(q.href)}
                  >
                    <i className={q.icon} />
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {selected && (
        <AppointmentModal
          appointment={selected}
          onClose={closeModal}
          onUpdate={handleUpdate}
          loading={loading}
          feedback={feedback}
        />
      )}
 
    <Footer />

      <style jsx>{`
        /* PAGE */
        .page { max-width: 1200px; margin: 0 auto; width: 100%; }
        .page-header {
          display: flex; align-items: center; gap: 1rem;
          margin-bottom: 1.75rem; flex-wrap: wrap;
        }
        .page-title {
          font-size: 1.75rem; font-weight: 800; color: #111;
          letter-spacing: -0.03em; margin: 0; flex: 1;
        }

        /* Alert chip */
        .alert-chip {
          display: inline-flex; align-items: center; gap: .5rem;
          background: #fef3c7; border: 1px solid #fde68a;
          border-radius: 999px; padding: .35rem .85rem;
          font-size: .8rem; font-weight: 600; color: #92400e;
        }
        .chip-cta {
          background: #92400e; color: #fff; border: none;
          border-radius: 999px; padding: .2rem .65rem;
          font-size: .72rem; font-weight: 700; cursor: pointer; transition: opacity .15s;
        }
        .chip-cta:hover { opacity: .85; }
        .chip-x {
          background: none; border: none; cursor: pointer;
          color: #92400e; padding: 0; opacity: .6; font-size: .8rem; line-height: 1;
        }
        .chip-x:hover { opacity: 1; }

        /* TWO-COL → single on mobile */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.25rem;
          align-items: start;
          width: 100%;
          max-width: 100%;
        }
        .col-left  { display: flex; flex-direction: column; gap: 1.25rem; }
        .col-right { display: flex; flex-direction: column; gap: 1.25rem; }

        /* CARD */
        .card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #ebebeb;
          overflow: hidden;
          width: 100%;
          max-width: 100%;
        }
        .card-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.1rem 1.4rem .75rem;
        }
        .card-title { font-size: .92rem; font-weight: 700; color: #111; letter-spacing: -.01em; }
        .see-all { font-size: .78rem; font-weight: 600; color: #888; text-decoration: none; transition: color .15s; }
        .see-all:hover { color: #111; }

        /* KPI */
        .kpi-row {
          display: flex;
          padding: .25rem 1.4rem 1.25rem;
          border-bottom: 1px solid #f5f5f5;
        }
        .kpi { flex: 1; }
        .kpi-sep { width: 1px; background: #f0f0f0; margin: 0 1.5rem; flex-shrink: 0; }
        .kpi-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: #111; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: .75rem; margin-bottom: .75rem;
        }
        .kpi-icon--soft { background: #f5f5f5; color: #666; }
        .kpi-lbl  { font-size: .78rem; color: #888; font-weight: 500; margin-bottom: .3rem; }
        .kpi-num  { font-size: 2.6rem; font-weight: 800; color: #111; letter-spacing: -.04em; line-height: 1; margin-bottom: .35rem; }
        .kpi-sub  { font-size: .75rem; color: #aaa; }

        /* Users row */
        .users-row { padding: 1rem 1.4rem 1.25rem; }
        .users-text { margin-bottom: 1rem; }
        .users-text strong { display: block; font-size: .95rem; color: #111; }
        .users-text span   { display: block; font-size: .78rem; color: #aaa; margin-top: .1rem; }
        .avatars { display: flex; gap: 1rem; flex-wrap: wrap; }
        .av { display: flex; flex-direction: column; align-items: center; gap: .4rem; text-decoration: none; transition: transform .15s; }
        .av:hover { transform: translateY(-2px); }
        .av-circle {
          width: 52px; height: 52px; border-radius: 50%;
          background: #e5e7eb; color: #374151;
          display: flex; align-items: center; justify-content: center;
          font-size: .85rem; font-weight: 700;
          border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.08);
        }
        .av-circle--ghost { background: #f5f5f5; color: #888; }
        .av-name {
          font-size: .72rem; color: #888; font-weight: 500;
          max-width: 52px; text-align: center;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* Chart container – prevents overflow */
        .chart-card { position: relative; overflow: hidden; }
        .chart-wrap { overflow-x: auto; position: relative; padding-bottom: 1rem; }
        .chart-bg-num {
          position: absolute; bottom: 1rem; left: 0.5rem;
          font-size: 4rem; font-weight: 900; color: #bbf7d0;
          letter-spacing: -.04em; line-height: 1;
          pointer-events: none; user-select: none;
          z-index: 0;
        }
        .chart {
          display: flex; align-items: flex-end; gap: .5rem;
          padding: 0 1.4rem 0; height: 180px;
          position: relative; z-index: 1;
        }
        .bar-col {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end;
          gap: .4rem; height: 100%; position: relative;
        }
        .tooltip {
          position: absolute; top: -28px;
          background: #111; color: #fff;
          font-size: .7rem; font-weight: 700;
          padding: .2rem .5rem; border-radius: 6px; white-space: nowrap;
        }
        .tooltip::after {
          content: ''; position: absolute; top: 100%; left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent; border-top-color: #111;
        }
        .bar {
          width: 100%; border-radius: 6px 6px 4px 4px;
          background: #86efac; min-height: 5px; transition: height .3s ease;
          max-width: 50px;
        }
        .bar--green { background: #22c55e; }
        .bar-lbl { font-size: .7rem; color: #aaa; font-weight: 500; }

        /* Side list */
        .item-list { list-style: none; margin: 0; padding: 0 .75rem .75rem; }
        .item {
          display: flex; align-items: center; gap: .75rem;
          padding: .6rem .5rem; border-radius: 10px;
          background: none; border: none; cursor: pointer; width: 100%;
          text-align: left; font-family: inherit; transition: background .15s;
        }
        .item:hover { background: #f8f8f8; }
        .item-thumb {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: .7rem; font-weight: 800; color: #555; flex-shrink: 0;
        }
        .item-thumb--red { background: #fee2e2; color: #dc2626; }
        .item-info { flex: 1; min-width: 0; }
        .item-name  { display: block; font-size: .85rem; font-weight: 600; color: #111; }
        .item-meta  { display: block; font-size: .75rem; color: #aaa; margin-top: .1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .item-right { display: flex; flex-direction: column; align-items: flex-end; gap: .3rem; flex-shrink: 0; }
        .item-date  { font-size: .72rem; color: #aaa; white-space: nowrap; }
        .item-date--red { color: #dc2626; }
        .dot { width: 7px; height: 7px; border-radius: 50%; }
        .dot--amber { background: #f59e0b; }
        .dot--red   { background: #ef4444; }

        .overdue-count {
          background: #fee2e2; color: #dc2626;
          font-size: .7rem; font-weight: 700; padding: .15rem .55rem; border-radius: 999px;
        }
        .empty {
          display: flex; align-items: center; justify-content: center; gap: .5rem;
          padding: 1.5rem; font-size: .85rem; color: #aaa;
        }

        /* Quick actions */
        .qa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; padding: 0 .75rem .75rem; }
        .qa {
          display: flex; align-items: center; gap: .45rem;
          padding: .65rem .85rem; background: #f8f8f8;
          border: 1px solid #f0f0f0; border-radius: 10px;
          font-size: .78rem; font-weight: 600; color: #333;
          text-decoration: none; transition: all .15s;
        }
        .qa:hover { background: #111; color: #fff; border-color: #111; transform: translateY(-1px); cursor: pointer;}
        .qa i { font-size: .85rem; }

        /* Health status row */
        .health-status-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.25rem 1.4rem 0.75rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #198038;
        }
        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
          animation: healthPulse 2s infinite ease-in-out;
        }
        @keyframes healthPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(34, 197, 94, 0.5); }
          50% { transform: scale(1.3); box-shadow: 0 0 14px rgba(34, 197, 94, 0.8); }
        }

        /* RESPONSIVE */
        @media (max-width: 960px) {
          .two-col { grid-template-columns: 1fr; }
        }
        @media (max-width: 500px) {
          .kpi-row { flex-direction: column; gap: 1.25rem; }
          .kpi-sep  { width: 100%; height: 1px; margin: 0; }
          .chart-bg-num { display: none; }
          .bar { max-width: 32px; }
          .two-col { grid-template-columns: 1fr; width: 80%; }
        }
      `}</style>
    </DashboardLayout>
  </>
  )
}