// pages/admin/procurement/purchase-orders.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { procurementApi, PurchaseOrder } from '@/lib/procurementApi';
import DashboardLayout from '@/components/DashboardLayout';
import Head from 'next/head';
import Footer from '@/components/Footer';

/* ── Toast component ──────────────────────────── */
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

/* ── Default labels ───────────────────────────── */
const DEFAULT_LABELS = {
  title: 'Purchase Orders | Admin',
  heading: 'Purchase Orders',
  search_placeholder: 'Search by supplier, status, or PO ID...',
  new_po_button: 'New Purchase Order',
  messages: {
    fetch_error: 'Failed to load purchase orders.',
  },
  table: {
    id: 'PO ID',
    supplier: 'Supplier',
    status: 'Status',
    date: 'Date',
    items: 'Items',
    actions: 'Actions',
    view: 'View',
  },
  no_results: 'No purchase orders found.',
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

export default function PurchaseOrdersPage({ user }: any) {
  const L = DEFAULT_LABELS;
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search & Pagination
  const PAGE_SIZE = 10;
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async () => {
    try {
      const data = await procurementApi.listPOs();
      setOrders(data);
    } catch (err: any) {
      setToast({ message: err.message || L.messages.fetch_error, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Filtering
  const filtered = orders.filter((po) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    const supplierName = (po.supplier?.name || '').toLowerCase();
    const status = po.status.toLowerCase();
    const idPart = po.id.slice(0, 8).toLowerCase();
    return (
      supplierName.includes(query) ||
      status.includes(query) ||
      idPart.includes(query)
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

  // Status badge class
  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'partially_received':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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
            <Link href="/admin/procurement/purchase-orders/new" className="btn btn-primary">
              <i className="fas fa-plus" style={{ marginRight: '0.4rem' }} /> {L.new_po_button}
            </Link>
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

          {/* Purchase Orders Table */}
          <div className="card table-card">
            <div className="card-head">
              <i className="fas fa-file-invoice" />
              <h2>All Purchase Orders</h2>
              <span className="badge">{filtered.length}</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{L.table.id}</th>
                    <th>{L.table.supplier}</th>
                    <th>{L.table.status}</th>
                    <th>{L.table.date}</th>
                    <th>{L.table.items}</th>
                    <th>{L.table.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((po) => (
                    <tr key={po.id}>
                      <td className="font-mono text-sm">{po.id.slice(0, 8)}...</td>
                      <td>{po.supplier?.name || '—'}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadgeClass(po.status)}`}>
                          {po.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}</td>
                      <td>{po.items?.length || 0}</td>
                      <td>
                        <Link href={`/admin/procurement/purchase-orders/${po.id}`} className="btn-icon" title="View">
                          <i className="fas fa-eye" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
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

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <Footer />

        <style jsx>{`
          .page { max-width: 1200px; margin: 0 auto; width: 100%; }
          .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem; flex-wrap: wrap; }
          .page-title { font-size: 1.75rem; font-weight: 800; color: #111; letter-spacing: -0.03em; margin: 0; }

          .card { border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; margin-bottom: 1.25rem; }
          .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
          .card-head i { font-size: 1.1rem; color: var(--sap-primary, #0a6ed1); }
          .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }
          .btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none; display: inline-flex; align-items: center; transition: background 0.2s; }
          .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
          .btn-primary:hover { background: #0854a0; }
          .badge { font-size: 0.72rem; font-weight: 600; color: #0a6ed1; background: rgba(10,110,209,0.08); padding: 0.2rem 0.6rem; border-radius: 20px; }

          .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: center; flex-wrap: wrap; }
          .search-bar { display: flex; gap: 0.5rem; flex: 1; min-width: 250px; }
          .search-bar input { flex: 1; min-width: 0; padding: 0.6rem 0.8rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; transition: border-color 150ms ease, box-shadow 150ms ease; }
          .search-bar input:focus { border-color: var(--sap-primary, #0a6ed1); box-shadow: 0 0 0 3px rgba(10, 110, 209, 0.1); outline: none; }
          .search-bar button { background: var(--sap-primary, #0a6ed1); color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1rem; cursor: pointer; white-space: nowrap; transition: transform 160ms ease; }
          .search-bar button:active { transform: scale(0.97); }

          .table-card { overflow: hidden; }
          .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 0.75rem 1rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; border-bottom: 1px solid #f0f0f0; background: #fafafa; position: sticky; top: 0; z-index: 1; }
          td { padding: 0.6rem 1rem; font-size: 0.84rem; color: #111; border-bottom: 1px solid #f5f5f5; }
          tbody tr:nth-child(even) { background: #fafbfc; }
          tbody tr:hover { background: #f1f5f9; }
          .btn-icon { background: none; border: none; color: #888; cursor: pointer; font-size: 1rem; padding: 0.3rem; border-radius: 6px; transition: background 0.15s, color 0.15s; display: inline-flex; align-items: center; }
          .btn-icon:hover { background: #f5f5f5; color: #111; }

          .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem 1.4rem; border-top: 1px solid #f0f0f0; }
          .page-btn { background: #f5f5f5; border: 1px solid #e8e8e8; border-radius: 8px; padding: 0.4rem 0.8rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; color: #555; display: inline-flex; align-items: center; gap: 0.3rem; transition: background 150ms ease, transform 160ms ease; }
          .page-btn:active { background: #e0e0e0; transform: scale(0.97); }
          .page-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
          .page-btn:hover:not(:disabled) { background: #e0e0e0; }
          .page-info { font-size: 0.85rem; color: #666; }

          @media (max-width: 768px) {
            .filters { flex-direction: column; align-items: stretch; }
            .search-bar { min-width: unset; }
            .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          }
        `}</style>
      </DashboardLayout>
    </>
  );
}