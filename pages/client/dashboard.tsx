import { withSsrAuth } from '../../lib/withAuth'
import { prisma } from '../../lib/db'
import DashboardLayout from '../../components/DashboardLayout'
import siteConfig from '../../site.json'
import Link from 'next/link'
import Head from 'next/head'
import { formatDate } from '../../lib/formatDate'
import { useState } from 'react'

/* ─── Toast ─────────────────────────────────────── */
function Toast({ message, type = 'success', onClose }: {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}) {
  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      <i className={`fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
      <span>{message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        <i className="fas fa-times" />
      </button>
      <style jsx>{`
        .toast { position: fixed; bottom: 24px; right: 24px; z-index: 600; display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 10px; background: #fff; color: #111; font-size: 0.85rem; font-weight: 500; box-shadow: 0 12px 30px rgba(0,0,0,0.1); border: 1px solid #ebebeb; animation: toastIn 0.25s var(--ease-out); }
        .toast--success { border-left: 4px solid #22c55e; }
        .toast--error { border-left: 4px solid #ef4444; }
        .toast button { background: none; border: none; color: #888; cursor: pointer; padding: 0; margin-left: 0.5rem; font-size: 0.9rem; }
        .toast button:hover { color: #111; }
        @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  )
}

/* ─── Modal ─────────────────────────────────────── */
function BookingModal({ booking, onClose }: { booking: any; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Booking Details</h3>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <span className="detail-label">Service</span>
            <span className="detail-value">{booking.service.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date & Time</span>
            <span className="detail-value">{booking.datetimeFormatted}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className={`status-badge badge--${booking.status.toLowerCase()}`}>{booking.status}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Employee</span>
            <span className="detail-value">{booking.employeeName || 'Unassigned'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Notes</span>
            <span className="detail-value">{booking.notes || '—'}</span>
          </div>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4);
          display: flex; justify-content: center; align-items: center; z-index: 1000;
        }
        .modal-content {
          background: #fff; border-radius: 16px; width: 90%; max-width: 480px; padding: 1.5rem;
          box-shadow: 0 24px 48px rgba(0,0,0,0.1); animation: modalIn 0.2s ease;
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
        .modal-header h3 { margin: 0; font-size: 1.15rem; }
        .modal-close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #888; }
        .modal-body { display: flex; flex-direction: column; gap: 0.75rem; }
        .detail-row { display: flex; flex-direction: column; gap: 0.2rem; }
        .detail-label { font-size: 0.725rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; }
        .detail-value { font-size: 0.9rem; color: #111; }
        .status-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; }
        .badge--pending   { background: #fef3c7; color: #92400e; }
        .badge--confirmed { background: #d1fae5; color: #065f46; }
        .badge--completed { background: #e0e7ff; color: #3730a3; }
        .badge--cancelled { background: #fee2e2; color: #991b1b; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user || user.role !== 'CLIENT') {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const appointmentsMade = await prisma.bookedAppointment.count({
    where: { clientId: user.id },
  })

  const lastVisit = await prisma.bookedAppointment.findFirst({
    where: { clientId: user.id, status: { not: 'CANCELLED' } },
    orderBy: { datetime: 'desc' },
  })

  let lastVisitFormatted = null
  if (lastVisit) {
    lastVisitFormatted = formatDate(lastVisit.datetime.toISOString(), "MMM d, yyyy · h:mm a")
  }

  const availableServices = await prisma.service.findMany({ take: 5 })

  const recentBookingsRaw = await prisma.bookedAppointment.findMany({
    where: { clientId: user.id },
    include: { service: true, employee: true },   // added employee
    orderBy: { datetime: 'desc' },
    take: 5,
  })

  const recentBookings = recentBookingsRaw.map((b) => ({
    id: b.id,
    status: b.status,
    service: { name: b.service.name },
    employeeName: b.employee?.name || null,            // new field
    notes: b.notes,                                    // new field
    datetimeFormatted: formatDate(b.datetime.toISOString(), 'MMM d, yyyy · h:mm a'),
  }))

  return {
    props: {
      user,
      appointmentsMade,
      lastVisitFormatted,
      availableServices: JSON.parse(JSON.stringify(availableServices)),
      recentBookings,
      config: siteConfig,
    },
  }
})

export default function ClientDashboard({
  user, appointmentsMade, lastVisitFormatted,
  availableServices, recentBookings, config,
}: any) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)

  return (
    <>
      <Head>
        <title>{config.pages.client.dashboard.title}</title>
      </Head>
      <DashboardLayout user={user}>
        <div className="page">
          <div className="page-header">
            <h1 className="page-title">My Dashboard</h1>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{appointmentsMade}</div>
              <div className="stat-label">{config.pages.client.dashboard.stats_labels.appointments_made}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{lastVisitFormatted || '—'}</div>
              <div className="stat-label">{config.pages.client.dashboard.stats_labels.last_visit}</div>
            </div>
          </div>

          {/* Available Services */}
          <div className="card table-card">
            <div className="card-head">
              <i className="fas fa-concierge-bell" />
              <h2>{config.pages.client.dashboard.available_services_heading}</h2>
            </div>
            {availableServices.length === 0 ? (
              <p className="empty-state">{config.pages.client.dashboard.no_available_message}</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>{config.pages.client.dashboard.available_table.service}</th>
                      <th>{config.pages.client.dashboard.available_table.description}</th>
                      <th>{config.pages.client.dashboard.available_table.duration}</th>
                      <th>{config.pages.client.dashboard.available_table.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableServices.map((s: any) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.description || '—'}</td>
                        <td>{s.durationMin} min</td>
                        <td>
                          <Link href={`/client/book-appointment?service=${s.id}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none'}}>
                            {config.pages.client.dashboard.available_table.book_button}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="card table-card">
            <div className="card-head">
              <i className="fas fa-history" />
              <h2>{config.pages.client.dashboard.recent_bookings_heading}</h2>
            </div>
            {recentBookings.length === 0 ? (
              <p className="empty-state">{config.pages.client.dashboard.no_results_message}</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <tr>
                      <th>{config.pages.client.dashboard.recent_table.service}</th>
                      <th>{config.pages.client.dashboard.recent_table.datetime}</th>
                      <th>{config.pages.client.dashboard.recent_table.status}</th>
                      <th>{config.pages.client.dashboard.recent_table.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b: any) => (
                      <tr key={b.id}>
                        <td>{b.service.name}</td>
                        <td>{b.datetimeFormatted}</td>
                        <td>
                          <span className={`status-badge ${b.status.toLowerCase()}`}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBooking(b)}>
                            {config.pages.client.dashboard.recent_table.details_button}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {selectedBooking && <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <style jsx>{`
          .page { max-width: 1000px; margin: 0 auto; width: 100%; }
          .page-header { margin-bottom: 1.75rem; }
          .page-title { font-size: 1.75rem; font-weight: 800; color: #111; letter-spacing: -0.03em; margin: 0; }

          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
          .stat-card { background: #fff; border-radius: 12px; border: 1px solid #ebebeb; padding: 1.2rem; }
          .stat-number { font-size: 2rem; font-weight: 800; color: #0a6ed1; margin-bottom: 0.2rem; }
          .stat-label { font-size: 0.8rem; color: #888; font-weight: 500; }

          .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; margin-bottom: 1.25rem; }
          .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
          .card-head i { font-size: 1.1rem; color: var(--sap-primary, #0a6ed1); }
          .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }

          .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 0.75rem 1rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; border-bottom: 1px solid #f0f0f0; background: #fafafa; position: sticky; top: 0; z-index: 1; }
          td { padding: 0.6rem 1rem; font-size: 0.84rem; color: #111; border-bottom: 1px solid #f5f5f5; }
          tbody tr:nth-child(even) { background: #fafbfc; }
          tbody tr:hover { background: #f1f5f9; }
          .empty-state { text-align: center; padding: 2rem; color: #888; font-size: 0.9rem; }

          .status-badge {
            display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
          }
          .pending   { background: #fef3c7; color: #92400e; }
          .confirmed { background: #d1fae5; color: #065f46; }
          .completed { background: #e0e7ff; color: #3730a3; }
          .cancelled { background: #fee2e2; color: #991b1b; }

          .btn {
            display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem; border-radius: 8px;
            font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none;
            transition: transform 0.16s var(--ease-out), box-shadow 0.16s ease, background-color 0.18s ease;
          }
          .btn:active { transform: scale(0.97); }
          .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
          .btn-primary:hover { background: #0854a0; }
          .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
          .btn-secondary:hover { background: #ebebeb; }
          .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }
        `}</style>
      </DashboardLayout>
    </>
  )
}