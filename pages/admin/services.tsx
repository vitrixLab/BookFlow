// pages/admin/services.tsx
import { withSsrAuth } from '../../lib/withAuth'
import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import siteConfig from '../../site.json'
import Head from 'next/head'
import Footer from '../../components/Footer'

export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user || user.role !== 'ADMIN') {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { props: { user, config: siteConfig } }
})

/* ── Default labels ───────────────────────────── */
const DEFAULT = {
  title: 'Services | Admin',
  heading: 'Services',
  add_heading: 'Add Service',
  edit_heading: 'Edit Service',
  all_services_heading: 'All Services',
  search_placeholder: 'Search by name or description...',
  filter_status_label: 'Status',
  all_statuses: 'All Statuses',
  published: 'Published',
  draft: 'Draft',
  messages: {
    added: 'Service added successfully',
    updated: 'Service updated successfully',
    deleted: 'Service deleted successfully',
  },
  errors: {
    name_required: 'Service name is required',
    add_failed: 'Failed to add service',
    update_failed: 'Failed to update service',
    delete_failed: 'Failed to delete service',
  },
  form: {
    name_label: 'Service Name',
    name_placeholder: 'e.g., 60-min Massage',
    description_label: 'Description',
    description_placeholder: 'Service details',
    duration_label: 'Duration (minutes)',
    price_label: 'Price',
    published_label: 'Published',
    add_button: 'Add Service',
    update_button: 'Update',
    cancel_button: 'Cancel',
  },
  table: {
    id: 'ID',
    name: 'Name',
    duration: 'Duration',
    price: 'Price',
    status: 'Status',
    actions: 'Actions',
    edit_button: 'Edit',
    delete_button: 'Delete',
  },
  delete_confirm: 'Delete this service? All associated appointments will be affected.',
  tips: [
    'Name should be clear, e.g., «60‑min Deep Tissue Massage»',
    'Leave price empty for services not publicly bookable',
    'Duration is required and must be in minutes',
  ],
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

export default function ManageServices({ user, config }: any) {
  const labels = {
    ...DEFAULT,
    ...config?.pages?.admin?.manage_services,
    form: { ...DEFAULT.form, ...config?.pages?.admin?.manage_services?.form },
    table: { ...DEFAULT.table, ...config?.pages?.admin?.manage_services?.table },
    messages: { ...DEFAULT.messages, ...config?.pages?.admin?.manage_services?.messages },
    errors: { ...DEFAULT.errors, ...config?.pages?.admin?.manage_services?.errors },
    tips: config?.pages?.admin?.manage_services?.tips || DEFAULT.tips,
  }

  const [services, setServices] = useState<any[]>([])
  const [addForm, setAddForm] = useState({ name: '', description: '', durationMin: 60, price: '', published: true })
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [editingService, setEditingService] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', durationMin: 60, price: '', published: true })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [tipsOpen, setTipsOpen] = useState(false)

  // ── Filters & Pagination State ──
  const PAGE_SIZE = 10
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('published') // default: published
  const [currentPage, setCurrentPage] = useState(1)

  const fetchServices = async () => {
    const res = await fetch('/api/admin/services')
    const data = await res.json()
    // Ensure each service has a `published` field (default true if missing)
    setServices(data.map((s: any) => ({ ...s, published: s.published ?? true })))
  }

  useEffect(() => { fetchServices() }, [])

  // ── Filtering Logic ──
  const filtered = services.filter((s: any) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && s.published) ||
      (statusFilter === 'draft' && !s.published)

    const query = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !query ||
      s.name.toLowerCase().includes(query) ||
      (s.description || '').toLowerCase().includes(query)

    return matchesStatus && matchesSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE)

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

  // ── Form Handlers (unchanged except fetchServices uses update) ──
  const validateAddName = () => {
    if (!addForm.name.trim()) {
      setAddErrors({ name: labels.errors.name_required })
      return false
    }
    setAddErrors({})
    return true
  }

  const validateEditName = () => {
    if (!editForm.name.trim()) {
      setEditErrors({ name: labels.errors.name_required })
      return false
    }
    setEditErrors({})
    return true
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAddName()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          description: addForm.description,
          durationMin: addForm.durationMin,
          price: addForm.price ? parseFloat(addForm.price) : null,
          published: addForm.published,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || labels.errors.add_failed, type: 'error' })
        return
      }
      setToast({ message: labels.messages.added, type: 'success' })
      setAddForm({ name: '', description: '', durationMin: 60, price: '', published: true })
      fetchServices()
    } catch {
      setToast({ message: labels.errors.add_failed, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (service: any) => {
    setEditingService(service)
    setEditForm({
      name: service.name,
      description: service.description || '',
      durationMin: service.durationMin,
      price: service.price?.toString() || '',
      published: service.published ?? true,
    })
    setEditErrors({})
  }

  const closeEditModal = () => setEditingService(null)

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEditName()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          durationMin: editForm.durationMin,
          price: editForm.price ? parseFloat(editForm.price) : null,
          published: editForm.published,
        }),
      })
      if (!res.ok) throw new Error()
      setToast({ message: labels.messages.updated, type: 'success' })
      closeEditModal()
      fetchServices()
    } catch {
      setToast({ message: labels.errors.update_failed, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async (id: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setToast({ message: labels.messages.deleted, type: 'success' })
      fetchServices()
    } catch {
      setToast({ message: labels.errors.delete_failed, type: 'error' })
    } finally {
      setLoading(false)
      setDeletingId(null)
    }
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
            <button className="tips-toggle" onClick={() => setTipsOpen(!tipsOpen)}>
              <i className="fas fa-lightbulb" />
              <span>{tipsOpen ? 'Hide' : 'Tips'}</span>
            </button>
          </div>

          {tipsOpen && (
            <div className="tips-card card">
              <div className="card-head">
                <i className="fas fa-lightbulb" />
                <h2>Quick Tips</h2>
              </div>
              <ul className="tips-list">
                {labels.tips.map((tip: string, idx: number) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="services-grid">
            {/* Add Service Card */}
            <div className="card add-service-card">
              <div className="card-head">
                <i className="fas fa-plus-circle" />
                <h2>{labels.add_heading}</h2>
              </div>
              <form onSubmit={handleAddSubmit} className="compact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>{labels.form.name_label}</label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) => {
                        setAddForm({ ...addForm, name: e.target.value })
                        if (addErrors.name && e.target.value.trim()) setAddErrors({})
                      }}
                      onBlur={validateAddName}
                      required
                      placeholder={labels.form.name_placeholder}
                      className={addErrors.name ? 'error' : ''}
                    />
                    {addErrors.name && <span className="field-hint">{addErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label>{labels.form.duration_label}</label>
                    <input
                      type="number"
                      value={addForm.durationMin}
                      onChange={(e) => setAddForm({ ...addForm, durationMin: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{labels.form.description_label}</label>
                    <textarea
                      value={addForm.description}
                      onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                      rows={2}
                      placeholder={labels.form.description_placeholder}
                    />
                  </div>
                  <div className="form-group">
                    <label>{labels.form.price_label}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={addForm.price}
                      onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{labels.form.published_label}</label>
                    <div style={{ paddingTop: '0.5rem' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={addForm.published}
                          onChange={(e) => setAddForm({ ...addForm, published: e.target.checked })}
                        />
                        Published
                      </label>
                    </div>
                  </div>
                  <div className="form-actions" style={{ marginTop: 'auto', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {labels.form.add_button}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Catalog Stats Card (light) */}
            <div className="card stats-card" style={{ minWidth: '240px' }}>
              <div className="card-head" style={{ marginTop: '-12px' }}>
                <span className="card-title">Catalog</span>
                <span className="badge">{services.length} services</span>
              </div>
              <div className="stat-block" style={{ marginTop: '-12px' }}>
                <span className="stat-number">{services.length}</span>
                <span className="stat-label">services published</span>
              </div>
              <div className="stat-list" 
                style={{ 
                    borderTop: '1px solid #e0e0e0', 
                    borderBottom: '1px solid #e0e0e0'
              }}>
                    <p style={{ fontSize: '0.1rem' }}>&nbsp;</p>
                {services.slice(0, 5).map((s) => (
                  <div key={s.id} className="stat-row">
                    <span className="stat-name">{s.name}</span>
                    <span className="stat-dur">{s.durationMin} min</span>
                  </div>
                ))}  
                {services.length > 5 && (
                  <div className="stat-row muted">+ {services.length - 5} more</div>
                )}
              </div>
              <p style={{ fontSize: '0.6rem' }}>&nbsp;</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder={labels.search_placeholder || 'Search by name or description...'}
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
                <option value="published">{labels.published || 'Published'}</option>
                <option value="draft">{labels.draft || 'Draft'}</option>
              </select>
            </div>
          </div>

          {/* All Services Table */}
          <div className="card table-card">
            <div className="card-head">
              <i className="fas fa-list" />
              <h2>{labels.all_services_heading}</h2>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{labels.table.id}</th>
                    <th>{labels.table.name}</th>
                    <th>{labels.table.duration}</th>
                    <th>{labels.table.price}</th>
                    <th>{labels.table.status}</th>
                    <th>{labels.table.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((s: any) => (
                    <tr key={s.id} className={deletingId === s.id ? 'row--deleting' : ''}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                      <td>{s.durationMin} min</td>
                      <td>{s.price ? `$${s.price}` : '-'}</td>
                      <td>
                        <span className={`status-badge ${s.published ? 'badge--published' : 'badge--draft'}`}>
                          {s.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button className="btn-icon" onClick={() => openEditModal(s)} aria-label="Edit" title="Edit">
                          <i className="fas fa-pen" />
                        </button>
                        {deletingId !== s.id ? (
                          <button className="btn-icon btn-icon--danger" onClick={() => setDeletingId(s.id)} aria-label="Delete" title="Delete">
                            <i className="fas fa-trash" />
                          </button>
                        ) : (
                          <div className="delete-pill">
                            <span>{labels.delete_confirm}</span>
                            <button className="pill-confirm" onClick={() => confirmDelete(s.id)} disabled={loading}>Yes</button>
                            <button className="pill-cancel" onClick={() => setDeletingId(null)}>No</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                        No services found.
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

        {/* Edit Modal */}
        {editingService && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{labels.edit_heading}</h2>
                <button className="modal-close" onClick={closeEditModal} aria-label="Close">
                  <i className="fas fa-times" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>{labels.form.name_label}</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => {
                        setEditForm({ ...editForm, name: e.target.value })
                        if (editErrors.name && e.target.value.trim()) setEditErrors({})
                      }}
                      onBlur={validateEditName}
                      required
                      className={editErrors.name ? 'error' : ''}
                    />
                    {editErrors.name && <span className="field-hint">{editErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label>{labels.form.description_label}</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="form-group">
                    <label>{labels.form.duration_label}</label>
                    <input
                      type="number"
                      value={editForm.durationMin}
                      onChange={(e) => setEditForm({ ...editForm, durationMin: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{labels.form.price_label}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{labels.form.published_label}</label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={editForm.published}
                        onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })}
                      />
                      Published
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                    {labels.form.update_button}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={closeEditModal}>
                    {labels.form.cancel_button}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <Footer />
        
        <style jsx>{`
          .page { max-width: 1200px; margin: 0 auto; width: 100%; }
          .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem; flex-wrap: wrap; }
          .page-title { font-size: 1.75rem; font-weight: 800; color: #111; letter-spacing: -0.03em; margin: 0; }
          .tips-toggle { background: none; border: none; color: #888; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
          .tips-toggle:hover { color: #111; }

          .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; margin-bottom: 1.25rem; }
          .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
          .card-head i { font-size: 1.1rem; color: var(--sap-primary, #0a6ed1); }
          .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }
          .card-title { font-size: .92rem; font-weight: 700; color: #111; }

          .compact-form { padding: 0 1.4rem 1.25rem; }
          .form-row { display: flex; gap: 1rem; }
          .form-group { flex: 1; margin-bottom: 1rem; }
          .form-group label { font-size: 0.75rem; font-weight: 600; color: #666; margin-bottom: 0.3rem; display: block; }
          .form-group input,
          .form-group textarea {
            width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;
            font-size: 0.85rem; color: #111; transition: border-color 0.15s, box-shadow 0.15s;
          }
          .form-group input:focus,
          .form-group textarea:focus { border-color: var(--sap-primary, #0a6ed1); box-shadow: 0 0 0 3px rgba(10,110,209,0.15); outline: none; }
          .form-group input.error { border-color: #ef4444; }
          .field-hint { display: block; margin-top: 0.2rem; font-size: 0.72rem; color: #ef4444; }
          .form-actions { display: flex; justify-content: flex-end; }

          .btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; transition: background 0.2s, opacity 0.2s; }
          .btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
          .btn-primary:hover:not(:disabled) { background: #0854a0; }
          .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
          .btn-secondary:hover:not(:disabled) { background: #ebebeb; }
          .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }

          .tips-card { background: #f8fafd; }
          .tips-list { list-style: none; padding: 0 1.4rem 1rem; margin: 0; }
          .tips-list li { padding: 0.4rem 0; font-size: 0.82rem; color: #555; line-height: 1.4; }
          .tips-list li::before { content: '• '; color: var(--sap-primary, #0a6ed1); font-weight: bold; margin-right: 0.3rem; }

          .services-grid { display: grid; grid-template-columns: 3fr 1fr; gap: 1.25rem; align-items: start; margin-bottom: 1.25rem; }
          .stats-card { background: #f8fafd; }
          .stat-block { padding: 0.5rem 1.4rem 1rem; }
          .stat-number { font-family: 'Fraunces', Georgia, serif; font-size: 3rem; font-weight: 800; color: #111; letter-spacing: -0.04em; line-height: 1; display: block; }
          .stat-label { font-size: 0.68rem; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
          .stat-list { padding: 0 1.4rem 1rem; display: flex; flex-direction: column; gap: 0.4rem; overflow-y: auto; height: 165px; background: #f8fafd; }
          .stat-row { display: flex; justify-content: space-between; font-size: 0.78rem; color: #555; padding-bottom: 0.35rem; border-bottom: 1px solid #f0f0f0; }
          .stat-row:last-child { border-bottom: none; }
          .stat-row.muted { color: #888; font-style: italic; }
          .stat-dur { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.72rem; color: #888; }

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
          .btn-icon--danger:hover { color: #ef4444; background: #fee2e2; }
          .delete-pill { display: flex; align-items: center; gap: 0.4rem; background: #fee2e2; padding: 0.35rem 0.6rem; border-radius: 8px; font-size: 0.78rem; color: #dc2626; }
          .pill-confirm, .pill-cancel { background: none; border: none; font-size: 0.75rem; font-weight: 600; cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px; }
          .pill-confirm { color: #fff; background: #ef4444; }
          .pill-confirm:hover { background: #dc2626; }
          .pill-cancel { color: #dc2626; }
          .pill-cancel:hover { text-decoration: underline; }

          /* Status badges */
          .status-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; }
          .badge--published { background: #d1fae5; color: #065f46; }
          .badge--draft { background: #fef3c7; color: #92400e; }

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

          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 1rem; animation: overlayIn 0.15s ease; }
          @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
          .modal { background: #fff; border-radius: 16px; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); animation: modalScale 0.2s ease; }
          @keyframes modalScale { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f0f0; }
          .modal-header h2 { font-size: 1rem; font-weight: 700; color: #111; margin: 0; }
          .modal-close { background: none; border: none; font-size: 1rem; color: #aaa; cursor: pointer; padding: 0.3rem; border-radius: 6px; transition: background 0.15s, color 0.15s; }
          .modal-close:hover { background: #f5f5f5; color: #111; }
          .modal-body { padding: 1rem 1.5rem; }
          .modal-footer { display: flex; gap: 0.5rem; justify-content: flex-end; padding: 0.75rem 1.5rem 1.25rem; }

          .badge { font-size: 0.72rem; font-weight: 600; color: #0a6ed1; background: rgba(10,110,209,0.08); padding: 0.2rem 0.6rem; border-radius: 20px; }

          @media (max-width: 768px) {
            .services-grid { grid-template-columns: 1fr; }
            .form-row { flex-direction: column; gap: 0; }
            .filters { flex-direction: column; align-items: stretch; }
            .search-bar { min-width: unset; }
            .status-filter { align-self: flex-start; }
            .table-wrapper { padding: 0 0.5rem; }
          }
        `}</style>
      </DashboardLayout>
    </>
  )
}