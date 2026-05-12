// pages/client/dashboard.tsx
import { withSsrAuth } from '../../lib/withAuth'
import { prisma } from '../../lib/db'
import DashboardLayout from '../../components/DashboardLayout'
import siteConfig from '../../site.json'
import Link from 'next/link'
import Head from 'next/head'
import { formatDate } from '../../lib/formatDate'
import { useState, useEffect } from 'react'
import Footer from '../../components/Footer'

/* ─── Toast ─────────────────────────────────────── */
function Toast({ message, type = 'success', onClose }: {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      <i className={`fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
      <span>{message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        <i className="fas fa-times" />
      </button>
      <style jsx>{`
        .toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 600; display: flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1rem; border-radius: 10px; background: #fff; color: #111; font-size: 0.85rem; font-weight: 500;
          box-shadow: 0 12px 30px rgba(0,0,0,0.1); border: 1px solid #ebebeb; animation: toastIn 0.25s ease;
        }
        .toast--success { border-left: 4px solid #22c55e; }
        .toast--error { border-left: 4px solid #ef4444; }
        .toast button { background: none; border: none; color: #888; cursor: pointer; padding: 0; margin-left: 0.5rem; font-size: 0.9rem; }
        .toast button:hover { color: #111; }
        @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  )
}

/* ─── Service Detail Modal ───────────────────────── */
function ServiceModal({ service, onClose }: { service: any; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{service.name}</h3>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="modal-body">
          {service.imageUrl && (
            <div className="service-image">
              <img src={service.imageUrl} alt={service.name} style={{ width: '100%', borderRadius: '12px' }} />
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Description</span>
            <span className="detail-value pre-wrap">{service.description || 'No description'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Duration</span>
            <span className="detail-value">{service.durationMin} minutes</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Price</span>
            <span className="detail-value">{service.price ? `$${service.price}` : 'Free'}</span>
          </div>
          <div className="modal-footer">
            <button
               type="button"
               className="btn btn-cancel" 
               onClick={onClose}
               aria-label="Cancel"
               style={{ minWidth: '5rem', alignItems: 'center' }}
             >
               Cancel
            </button>
            <p>&nbsp;</p><p>&nbsp;</p>
            <Link href={`/client/book-appointment?service=${service.id}`} className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Book This Service
            </Link>
          </div>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4);
          display: flex; justify-content: center; align-items: center; z-index: 1000;
        }
        .modal-content {
          background: #fff; border-radius: 16px; width: 90%; max-width: 520px; padding: 1.5rem;
          box-shadow: 0 24px 48px rgba(0,0,0,0.1); animation: modalIn 0.2s ease;
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
        .modal-header h3 { margin: 0; font-size: 1.15rem; }
        .modal-close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #888; }
        .modal-body { display: flex; flex-direction: column; gap: 0.75rem; }
        .service-image { margin-bottom: 0.5rem; }
        .detail-row { display: flex; flex-direction: column; gap: 0.2rem; }
        .detail-label { font-size: 0.725rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; }
        .detail-value { font-size: 0.9rem; color: #111; }
        .pre-wrap { white-space: pre-wrap; }
        .modal-footer { margin-top: 1rem; display: flex; justify-content: flex-end; }
        .btn {
          align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem; border-radius: 8px;
          font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none;
          transition: transform 0.16s ease, box-shadow 0.16s ease, background-color 0.18s ease;
        }
        .btn-cancel:hover { background: lightgray; }
        .btn:active { transform: scale(0.97); }
        .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
        .btn-primary:hover { background: #0854a0; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

/* ─── Booking Edit/Cancel Modal ──────────────────── */
function BookingEditModal({
  booking, services, onClose, onSaved, onCancel,
}: {
  booking: any
  services: any[]
  onClose: () => void
  onSaved: (updated: any) => void
  onCancel: (bookingId: number) => void
}) {
  const [editForm, setEditForm] = useState({
    serviceId: booking.serviceId?.toString() || '',
    datetime: booking.datetimeRaw?.slice(0, 16) || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/appointments/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: parseInt(editForm.serviceId),
          datetime: editForm.datetime,
        }),
      })
      if (!res.ok) throw new Error()
      onSaved(await res.json())
    } catch {
      // error handled by parent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Booking <span style={{color:'red'}}>#{booking.id}</span></h3>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>Service</label>
              <select
                value={editForm.serviceId}
                onChange={(e) => setEditForm({ ...editForm, serviceId: e.target.value })}
                required
              >
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date & Time</label>
              <input
                type="datetime-local"
                value={editForm.datetime}
                onChange={(e) => setEditForm({ ...editForm, datetime: e.target.value })}
                required
              />
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (confirm('Request cancellation of this booking?')) {
                    onCancel(booking.id)
                    onClose()
                  }
                }}
              >
                Request Cancellation
              </button>
              <div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ marginLeft: '0.5rem' }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </form>
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
        .modal-body { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
        .form-group label { font-size: 0.75rem; font-weight: 600; color: #666; }
        .form-group input, .form-group select {
          padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.85rem;
        }
        .modal-footer { margin-top: 1rem; display: flex; align-items: center; }
        .btn {
          display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem; border-radius: 8px; height: 1.9rem;
          font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none;
          transition: transform 0.16s ease, background-color 0.18s ease;
        }
        .btn:active { transform: scale(0.97); }
        .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
        .btn-primary:hover { background: #0854a0; }
        .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
        .btn-secondary:hover { background: #ebebeb; }
        .btn-danger { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .btn-danger:hover { background: #fecaca; }
        .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

/* ─── Server Side Props ──────────────────────────── */
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

  // Fetch all published services (or all if no published field)
  const availableServicesRaw = await prisma.service.findMany()

  // Fetch all bookings for the client (for filtering/pagination)
  const allBookingsRaw = await prisma.bookedAppointment.findMany({
    where: { clientId: user.id },
    include: { service: true, employee: true },
    orderBy: { datetime: 'desc' },
  })

  const recentBookings = allBookingsRaw.map((b) => ({
    id: b.id,
    status: b.status,
    serviceId: b.serviceId,
    service: { name: b.service.name },
    employeeName: b.employee?.name || null,
    notes: b.notes,
    datetimeRaw: b.datetime.toISOString(),
    datetimeFormatted: formatDate(b.datetime.toISOString(), 'MMM d, yyyy · h:mm a'),
  }))

  return {
    props: {
      user,
      appointmentsMade,
      lastVisitFormatted,
      availableServices: JSON.parse(JSON.stringify(availableServicesRaw)),
      recentBookings,
      config: siteConfig,
    },
  }
})

/* ─── Main Component ─────────────────────────────── */
export default function ClientDashboard({
  user, appointmentsMade, lastVisitFormatted,
  availableServices, recentBookings, config,
}: any) {
  // ── Service pagination ──
  const SERVICE_PAGE_SIZE = 5
  const [servicePage, setServicePage] = useState(1)
  const serviceTotalPages = Math.ceil(availableServices.length / SERVICE_PAGE_SIZE)
  const pagedServices = availableServices.slice(
    (servicePage - 1) * SERVICE_PAGE_SIZE,
    servicePage * SERVICE_PAGE_SIZE
  )

  // ── Booking filters & pagination ──
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('PENDING') // default pending
  const [bookingPage, setBookingPage] = useState(1)
  const BOOKING_PAGE_SIZE = 5

  // Filter bookings
  const filteredBookings = recentBookings.filter((b: any) => {
    const matchesStatus = !bookingStatusFilter || b.status === bookingStatusFilter
    const query = bookingSearch.trim().toLowerCase()
    const matchesSearch = !query || b.service.name.toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })

  const bookingTotalPages = Math.ceil(filteredBookings.length / BOOKING_PAGE_SIZE)
  const pagedBookings = filteredBookings.slice(
    (bookingPage - 1) * BOOKING_PAGE_SIZE,
    bookingPage * BOOKING_PAGE_SIZE
  )

  // Reset page when filter/search changes
  useEffect(() => {
    setBookingPage(1)
  }, [bookingSearch, bookingStatusFilter])

  // ── Modals ──
  const [selectedService, setSelectedService] = useState<any>(null)
  const [editingBooking, setEditingBooking] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleBookingSave = (updated: any) => {
    // refresh data or update local list? Simpler: reload
    window.location.reload()
  }

  const handleCancelRequest = async (bookingId: number) => {
    try {
      await fetch(`/api/appointments/${bookingId}/cancel`, { method: 'POST' })
      setToast({ message: 'Cancellation requested.', type: 'success' })
      setTimeout(() => window.location.reload(), 2000)
    } catch {
      setToast({ message: 'Failed to request cancellation.', type: 'error' })
    }
  }

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

          {/* Book a Service Table */}
          <div className="card table-card">
            <div className="card-head">
              <i className="fas fa-concierge-bell" />
              <h2>{config.pages.client.dashboard.available_services_heading || 'Book a Service'}</h2>
            </div>
            {availableServices.length === 0 ? (
              <p className="empty-state">No services available.</p>
            ) : (
              <>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Description</th>
                        <th>Duration</th>
                        <th>Price</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedServices.map((s: any) => (
                        <tr key={s.id} style={{ minheight: '48px' }}>
                          <td>{s.name}</td>
                          <td className="desc-cell">
                            <span className="desc-text">
                              {s.description && s.description.length > 40
                                ? s.description.slice(0, 23) + '... '
                                : s.description || '—'}
                            </span>
                            {s.description && s.description.length > 40 && (
                              
                              <button className="see-more" onClick={() => setSelectedService(s)}>
                                 &nbsp;see more
                              </button>
                            )}
                          </td>
                          <td>{s.durationMin} min</td>
                          <td>{s.price ? `$${s.price}` : 'Free'}</td>
                          <td className="actions-cell" style={{ verticalAlign: 'middle'}} >
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedService(s)} style={{ height: '32px' }} >
                              <i className="fas fa-info-circle" /> Details
                            </button>
                            <Link href={`/client/book-appointment?service=${s.id}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none', minWidth: '5.6rem' }}>
                              <i className="fas fa-calendar-plus" 
                              style={{ marginTop: '-2px'}}
                                /> &nbsp;Book
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {serviceTotalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      onClick={() => setServicePage(p => Math.max(1, p - 1))}
                      disabled={servicePage === 1}
                    >
                      <i className="fas fa-chevron-left" /> Prev
                    </button>
                    <span className="page-info">Page {servicePage} of {serviceTotalPages}</span>
                    <button
                      className="page-btn"
                      onClick={() => setServicePage(p => Math.min(serviceTotalPages, p + 1))}
                      disabled={servicePage === serviceTotalPages}
                    >
                      Next <i className="fas fa-chevron-right" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent Bookings Table */}
          <div className="card table-card">
            <div className="card-head">
              <i className="fas fa-history" />
              <h2>{config.pages.client.dashboard.recent_bookings_heading || 'Recent Bookings'}</h2>
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
                        width: '70%',          // Takes full width of its parent
                        minWidth: '200px',      // Never shrinks below 200px
                        boxSizing: 'border-box' // Includes padding in width calculation
                    }}>
                <input
                  type="text"
                  placeholder="Search by service name..."
                    style={{
                        width: '100%',          // Takes full width of its parent
                        minWidth: '200px',      // Never shrinks below 200px
                        boxSizing: 'border-box' // Includes padding in width calculation
                      }}
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                />
                <button onClick={() => setBookingSearch('')}><i className="fas fa-search" /></button>
              </div>
              <div className="status-filter">
                <label>Status</label>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <p className="empty-state">No bookings found.</p>
            ) : (
              <>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedBookings.map((b: any) => (
                        <tr key={b.id}>
                          <td>{b.service.name}</td>
                          <td>{b.datetimeFormatted}</td>
                          <td>
                            <span className={`status-badge ${b.status.toLowerCase()}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingBooking({ ...b, datetimeRaw: b.datetimeRaw })}
                            >
                              <i className="fas fa-edit" /> Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bookingTotalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      onClick={() => setBookingPage(p => Math.max(1, p - 1))}
                      disabled={bookingPage === 1}
                    >
                      <i className="fas fa-chevron-left" /> Prev
                    </button>
                    <span className="page-info">Page {bookingPage} of {bookingTotalPages}</span>
                    <button
                      className="page-btn"
                      onClick={() => setBookingPage(p => Math.min(bookingTotalPages, p + 1))}
                      disabled={bookingPage === bookingTotalPages}
                    >
                      Next <i className="fas fa-chevron-right" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {selectedService && (
          <ServiceModal service={selectedService} onClose={() => setSelectedService(null)} />
        )}
        {editingBooking && (
          <BookingEditModal
            booking={editingBooking}
            services={availableServices}
            onClose={() => setEditingBooking(null)}
            onSaved={handleBookingSave}
            onCancel={handleCancelRequest}
          />
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <Footer />

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

          .desc-cell { max-width: 250px; }
          .desc-text { word-break: break-word; }
          .see-more {
            background: none; border: none; color: var(--sap-primary, #0a6ed1); cursor: pointer;
            font-size: 0.8rem; font-weight: 600; padding: 0; text-decoration: none;
          }

          .actions-cell { display: flex; gap: 0.5rem; align-items: center; }

          .btn {
            display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem; border-radius: 8px;
            font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none;
            transition: transform 0.16s ease, box-shadow 0.16s ease, background-color 0.18s ease;
          }
          .btn:active { transform: scale(0.97); }
          .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
          .btn-primary:hover { background: #0854a0; }
          .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
          .btn-secondary:hover { background: #ebebeb; }
          .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }

          .status-badge {
            display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
          }
          .pending   { background: #fef3c7; color: #92400e; }
          .confirmed { background: #d1fae5; color: #065f46; }
          .completed { background: #e0e7ff; color: #3730a3; }
          .cancelled { background: #fee2e2; color: #991b1b; }

          .filters {
            display: flex; gap: 1rem; align-items: center; padding: 0 1.4rem 0.75rem;
            flex-wrap: wrap;
          }
          .search-bar { display: flex; gap: 0.25rem; }
          .search-bar input {
            padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem;
            width: 200px;
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

          @media (max-width: 640px) {
            .filters { flex-direction: column; align-items: flex-start; }
            .search-bar input { width: 100%; }
          }
        `}</style>
      </DashboardLayout>
    </>
  )
}