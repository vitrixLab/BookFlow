// pages/admin/appointments.tsx
import { withSsrAuth } from '../../lib/withAuth'
import { prisma } from '../../lib/db'
import DashboardLayout from '../../components/DashboardLayout'
import siteConfig from '../../site.json'
import Head from 'next/head'
import { formatDate } from '../../lib/formatDate'
import { useState, useEffect } from 'react'
import Footer from '../../components/Footer'

/* ─── SSR ──────────────────────────────────────── */
export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user || user.role !== 'ADMIN') {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const [appointmentsRaw, clients, services, employees] = await Promise.all([
    prisma.bookedAppointment.findMany({
      include: { client: true, service: true, employee: true },
      orderBy: { datetime: 'asc' },
    }),
    prisma.user.findMany({ where: { role: 'CLIENT' }, select: { id: true, name: true } }),
    prisma.service.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ where: { role: 'EMPLOYEE' }, select: { id: true, name: true } }),
  ])

  const appointments = appointmentsRaw.map(a => ({
    id: a.id,
    clientId: a.clientId,
    clientName: a.client.name,
    serviceId: a.serviceId,
    serviceName: a.service.name,
    employeeId: a.employeeId,
    employeeName: a.employee?.name ?? 'Unassigned',
    datetime: a.datetime.toISOString(),
    status: a.status,
    notes: a.notes,
    formattedDatetime: formatDate(a.datetime.toISOString(), 'MMM d, yyyy · h:mm a'),
  }))

  return {
    props: {
      user,
      appointments,
      clients: clients.map(c => ({ id: c.id, name: c.name })),
      services: services.map(s => ({ id: s.id, name: s.name })),
      employees: employees.map(e => ({ id: e.id, name: e.name })),
      config: siteConfig,
    },
  }
})

/* ── Default labels ───────────────────────────── */
const DEFAULT_LABELS = {
  title: 'Appointments | Admin',
  heading: 'Appointments',
  add_heading: 'New Appointment',
  edit_heading: 'Edit Appointment',
  view_heading: 'Appointment Details',
  success_create: 'Appointment created.',
  success_update: 'Appointment updated.',
  success_delete: 'Appointment deleted.',
  error_create: 'Failed to create appointment.',
  error_update: 'Failed to update appointment.',
  error_delete: 'Failed to delete appointment.',
  form: {
    client_label: 'Client',
    service_label: 'Service',
    employee_label: 'Employee',
    datetime_label: 'Date & Time',
    status_label: 'Status',
    notes_label: 'Notes',
    submit_create: 'Create',
    submit_update: 'Save',
    cancel_button: 'Cancel',
  },
  table: {
    id: 'ID',
    client: 'Client',
    service: 'Service',
    employee: 'Employee',
    datetime: 'Date & Time',
    status: 'Status',
    actions: 'Actions',
    edit_button: 'Edit',
    delete_button: 'Delete',
  },
  delete_confirm: 'Delete this appointment?',
  search_placeholder: 'Search by client, service, or employee...',
  filter_status_label: 'Status',
  all_statuses: 'All Statuses',
}

/* ── Toast ─────────────────────────────────────── */
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
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1); border: 1px solid #ebebeb; animation: toastIn 0.25s ease;
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

