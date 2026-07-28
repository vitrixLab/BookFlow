// pages/admin/procurement/suppliers.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { procurementApi, Supplier, SupplierCreate } from '@/lib/procurementApi';
import DashboardLayout from '@/components/DashboardLayout';
import Head from 'next/head';
import Footer from '@/components/Footer';

/* ── Toast component (exactly like Users page) ─── */
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

/* ── Default labels (can be overridden via config) ─── */
const DEFAULT_LABELS = {
  title: 'Suppliers | Admin',
  heading: 'Manage Suppliers',
  add_heading: 'Add New Supplier',
  edit_heading: 'Edit Supplier',
  search_placeholder: 'Search by name, contact, or address...',
  messages: {
    added: 'Supplier added successfully.',
    updated: 'Supplier updated successfully.',
    deleted: 'Supplier deleted successfully.',
  },
  errors: {
    name_required: 'Supplier name is required.',
    add_failed: 'Failed to add supplier.',
    update_failed: 'Failed to update supplier.',
    delete_failed: 'Failed to delete supplier.',
  },
  form: {
    name_label: 'Supplier Name',
    name_placeholder: 'e.g., Global Books Inc.',
    contact_label: 'Contact',
    contact_placeholder: 'Email or phone',
    address_label: 'Address',
    address_placeholder: '123 Main St, City',
    terms_label: 'Terms',
    terms_placeholder: 'e.g., Net 30',
    add_button: 'Add Supplier',
    update_button: 'Update',
    cancel_button: 'Cancel',
  },
  table: {
    name: 'Name',
    contact: 'Contact',
    address: 'Address',
    terms: 'Terms',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
  },
  delete_confirm: 'Delete this supplier? This action cannot be undone.',
  no_results: 'No suppliers found.',
  not_found: 'Supplier not found.',
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession(req, res, sessionOptions);
  if (!session.user || session.user.role?.toLowerCase() !== 'admin') {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return {
    props: {
      user: session.user,
      isSuperAdmin: session.user.isSuperAdmin ?? false,
    },
  };
};

export default function SuppliersPage({ user, isSuperAdmin }: any) {
  // You could load custom labels from a config file (like users page does)
  const L = DEFAULT_LABELS;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: '',
    contact: '',
    address: '',
    terms: '',
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  // Edit modal state
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    contact: '',
    address: '',
    terms: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search & Pagination
  const PAGE_SIZE = 10;
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const data = await procurementApi.listSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load suppliers.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  // ── Filter & Paginate ──
  const filtered = suppliers.filter((s) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      s.name.toLowerCase().includes(query) ||
      (s.contact || '').toLowerCase().includes(query) ||
      (s.address || '').toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    if (value.trim() === '') {
      setSearchTerm('');
      setCurrentPage(1);
    }
  };

  // ── Add Supplier ──
  const validateAddForm = () => {
    const errs: Record<string, string> = {};
    if (!addForm.name.trim()) errs.name = L.errors.name_required;
    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddForm()) return;
    try {
      await procurementApi.createSupplier(addForm);
      setToast({ message: L.messages.added, type: 'success' });
      setAddForm({ name: '', contact: '', address: '', terms: '' });
      fetchSuppliers();
    } catch (err: any) {
      setToast({ message: err.message || L.errors.add_failed, type: 'error' });
    }
  };

  // ── Edit Supplier ──
  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditForm({
      name: supplier.name,
      contact: supplier.contact || '',
      address: supplier.address || '',
      terms: supplier.terms || '',
    });
    setEditErrors({});
  };

  const closeEditModal = () => setEditingSupplier(null);

  const validateEditForm = () => {
    const errs: Record<string, string> = {};
    if (!editForm.name.trim()) errs.name = L.errors.name_required;
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEditForm() || !editingSupplier) return;
    try {
      await procurementApi.updateSupplier(editingSupplier.id, editForm);
      setToast({ message: L.messages.updated, type: 'success' });
      closeEditModal();
      fetchSuppliers();
    } catch (err: any) {
      setToast({ message: err.message || L.errors.update_failed, type: 'error' });
    }
  };

  // ── Delete Supplier ──
  const confirmDelete = async (id: string) => {
    try {
      await procurementApi.deleteSupplier(id);
      setToast({ message: L.messages.deleted, type: 'success' });
      fetchSuppliers();
    } catch (err: any) {
      setToast({ message: err.message || L.errors.delete_failed, type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Head>
        <title>{L.title}</title>
      </Head>
      <DashboardLayout user={user}>
        <div className="page">
          <div className="page-header">
            <h1 className="page-title">{L.heading}</h1>
          </div>

          {/* Add Supplier Card */}
          <div className="card">
            <div className="card-head">
              <i className="fas fa-truck" />
              <h2>{L.add_heading}</h2>
            </div>
            <form onSubmit={handleAddSubmit} className="compact-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{L.form.name_label}</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={e => { setAddForm({ ...addForm, name: e.target.value }); if (addErrors.name) setAddErrors({}) }}
                    placeholder={L.form.name_placeholder}
                    className={addErrors.name ? 'error' : ''}
                    required
                  />
                  {addErrors.name && <span className="field-hint">{addErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label>{L.form.contact_label}</label>
                  <input
                    type="text"
                    value={addForm.contact}
                    onChange={e => setAddForm({ ...addForm, contact: e.target.value })}
                    placeholder={L.form.contact_placeholder}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{L.form.address_label}</label>
                  <input
                    type="text"
                    value={addForm.address}
                    onChange={e => setAddForm({ ...addForm, address: e.target.value })}
                    placeholder={L.form.address_placeholder}
                  />
                </div>
                <div className="form-group">
                  <label>{L.form.terms_label}</label>
                  <input
                    type="text"
                    value={addForm.terms}
                    onChange={e => setAddForm({ ...addForm, terms: e.target.value })}
                    placeholder={L.form.terms_placeholder}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {L.form.add_button}
                </button>
              </div>
            </form>
          </div>

          {/* Search */}
          <div className="filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder={L.search_placeholder}
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch}><i className="fas fa-search" /></button>
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="card table-card">
            <div className="card-head">
              <i className="fas fa-boxes" />
              <h2>All Suppliers</h2>
              <span className="badge">{filtered.length}</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{L.table.name}</th>
                    <th>{L.table.contact}</th>
                    <th>{L.table.address}</th>
                    <th>{L.table.terms}</th>
                    <th>{L.table.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((s) => (
                    <tr key={s.id} className={deletingId === s.id ? 'row--deleting' : ''}>
                      <td>{s.name}</td>
                      <td>{s.contact || '—'}</td>
                      <td>{s.address || '—'}</td>
                      <td>{s.terms || '—'}</td>
                      <td className="actions-cell">
                        <button className="btn-icon" onClick={() => openEditModal(s)} aria-label="Edit" title="Edit">
                          <i className="fas fa-pen" />
                        </button>
                        {deletingId !== s.id ? (
                          <button
                            className="btn-icon btn-icon--danger"
                            onClick={() => setDeletingId(s.id)}
                            aria-label="Delete"
                            title="Delete"
                          >
                            <i className="fas fa-trash" />
                          </button>
                        ) : (
                          <div className="delete-pill">
                            <span>{L.delete_confirm}</span>
                            <button className="pill-confirm" onClick={() => confirmDelete(s.id)}>
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
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                        {loading ? 'Loading...' : L.no_results}
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

        {/* Edit Supplier Modal */}
        {editingSupplier && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{L.edit_heading}</h2>
                <button className="modal-close" onClick={closeEditModal} aria-label="Close">
                  <i className="fas fa-times" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>{L.form.name_label}</label>
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
                    <label>{L.form.contact_label}</label>
                    <input
                      type="text"
                      value={editForm.contact}
                      onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{L.form.address_label}</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{L.form.terms_label}</label>
                    <input
                      type="text"
                      value={editForm.terms}
                      onChange={e => setEditForm({ ...editForm, terms: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary btn-sm">
                    {L.form.update_button}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={closeEditModal}>
                    {L.form.cancel_button}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <Footer />

        <style jsx>{`
          /* ── Same CSS as Users page ── */
          .page { max-width: 1200px; margin: 0 auto; width: 100%; }
          .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem; flex-wrap: wrap; }
          .page-title { font-size: 1.75rem; font-weight: 800; color: #111; letter-spacing: -0.03em; margin: 0; }

          .card { border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; margin-bottom: 1.25rem; }
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
          .form-actions { display: flex; justify-content: flex-end; margin-top: 0.5rem; }

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
            .modal { max-width: 90vw; }
            .table-wrapper { padding: 0 0.5rem; }
          }
        `}</style>
      </DashboardLayout>
    </>
  );
}