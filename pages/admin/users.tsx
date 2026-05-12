// pages/admin/users.tsx
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
  return { props: { user, config: siteConfig, isSuperAdmin: user.isSuperAdmin ?? false } }
})

/* ── Default labels ───────────────────────────── */
const DEFAULT = {
  title: 'Manage Users | Admin',
  heading: 'Team & Clients',
  add_heading: 'Add New User',
  edit_heading: 'Edit User',
  all_users_heading: 'All Users',
  search_placeholder: 'Search by name or email...',
  filter_role_label: 'Role',
  all_roles: 'All Roles',
  messages: {
    added: 'User added successfully.',
    updated: 'User updated successfully.',
    deleted: 'User deleted successfully.',
  },
  errors: {
    name_required: 'Name is required.',
    add_failed: 'Failed to add user.',
    update_failed: 'Failed to update user.',
    delete_failed: 'Failed to delete user.',
  },
  form: {
    name_label: 'Full Name',
    name_placeholder: 'e.g., Jane Smith',
    email_label: 'Email',
    email_placeholder: 'client@example.com',
    password_label: 'Password',
    password_placeholder: 'Min 6 characters',
    role_label: 'Role',
    phone_label: 'Phone (for SMS)',
    phone_placeholder: '+63 XXX XXX XXXX',
    add_button: 'Add User',
    update_button: 'Update',
    cancel_button: 'Cancel',
  },
  table: {
    id: 'ID',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    phone: 'Phone',
    joined: 'Joined',
    actions: 'Actions',
    edit_button: 'Edit',
    delete_button: 'Delete',
  },
  delete_confirm: 'Delete this user? This action cannot be undone.',
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

export default function ManageUsers({ user, config, isSuperAdmin }: any) {
  const T = config?.pages?.admin?.manage_users
  const labels = {
    ...DEFAULT,
    ...T,
    form: { ...DEFAULT.form, ...T?.form },
    table: { ...DEFAULT.table, ...T?.table },
  }

  const [users, setUsers] = useState<any[]>([])
  const [addForm, setAddForm] = useState({
    name: '', email: '', password: '', role: 'CLIENT', phone: '',
  })
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    name: '', email: '', password: '', role: 'CLIENT', phone: '',
  })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Filters & Pagination State ──
  const PAGE_SIZE = 10
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data)
  }

  useEffect(() => { fetchUsers() }, [])

  // ── Filtering Logic ──
  const filtered = users.filter((u: any) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const query = searchTerm.trim().toLowerCase()
    const matchesSearch = !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    return matchesRole && matchesSearch
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

  const handleRoleChange = (value: string) => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  // ── Form Handlers ──
  const validateAddForm = () => {
    const errs: Record<string, string> = {}
    if (!addForm.name.trim()) errs.name = labels.errors.name_required
    if (!addForm.email.trim()) errs.email = 'Email is required.'
    if (!addForm.password.trim()) errs.password = 'Password is required.'
    setAddErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAddForm()) return
    setLoading(true)
    try {
      // Include the current admin's ID as approvedBy
      const payload = {
        ...addForm,
        approvedBy: user.id,
      }
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || labels.errors.add_failed, type: 'error' })
        return
      }
      setToast({ message: labels.messages.added, type: 'success' })
      setAddForm({ name: '', email: '', password: '', role: 'CLIENT', phone: '' })
      fetchUsers()
    } catch {
      setToast({ message: labels.errors.add_failed, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (u: any) => {
    setEditingUser(u)
    setEditForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      phone: u.phone || '',
    })
    setEditErrors({})
  }

  const closeEditModal = () => setEditingUser(null)

  const validateEditForm = () => {
    const errs: Record<string, string> = {}
    if (!editForm.name.trim()) errs.name = labels.errors.name_required
    if (!editForm.email.trim()) errs.email = 'Email is required.'
    setEditErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEditForm()) return
    setLoading(true)
    try {
      const payload: any = { ...editForm }
      if (payload.password === '') delete payload.password
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || labels.errors.update_failed, type: 'error' })
        return
      }
      setToast({ message: labels.messages.updated, type: 'success' })
      closeEditModal()
      fetchUsers()
    } catch {
      setToast({ message: labels.errors.update_failed, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async (id: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || labels.errors.delete_failed, type: 'error' })
        return
      }
      setToast({ message: labels.messages.deleted, type: 'success' })
      fetchUsers()
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
          </div>

          {/* Add User Card */}
          <div className="card">
            <div className="card-head">
              <i className="fas fa-user-plus" />
              <h2>{labels.add_heading}</h2>
            </div>
            <form onSubmit={handleAddSubmit} className="compact-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{labels.form.name_label}</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={e => { setAddForm({ ...addForm, name: e.target.value }); if (addErrors.name) setAddErrors({}) }}
                    placeholder={labels.form.name_placeholder}
                    className={addErrors.name ? 'error' : ''}
                    required
                  />
                  {addErrors.name && <span className="field-hint">{addErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label>{labels.form.email_label}</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={e => { setAddForm({ ...addForm, email: e.target.value }); if (addErrors.email) setAddErrors({}) }}
                    placeholder={labels.form.email_placeholder}
                    className={addErrors.email ? 'error' : ''}
                    required
                  />
                  {addErrors.email && <span className="field-hint">{addErrors.email}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{labels.form.password_label}</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={e => { setAddForm({ ...addForm, password: e.target.value }); if (addErrors.password) setAddErrors({}) }}
                    placeholder={labels.form.password_placeholder}
                    minLength={6}
                    className={addErrors.password ? 'error' : ''}
                    required
                  />
                  {addErrors.password && <span className="field-hint">{addErrors.password}</span>}
                </div>
                <div className="form-group">
                  <label>{labels.form.role_label}</label>
                  <select
                    value={addForm.role}
                    onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                    required
                  >
                    {isSuperAdmin && <option value="ADMIN">Admin</option>}
                    <option value="EMPLOYEE">Employee</option>
                    <option value="CLIENT">Client</option>
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="form-group">
                  <label>{labels.form.phone_label}</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder={labels.form.phone_placeholder}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {labels.form.add_button}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Filters Bar */}
          <div className="filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder={labels.search_placeholder || 'Search by name or email...'}
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch}><i className="fas fa-search" /></button>
            </div>
            <div className="role-filter">
              <label htmlFor="role-select">{labels.filter_role_label || 'Role'}</label>
              <select
                id="role-select"
                value={roleFilter}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="all">{labels.all_roles || 'All Roles'}</option>
                <option value="ADMIN">Admin</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="card table-card">
            <div className="card-head">
              <i className="fas fa-users" />
              <h2>{labels.all_users_heading}</h2>
              <span className="badge">{filtered.length}</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{labels.table.id}</th>
                    <th>{labels.table.name}</th>
                    <th>{labels.table.email}</th>
                    <th>{labels.table.role}</th>
                    <th>{labels.table.phone || 'Phone'}</th>
                    <th>{labels.table.joined}</th>
                    <th>{labels.table.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((u: any) => (
                    <tr key={u.id} className={deletingId === u.id ? 'row--deleting' : ''}>
                      <td>{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.phone || '—'}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <button className="btn-icon" onClick={() => openEditModal(u)} aria-label="Edit" title="Edit">
                          <i className="fas fa-pen" />
                        </button>
                        {deletingId !== u.id ? (
                          <>
                            {/* Only show delete button if current user is super‑admin OR the target is not an admin */}
                            {(u.role !== 'ADMIN' || isSuperAdmin) && (
                              <button
                                className="btn-icon btn-icon--danger"
                                onClick={() => setDeletingId(u.id)}
                                aria-label="Delete"
                                title="Delete"
                              >
                                <i className="fas fa-trash" />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="delete-pill">
                            <span>{labels.delete_confirm}</span>
                            <button className="pill-confirm" onClick={() => confirmDelete(u.id)} disabled={loading}>
                              Yes
                            </button>
                            <button className="pill-cancel" onClick={() => setDeletingId(null)}>No</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                        No users found.
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
        {editingUser && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
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
                      onChange={e => { setEditForm({ ...editForm, name: e.target.value }); if (editErrors.name) setEditErrors({}) }}
                      className={editErrors.name ? 'error' : ''}
                      required
                    />
                    {editErrors.name && <span className="field-hint">{editErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label>{labels.form.email_label}</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => { setEditForm({ ...editForm, email: e.target.value }); if (editErrors.email) setEditErrors({}) }}
                      className={editErrors.email ? 'error' : ''}
                      required
                    />
                    {editErrors.email && <span className="field-hint">{editErrors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label>{labels.form.password_label} <small>(leave blank to keep current)</small></label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label>{labels.form.role_label}</label>
                    <select
                      value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      required
                    >
                      {isSuperAdmin && <option value="ADMIN">Admin</option>}
                      <option value="EMPLOYEE">Employee</option>
                      <option value="CLIENT">Client</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{labels.form.phone_label}</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    />
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
          .form-group input.error { border-color: #ef4444; }
          .field-hint { display: block; margin-top: 0.2rem; font-size: 0.72rem; color: #ef4444; }
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

          .role-filter {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .role-filter label {
            font-size: 0.8rem;
            font-weight: 600;
            color: #666;
            white-space: nowrap;
          }
          .role-filter select {
            padding: 0.6rem 0.8rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.9rem;
            min-width: 150px;
          }
          .role-filter select:focus {
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
          .btn-icon--danger:hover { color: #ef4444; background: #fee2e2; }
          .delete-pill { display: flex; align-items: center; gap: 0.4rem; background: #fee2e2; padding: 0.35rem 0.6rem; border-radius: 8px; font-size: 0.78rem; color: #dc2626; }
          .pill-confirm, .pill-cancel { background: none; border: none; font-size: 0.75rem; font-weight: 600; cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px; }
          .pill-confirm { color: #fff; background: #ef4444; }
          .pill-confirm:hover { background: #dc2626; }
          .pill-cancel { color: #dc2626; }
          .pill-cancel:hover { text-decoration: underline; }

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
            .form-row { flex-direction: column; gap: 0; }
            .filters { flex-direction: column; align-items: stretch; }
            .search-bar { min-width: unset; }
            .role-filter { align-self: flex-start; }
            .modal { max-width: 90vw; }
            .table-wrapper { padding: 0 0.5rem; }
          }
        `}</style>
      </DashboardLayout>
    </>
  )
}