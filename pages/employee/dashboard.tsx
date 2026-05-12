// pages/employee/dashboard.tsx
import { withSsrAuth } from '../../lib/withAuth'
import { prisma } from '../../lib/db'
import DashboardLayout from '../../components/DashboardLayout'
import siteConfig from '../../site.json'
import { useState } from 'react'
import { formatDate } from '../../lib/formatDate'
import Footer from '../../components/Footer'

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
      <button onClick={onClose} aria-label="Dismiss"><i className="fas fa-times" /></button>
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

/* ─── Status Update Modal (employee actions) ────── */
function BookingModal({
  appointment,
  labels,
  onClose,
  onAction,
}: {
  appointment: any
  labels: any
  onClose: () => void
  onAction: (id: number, action: string) => void
}) {
  const status = appointment.status
  const showConfirm = status === 'PENDING'
  const showComplete = status === 'PENDING' || status === 'CONFIRMED'
  const showCancel = status !== 'CANCELLED' && status !== 'COMPLETED'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{labels.title}</h3>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <span className="detail-label">{labels.service_label}</span>
            <span className="detail-value">{appointment.serviceName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{labels.client_label}</span>
            <span className="detail-value">{appointment.clientName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{labels.datetime_label}</span>
            <span className="detail-value">{appointment.datetimeFormatted}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{labels.status_label}</span>
            <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{labels.sms_status_label}</span>
            <span className="detail-value">{appointment.smsSent ? labels.sent : labels.not_sent}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{labels.notes_label}</span>
            <span className="detail-value">{appointment.notes || '—'}</span>
          </div>
        </div>
          
        <div className="modal-actions">
          {showConfirm && (
            <button className="btn btn-success btn-sm" onClick={() => onAction(appointment.id, 'confirm')}>
              {labels.confirm_button || 'Confirm'}
            </button>
          )}
          {showComplete && (
            <button className="btn btn-primary btn-sm" onClick={() => onAction(appointment.id, 'complete')}>
              {labels.complete_button || 'Mark Complete'}
            </button>
          )}
          {showCancel && (
            <button className="btn btn-danger btn-sm" onClick={() => onAction(appointment.id, 'cancel')}>
              {labels.cancel_button || 'Cancel Booking'}
            </button>
          )}
          {showCancel && (
            <button className="btn btn-sm" onClick={onClose} >
              {labels.close_button || 'Close'}
            </button>
          )}
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
        .modal-body { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .detail-row { display: flex; flex-direction: column; gap: 0.2rem; }
        .detail-label { font-size: 0.725rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; }
        .detail-value { font-size: 0.9rem; color: #111; }
        .status-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; }
        .status-pending   { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #d1fae5; color: #065f46; }
        .status-completed { background: #e0e7ff; color: #3730a3; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap; }
        .btn { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 0.3rem; }
        .btn-success { background: #22c55e; color: #fff; }
        .btn-danger  { background: #ef4444; color: #fff; }
        .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
        .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; align-text: center;
          min-width: 5rem; height: 1.8rem; fontColor: #fff  
          /* ensure vertical centering */
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes modalIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

/* ─── Server Side Props ────────────────────────── */
export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user || user.role !== 'EMPLOYEE') {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Stats
  const todayAppointments = await prisma.bookedAppointment.count({
    where: {
      employeeId: user.id,
      datetime: { gte: today, lt: tomorrow },
      status: { not: 'CANCELLED' },
    },
  })

  const pendingSms = await prisma.bookedAppointment.count({
    where: {
      employeeId: user.id,
      smsSent: false,
      datetime: { gte: new Date() },
      status: 'CONFIRMED',
    },
  })

  // Fetch all appointments for this employee (not limited) for pagination/filter
  const allAppointmentsRaw = await prisma.bookedAppointment.findMany({
    where: { employeeId: user.id },
    include: { service: true, client: true },
    orderBy: { datetime: 'asc' },
  })

  const appointments = allAppointmentsRaw.map((app) => ({
    id: app.id,
    serviceName: app.service.name,
    clientName: app.client.name,
    datetimeFormatted: formatDate(app.datetime.toISOString()),
    status: app.status,
    smsSent: app.smsSent,
    notes: app.notes,
  }))

  return {
    props: {
      user,
      todayAppointments,
      pendingSms,
      appointments,   // full list
      config: siteConfig,
    },
  }
})

/* ─── Main Component ───────────────────────────── */
export default function EmployeeDashboard({
  user,
  todayAppointments,
  pendingSms,
  appointments,
  config,
}: any) {
  const PAGE_SIZE = 5
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')   // '' = all
  const [currentPage, setCurrentPage] = useState(1)

  // Filter appointments
  const filtered = appointments.filter((app: any) => {
    const matchesStatus = !statusFilter || app.status === statusFilter
    const query = search.trim().toLowerCase()
    const matchesSearch = !query ||
      app.serviceName.toLowerCase().includes(query) ||
      app.clientName.toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const labels = config.pages.employee.view_appointment

  const openModal = (app: any) => setSelectedAppointment(app)
  const closeModal = () => setSelectedAppointment(null)

  const handleAction = async (id: number, action: string) => {
    try {
      const res = await fetch('/api/appointments/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, status: action.toUpperCase() }),
      })
      if (res.ok) {
        setToast({ message: `Appointment ${action}ed successfully.`, type: 'success' })
        closeModal()
        setTimeout(() => window.location.reload(), 800)
      } else {
        setToast({ message: 'Failed to update appointment.', type: 'error' })
      }
    } catch {
      setToast({ message: 'Network error.', type: 'error' })
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="page">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{todayAppointments}</div>
            <div className="stat-label">{config.pages.employee.dashboard.stats_labels.appointments}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{pendingSms}</div>
            <div className="stat-label">{config.pages.employee.dashboard.stats_labels.pending_sms}</div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="card">
          <div className="card-header">
            <i className="fas fa-calendar-alt" />
            <h3>{config.pages.employee.dashboard.recent_appointments_heading}</h3>
          </div>
          
            {/* Filters */} 
            <div className="filters"
                    style={{
                            width: '100%',          // Takes full width of its parent
                            minWidth: '480px',      // Never shrinks below 200px
                            boxSizing: 'border-box' // Includes padding in width calculation
                        }}>
              <div className="search-bar"
                    style={{
                            width: '75%',          // Takes full width of its parent
                            minWidth: '200px',      // Never shrinks below 200px
                            boxSizing: 'border-box' // Includes padding in width calculation
                        }}>
                <input
                  type="text"
                  placeholder="Search by service or client name..."
                        style={{
                            width: '100%',          // Takes full width of its parent
                            minWidth: '200px',      // Never shrinks below 200px
                            boxSizing: 'border-box' // Includes padding in width calculation
                          }}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <button onClick={() => { setSearch(''); setCurrentPage(1); }}>
                  <i className="fas fa-search" />
                </button>
              </div>
              <div className="status-filter">
                <label>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
            
          {filtered.length === 0 ? (
            <div className="empty-state">No appointments found.</div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>{config.pages.employee.dashboard.table.title}</th>
                      <th>{config.pages.employee.dashboard.table.client}</th>
                      <th>{config.pages.employee.dashboard.table.date}</th>
                      <th>{config.pages.employee.dashboard.table.status || 'STATUS'}</th>
                      <th>{config.pages.employee.dashboard.table.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((app: any) => (
                      <tr key={app.id}>
                        <td>{app.serviceName}</td>
                        <td>{app.clientName}</td>
                        <td>{app.datetimeFormatted}</td>
                          <td>
                            <span className={`status-badge ${app.status.toLowerCase()}`}
                              style={{ 
                                  height: '1.5rem' ,
                                  /* ensure vertical centering */
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                              }}>
                              {app.status}
                            </span>
                          </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openModal(app)}
                            style={{ height: '1.8rem'
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left" /> Prev
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next <i className="fas fa-chevron-right" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {selectedAppointment && (
          <BookingModal
            appointment={selectedAppointment}
            labels={labels}
            onClose={closeModal}
            onAction={handleAction}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>

      <Footer />

      <style jsx>{`
        .page { max-width: 1000px; margin: 0 auto; width: 100%; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-card { background: #fff; border-radius: 12px; border: 1px solid #ebebeb; padding: 1.2rem; }
        .stat-number { font-size: 2rem; font-weight: 800; color: var(--sap-primary, #0a6ed1); margin-bottom: 0.2rem; }
        .stat-label { font-size: 0.8rem; color: #888; font-weight: 500; }

        .filters {
          display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .search-bar { display: flex; gap: 0.25rem; }
        .search-bar input {
          padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem;
          width: 220px;
        }
        .search-bar button {
          background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 6px; padding: 0.5rem;
          cursor: pointer;
        }
        .status-filter { display: flex; align-items: center; gap: 0.5rem; }
        .status-filter label { font-size: 0.75rem; font-weight: 600; color: #666; }
        .status-filter select {
          padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem;
        }

        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .card-header { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
        .card-header i { color: var(--sap-primary, #0a6ed1); }
        .card-header h3 { margin: 0; font-size: 0.92rem; font-weight: 700; color: #111; }

        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.75rem 1rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; border-bottom: 1px solid #f0f0f0; background: #fafafa; position: sticky; top: 0; }
        td { padding: 0.6rem 1rem; font-size: 0.84rem; color: #111; border-bottom: 1px solid #f5f5f5; }
        tbody tr:nth-child(even) { background: #fafbfc; }
        tbody tr:hover { background: #f1f5f9; }
        .empty-state { text-align: center; padding: 2rem; color: #888; }

        .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
        .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }
        .btn { display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none; border-radius: 8px; transition: background-color 0.18s ease; }
        .btn-secondary:hover { background: #ebebeb; }

        .pagination {
          display: flex; justify-content: center; align-items: center; gap: 1rem;
          padding: 1rem 1.4rem; border-top: 1px solid #f0f0f0;
        }
        .page-btn {
          background: #f5f5f5; border: 1px solid #e8e8e8; border-radius: 8px;
          padding: 0.4rem 0.8rem; font-size: 0.82rem; font-weight: 600; cursor: pointer;
          color: #555; display: inline-flex; align-items: center; gap: 0.3rem;
          transition: background 150ms ease, transform 160ms ease;
        }
        .page-btn:active { background: #e0e0e0; transform: scale(0.97); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .page-btn:hover:not(:disabled) { background: #e0e0e0; }
        .page-info { font-size: 0.85rem; color: #666; }

        .status-badge {
                    display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
                  }
                  .pending   { background: #fef3c7; color: #92400e; }
                  .confirmed { background: #d1fae5; color: #065f46; }
                  .completed { background: #e0e7ff; color: #3730a3; }
                  .cancelled { background: #fee2e2; color: #991b1b; }
        @media (max-width: 640px) {
          .filters { flex-direction: column; align-items: flex-start; }
          .search-bar input { width: 100%; }
        }
      `}</style>
    </DashboardLayout>
  )
}