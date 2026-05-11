import { withSsrAuth } from '../../lib/withAuth'
import { prisma } from '../../lib/db'
import DashboardLayout from '../../components/DashboardLayout'
import siteConfig from '../../site.json'
import { useClientDate } from '../../lib/useClientDate'
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
  const date = useClientDate(booking.datetime)
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
            <span className="detail-value">{date || 'Loading...'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className={`status-badge badge--${booking.status.toLowerCase()}`}>{booking.status}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Employee</span>
            <span className="detail-value">{booking.employee?.name || 'Unassigned'}</span>
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
  const bookings = await prisma.bookedAppointment.findMany({
    where: { clientId: user.id },
    include: { service: true, employee: true },
    orderBy: { datetime: 'desc' },
  })
  return { props: { user, bookings: JSON.parse(JSON.stringify(bookings)), config: siteConfig } }
})

function BookingRow({ booking, onDetails }: { booking: any; onDetails: (b: any) => void }) {
  const date = useClientDate(booking.datetime)
  const statusClass: any = {
    PENDING: 'badge--pending',
    CONFIRMED: 'badge--confirmed',
    COMPLETED: 'badge--completed',
    CANCELLED: 'badge--cancelled',
  }
  return (
    <tr>
      <td>{booking.service.name}</td>
      <td>{date || 'Loading...'}</td>
      <td>
        <span className={`status-badge ${statusClass[booking.status] || ''}`}>
          {booking.status}
        </span>
      </td>
      <td>
        <button className="btn btn-secondary btn-sm" onClick={() => onDetails(booking)}>
          Details
        </button>
      </td>
    </tr>
  )
}

export default function ClientMyBookings({ user, bookings, config }) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)

  return (
    <DashboardLayout user={user}>
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">{config.pages.client.my_bookings.heading}</h1>
          <span className="badge">{bookings.length}</span>
        </div>
        <div className="card table-card">
          {bookings.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times" />
              <p>{config.pages.client.my_bookings.empty_message}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{config.pages.client.my_bookings.table.service}</th>
                    <th>{config.pages.client.my_bookings.table.datetime}</th>
                    <th>{config.pages.client.my_bookings.table.status}</th>
                    <th>{config.pages.client.my_bookings.table.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: any) => (
                    <BookingRow key={b.id} booking={b} onDetails={setSelectedBooking} />
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
        .page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #111; letter-spacing: -0.03em; margin: 0; }
        .badge { font-size: 0.72rem; font-weight: 600; color: #0a6ed1; background: rgba(10,110,209,0.08); padding: 0.2rem 0.6rem; border-radius: 20px; }

        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; margin-bottom: 1.25rem; }
        .table-card { overflow: hidden; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.75rem 1rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; border-bottom: 1px solid #f0f0f0; background: #fafafa; position: sticky; top: 0; z-index: 1; }
        td { padding: 0.6rem 1rem; font-size: 0.84rem; color: #111; border-bottom: 1px solid #f5f5f5; }
        tbody tr:nth-child(even) { background: #fafbfc; }
        tbody tr:hover { background: #f1f5f9; }
        .empty-state { text-align: center; padding: 3rem 1rem; color: #888; }
        .empty-state i { font-size: 2rem; margin-bottom: 0.5rem; display: block; }

        .status-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; }
        .badge--pending   { background: #fef3c7; color: #92400e; }
        .badge--confirmed { background: #d1fae5; color: #065f46; }
        .badge--completed { background: #e0e7ff; color: #3730a3; }
        .badge--cancelled { background: #fee2e2; color: #991b1b; }

        .btn { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; transition: transform 0.16s var(--ease-out), box-shadow 0.16s ease, background-color 0.18s ease; display: inline-flex; align-items: center; gap: 0.3rem; }
        .btn:active { transform: scale(0.97); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
        .btn-secondary:hover:not(:disabled) { background: #ebebeb; }
        .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }
      `}</style>
    </DashboardLayout>
  )
}