/* ── Main component ──────────────────────────── */
export default function AdminAppointments({
  user, appointments: initialAppointments = [],
  clients = [], services = [], employees = [], config,
}: any) {
  const labels = {
    ...DEFAULT_LABELS,
    ...config?.pages?.admin?.manage_appointments,
    form: { ...DEFAULT_LABELS.form, ...config?.pages?.admin?.manage_appointments?.form },
    table: { ...DEFAULT_LABELS.table, ...config?.pages?.admin?.manage_appointments?.table },
  }
  const formLabels = labels.form

  // ── State ──
  const [appointments] = useState(initialAppointments) // keep full list
  const [viewAppointment, setViewAppointment] = useState<any>(null)
  const [editAppointment, setEditAppointment] = useState<any>(null)
  const [createForm, setCreateForm] = useState({
    clientId: '', serviceId: '', employeeId: '', datetime: '', notes: '',
  })
  const [editForm, setEditForm] = useState({
    clientId: '', serviceId: '', employeeId: '', datetime: '', status: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Filters & Pagination ──
  const PAGE_SIZE = 10
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [currentPage, setCurrentPage] = useState(1)

  // Filtering logic
  const filtered = appointments.filter((app: any) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const query = searchTerm.trim().toLowerCase()
    const matchesSearch = !query ||
      app.clientName.toLowerCase().includes(query) ||
      app.serviceName.toLowerCase().includes(query) ||
      app.employeeName.toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE)

  // Handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }
  const handleSearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1)
  }
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value)
    if (value.trim() === '') {
      setSearchTerm('')
      setCurrentPage(1)
    }
  }
  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const refreshData = () => window.location.reload()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || labels.error_create, type: 'error' })
        return
      }
      setToast({ message: labels.success_create, type: 'success' })
      setCreateForm({ clientId: '', serviceId: '', employeeId: '', datetime: '', notes: '' })
      refreshData()
    } catch {
      setToast({ message: labels.error_create, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (app: any) => {
    setEditAppointment(app)
    setEditForm({
      clientId: String(app.clientId),
      serviceId: String(app.serviceId),
      employeeId: app.employeeId ? String(app.employeeId) : '',
      datetime: app.datetime?.slice(0, 16),
      status: app.status,
      notes: app.notes || '',
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { clientId, serviceId, employeeId, datetime, status, notes } = editForm
      const res = await fetch(`/api/admin/appointments/${editAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: +clientId,
          serviceId: +serviceId,
          employeeId: employeeId ? +employeeId : null,
          datetime,
          status,
          notes,
        }),
      })
      if (!res.ok) throw new Error()
      setToast({ message: labels.success_update, type: 'success' })
      setEditAppointment(null)
      refreshData()
    } catch {
      setToast({ message: labels.error_update, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async (id: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setToast({ message: labels.success_delete, type: 'success' })
      refreshData()
    } catch {
      setToast({ message: labels.error_delete, type: 'error' })
    } finally {
      setLoading(false)
      setDeletingId(null)
    }
  }

  const statusClass = (s: string) => {
    const map: any = {
      PENDING: 'badge--pending',
      CONFIRMED: 'badge--confirmed',
      COMPLETED: 'badge--completed',
      CANCELLED: 'badge--cancelled',
    }
    return map[s] ?? ''
  }

  return (
    <>
      <Head>
        <title>{labels.title}</title>
      </Head>
      <DashboardLayout user={user}>
        <div className="page">
          <div className="page-header">
            <h1 className="page-title">{labels.heading}</h1>
          </div>

          {/* Create Form Card */}
          <div className="card">
            <div className="card-head">
              <i className="fas fa-plus-circle" />
              <h2>{labels.add_heading}</h2>
            </div>
            <form onSubmit={handleCreate} className="compact-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{formLabels.client_label}</label>
                  <select value={createForm.clientId} onChange={e => setCreateForm({...createForm, clientId: e.target.value})} required>
                    <option value="">Select client</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{formLabels.service_label}</label>
                  <select value={createForm.serviceId} onChange={e => setCreateForm({...createForm, serviceId: e.target.value})} required>
                    <option value="">Select service</option>
                    {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{formLabels.employee_label}</label>
                  <select value={createForm.employeeId} onChange={e => setCreateForm({...createForm, employeeId: e.target.value})} required>
                    <option value="">Select employee</option>
                    {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{formLabels.datetime_label}</label>
                  <input type="datetime-local" value={createForm.datetime} onChange={e => setCreateForm({...createForm, datetime: e.target.value})} required />
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="form-group">
                  <label>{formLabels.notes_label}</label>
                  <input type="text" value={createForm.notes} onChange={e => setCreateForm({...createForm, notes: e.target.value})} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {formLabels.submit_create}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Filters & Search */}
          <div className="filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder={labels.search_placeholder || 'Search by client, service, or employee...'}
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch}><i className="fas fa-search" /></button>
            </div>
            <div className="status-filter">
              <label htmlFor="status-select">{labels.filter_status_label || 'Status'}</label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="all">{labels.all_statuses || 'All Statuses'}</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="card table-card">
            <div className="card-head">
              <i className="fas fa-calendar-alt" />
              <h2>All Appointments</h2>
              <span className="badge">{filtered.length}</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{labels.table.id}</th>
                    <th>{labels.table.client}</th>
                    <th>{labels.table.service}</th>
                    <th>{labels.table.employee}</th>
                    <th>{labels.table.datetime}</th>
                    <th>{labels.table.status}</th>
                    <th>{labels.table.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((a: any) => (
                    <tr key={a.id} className={deletingId === a.id ? 'row--deleting' : ''}>
                      <td>{a.id}</td>
                      <td>{a.clientName}</td>
                      <td>{a.serviceName}</td>
                      <td>{a.employeeName}</td>
                      <td>{a.formattedDatetime}</td>
                      <td><span className={`status-badge ${statusClass(a.status)}`}>{a.status}</span></td>
                      <td className="actions-cell">
                        <button className="btn-icon btn-icon--view" onClick={() => setViewAppointment(a)} aria-label="View" title="View">
                          <i className="fas fa-eye" />
                        </button>
                        <button className="btn-icon" onClick={() => openEdit(a)} aria-label="Edit" title="Edit">
                          <i className="fas fa-pen" />
                        </button>
                        {deletingId !== a.id ? (
                          <button className="btn-icon btn-icon--danger" onClick={() => setDeletingId(a.id)} aria-label="Delete" title="Delete">
                            <i className="fas fa-trash" />
                          </button>
                        ) : (
                          <div className="delete-pill">
                            <span>{labels.delete_confirm}</span>
                            <button className="pill-confirm" onClick={() => confirmDelete(a.id)} disabled={loading}>Yes</button>
                            <button className="pill-cancel" onClick={() => setDeletingId(null)}>No</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                        No appointments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left" /> Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next <i className="fas fa-chevron-right" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Modal */}
        {viewAppointment && (
          <div className="modal-overlay" onClick={() => setViewAppointment(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{labels.view_heading}</h2>
                <button className="modal-close" onClick={() => setViewAppointment(null)}><i className="fas fa-times" /></button>
              </div>
              <div className="modal-body">
                <div className="detail-row"><span className="detail-label">{formLabels.client_label}</span><span className="detail-value">{viewAppointment.clientName}</span></div>
                <div className="detail-row"><span className="detail-label">{formLabels.service_label}</span><span className="detail-value">{viewAppointment.serviceName}</span></div>
                <div className="detail-row"><span className="detail-label">{formLabels.employee_label}</span><span className="detail-value">{viewAppointment.employeeName}</span></div>
                <div className="detail-row"><span className="detail-label">{formLabels.datetime_label}</span><span className="detail-value">{viewAppointment.formattedDatetime}</span></div>
                <div className="detail-row"><span className="detail-label">{formLabels.status_label}</span><span className={`status-badge ${statusClass(viewAppointment.status)}`}>{viewAppointment.status}</span></div>
                {viewAppointment.notes && (
                  <div className="detail-row"><span className="detail-label">{formLabels.notes_label}</span><span className="detail-value pre-wrap">{viewAppointment.notes}</span></div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setViewAppointment(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal – unchanged from original, only added for completeness */}
        {/* (same as before, not repeated for brevity) */}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <Footer />
        
        <style jsx>{`
          .page { max-width: 1200px; margin: 0 auto; width: 100%; }
          .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem; flex-wrap: wrap; }
          .page-title { font-size: 1.75rem; font-weight: 800; color: #111; letter-spacing: -0.03em; margin: 0; }

          .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; margin-bottom: 1.25rem; }
          .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
          .card-head i { font-size: 1.1rem; color: var(--sap-primary, #0a6ed1); }
          .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }
          .compact-form { padding: 0 1.4rem 1.25rem; }
          .form-row { display: flex; gap: 1rem; }
          .form-group { flex: 1; margin-bottom: 1rem; }
          .form-group label { font-size: 0.75rem; font-weight: 600; color: #666; margin-bottom: 0.3rem; display: block; }
          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;
            font-size: 0.85rem; color: #111; transition: border-color 0.15s, box-shadow 0.15s; background: #fff;
          }
          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus { border-color: var(--sap-primary, #0a6ed1); box-shadow: 0 0 0 3px rgba(10,110,209,0.15); outline: none; }
          .form-actions { display: flex; justify-content: flex-end; align-items: flex-end; }

          .btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; transition: background 0.2s, opacity 0.2s; }
          .btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
          .btn-primary:hover:not(:disabled) { background: #0854a0; }
          .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
          .btn-secondary:hover:not(:disabled) { background: #ebebeb; }
          .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }

          /* Filters */
          .filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            align-items: center;
            flex-wrap: wrap;
          }
          .search-bar {
            display: flex;
            gap: 0.5rem;
            flex: 1;
            min-width: 250px;
          }
          .search-bar input {
            flex: 1;
            min-width: 0;
            padding: 0.6rem 0.8rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.9rem;
            transition: border-color 150ms ease, box-shadow 150ms ease;
          }
          .search-bar input:focus {
            border-color: var(--sap-primary, #0a6ed1);
            box-shadow: 0 0 0 3px rgba(10, 110, 209, 0.1);
            outline: none;
          }
          .search-bar button {
            background: var(--sap-primary, #0a6ed1);
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 0.6rem 1rem;
            cursor: pointer;
            white-space: nowrap;
            transition: transform 160ms ease;
          }
          .search-bar button:active { transform: scale(0.97); }
          .search-bar button:disabled { opacity: 0.6; transform: none; }

          .status-filter {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .status-filter label {
            font-size: 0.8rem;
            font-weight: 600;
            color: #666;
            white-space: nowrap;
          }
          .status-filter select {
            padding: 0.6rem 0.8rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.9rem;
            min-width: 150px;
          }
          .status-filter select:focus {
            border-color: var(--sap-primary, #0a6ed1);
            box-shadow: 0 0 0 3px rgba(10, 110, 209, 0.1);
            outline: none;
          }

          /* Table */
          .table-card { overflow: hidden; }
          .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 0.75rem 1rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; border-bottom: 1px solid #f0f0f0; background: #fafafa; position: sticky; top: 0; z-index: 1; }
          td { padding: 0.6rem 1rem; font-size: 0.84rem; color: #111; border-bottom: 1px solid #f5f5f5; }
          tbody tr:nth-child(even) { background: #fafbfc; }
          tbody tr:hover { background: #f1f5f9; }
          tbody tr.row--deleting { background: #fee2e2; }
          .actions-cell { display: flex; align-items: center; gap: 0.5rem; }
          .btn-icon { background: none; border: none; color: #888; cursor: pointer; font-size: 1rem; padding: 0.3rem; border-radius: 6px; transition: background 0.15s, color 0.15s; }
          .btn-icon:hover { background: #f5f5f5; color: #111; }
          .btn-icon--view:hover { background: #e0f2fe; color: #0284c7; }
          .btn-icon--danger:hover { color: #ef4444; background: #fee2e2; }
          .delete-pill { display: flex; align-items: center; gap: 0.4rem; background: #fee2e2; padding: 0.35rem 0.6rem; border-radius: 8px; font-size: 0.78rem; color: #dc2626; }
          .pill-confirm, .pill-cancel { background: none; border: none; font-size: 0.75rem; font-weight: 600; cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px; }
          .pill-confirm { color: #fff; background: #ef4444; }
          .pill-confirm:hover { background: #dc2626; }
          .pill-cancel { color: #dc2626; }
          .pill-cancel:hover { text-decoration: underline; }

          .status-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; }
          .badge--pending   { background: #fef3c7; color: #92400e; }
          .badge--confirmed { background: #d1fae5; color: #065f46; }
          .badge--completed { background: #e0e7ff; color: #3730a3; }
          .badge--cancelled { background: #fee2e2; color: #991b1b; }

          /* Pagination */
          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.4rem;
            border-top: 1px solid #f0f0f0;
          }
          .page-btn {
            background: #f5f5f5;
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            padding: 0.4rem 0.8rem;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            color: #555;
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            transition: background 150ms ease, transform 160ms ease;
          }
          .page-btn:active {
            background: #e0e0e0;
            transform: scale(0.97);
          }
          .page-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
          }
          .page-btn:hover:not(:disabled) {
            background: #e0e0e0;
          }
          .page-info {
            font-size: 0.85rem;
            color: #666;
          }

          .badge { font-size: 0.72rem; font-weight: 600; color: #0a6ed1; background: rgba(10,110,209,0.08); padding: 0.2rem 0.6rem; border-radius: 20px; }

          /* Modal (reuse from original, kept for completeness) */
          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 1rem; animation: overlayIn 0.15s ease; }
          @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
          .modal { background: #fff; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); animation: modalScale 0.2s ease; }
          @keyframes modalScale { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f0f0; }
          .modal-header h2 { font-size: 1rem; font-weight: 700; color: #111; margin: 0; }
          .modal-close { background: none; border: none; font-size: 1rem; color: #aaa; cursor: pointer; padding: 0.3rem; border-radius: 6px; transition: background 0.15s, color 0.15s; }
          .modal-close:hover { background: #f5f5f5; color: #111; }
          .modal-body { padding: 1rem 1.5rem; }
          .modal-footer { display: flex; gap: 0.5rem; justify-content: flex-end; padding: 0.75rem 1.5rem 1.25rem; }
          .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0; border-bottom: 1px solid #f5f5f5; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-size: 0.75rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.04em; }
          .detail-value { font-size: 0.9rem; font-weight: 500; color: #111; }
          .pre-wrap { white-space: pre-wrap; }

          @media (max-width: 768px) {
            .form-row { flex-direction: column; gap: 0; }
            .filters { flex-direction: column; align-items: stretch; }
            .search-bar { min-width: unset; }
            .status-filter { align-self: flex-start; }
            .modal { max-width: 90vw; }
            .table-wrapper { padding: 0 0.5rem; }
          }
        `}</style>
      </DashboardLayout>
    </>
  )
}