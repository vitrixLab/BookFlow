// pages/admin/traces.tsx
import { useState, useEffect } from 'react'
import { withIronSessionSsr } from 'iron-session/next'
import { sessionOptions } from '../../lib/session'
import DashboardLayout from '../../components/DashboardLayout'
import Head from 'next/head'

export interface ApiTraceEntry {
  timestamp: string
  method: string
  url: string
  status: number | null
  responseBody?: unknown
  error?: string
}

export const getServerSideProps = withIronSessionSsr(async ({ req }) => {
  const user = (req.session as any)?.user
  if (!user || user.role !== 'ADMIN') {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { props: { user } }
}, sessionOptions)

export default function TracesPage({ user }: { user: any }) {
  const [logs, setLogs] = useState<ApiTraceEntry[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 20

  const [selectedTrace, setSelectedTrace] = useState<ApiTraceEntry | null>(null)

  const fetchTraces = async (p: number) => {
    try {
      const res = await fetch(`/api/admin/traces?limit=${PAGE_SIZE}&offset=${(p - 1) * PAGE_SIZE}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch traces:', err)
    }
  }

  useEffect(() => { fetchTraces(currentPage) }, [currentPage])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  const truncate = (text: string, maxLen: number) => {
    if (!text) return ''
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + '...'
  }

  return (
    <>
      <Head>
        <title>API Trace Logs | Admin</title>
      </Head>
      <DashboardLayout user={user}>
        <div className="page">
          <h1 className="page-title">API Trace Logs</h1>
          <p className="page-sub">Last {total} API calls (ring buffer max 500)</p>

          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Method</th>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Response</th>
                    <th>Error</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((entry, idx) => (
                    <tr key={idx}>
                      <td>{new Date(entry.timestamp).toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-${entry.method?.toLowerCase() || 'get'}`}>
                          {entry.method}
                        </span>
                      </td>
                      <td className="cell-url">{truncate(entry.url, 50)}</td>
                      <td>
                        <span className={`badge badge-${entry.status && entry.status < 400 ? 'success' : 'error'}`}>
                          {entry.status ?? 'N/A'}
                        </span>
                      </td>
                      <td className="cell-response">
                        {truncate(JSON.stringify(entry.responseBody), 80)}
                      </td>
                      <td className="cell-error">{truncate(entry.error || '', 50)}</td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() => setSelectedTrace(entry)}
                        >
                          <i className="fas fa-eye" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                        No API traces yet. Enable DEBUG_API=true and trigger some API calls.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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

        {/* ── Detail Modal ── */}
        {selectedTrace && (
          <div className="modal-overlay" onClick={() => setSelectedTrace(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Trace Detail</h3>
                <button
                  className="modal-close"
                  onClick={() => setSelectedTrace(null)}
                  aria-label="Close"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span className="detail-label">Timestamp</span>
                  <span className="detail-value">{new Date(selectedTrace.timestamp).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Method</span>
                  <span className="detail-value">{selectedTrace.method}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">URL</span>
                  <span className="detail-value">{selectedTrace.url}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{selectedTrace.status ?? 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Response</span>
                  <span className="detail-value pre-wrap">
                    {selectedTrace.responseBody
                      ? JSON.stringify(selectedTrace.responseBody, null, 2)
                      : 'None'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Error</span>
                  <span className="detail-value pre-wrap">{selectedTrace.error || 'None'}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedTrace(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .page {
            --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
            max-width: 1200px;
            margin: 0 auto;
          }
          .page-title {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
          }
          .page-sub {
            color: #666;
            margin-bottom: 1.5rem;
          }
          .card {
            background: #fff;
            border-radius: 16px;
            border: 1px solid #ebebeb;
            overflow: hidden;
          }
          .table-wrapper {
            overflow-x: auto;
            padding: 0 1.4rem 1rem;
          }
          table { width: 100%; border-collapse: collapse; }
          th {
            text-align: left;
            padding: 0.5rem;
            font-size: 0.72rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #888;
            border-bottom: 1px solid #f0f0f0;
          }
          td {
            padding: 0.5rem;
            font-size: 0.84rem;
            border-bottom: 1px solid #f5f5f5;
            vertical-align: top;
          }
          .cell-url {
            max-width: 250px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .cell-response {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: monospace;
            font-size: 0.78rem;
          }
          .cell-error { color: #dc3545; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .badge {
            display: inline-block;
            padding: 0.2rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #fff;
          }
          .badge-get { background: #0a6ed1; }
          .badge-post { background: #22c55e; }
          .badge-put { background: #f59e0b; }
          .badge-delete { background: #dc3545; }
          .badge-success { background: #22c55e; }
          .badge-error { background: #dc3545; }
          .btn-view {
            background: #f5f5f5;
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            padding: 0.3rem 0.6rem;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            color: #555;
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            transition: background 0.15s, transform 0.16s var(--ease-out);
            will-change: transform;
          }
          .btn-view:active { transform: scale(0.97); }
          .btn-view:hover { background: #e0e0e0; }
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
            transition: background 150ms var(--ease-out), transform 160ms var(--ease-out);
            will-change: transform;
          }
          .page-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
          .page-btn:hover:not(:disabled) { background: #e0e0e0; }
          .page-info { font-size: 0.85rem; color: #666; }

          /* Modal */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 500;
            padding: 1rem;
            backdrop-filter: blur(4px);
            animation: oFade 0.15s var(--ease-out);
          }
          .modal-content {
            background: #fff;
            border-radius: 16px;
            width: 100%;
            max-width: 600px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.18);
            animation: mUp 0.2s var(--ease-out);
            max-height: 90vh;
            overflow-y: auto;
          }
          @keyframes oFade { from { opacity:0; } to { opacity:1; } }
          @keyframes mUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #f0f0f0;
            position: sticky;
            top: 0;
            background: #fff;
            border-radius: 16px 16px 0 0;
            z-index: 1;
          }
          .modal-header h3 { font-size: 1rem; font-weight: 700; color: #111; margin: 0; }
          .modal-close {
            background: none;
            border: none;
            font-size: 1rem;
            cursor: pointer;
            color: #aaa;
            padding: 0.3rem;
            border-radius: 6px;
            transition: background 0.15s, color 0.15s;
          }
          .modal-close:hover { background: #f5f5f5; color: #111; }
          .modal-body { padding: 1rem 1.5rem; }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 0.55rem 0;
            border-bottom: 1px solid #f5f5f5;
          }
          .detail-row:last-child { border-bottom: none; }
          .detail-label {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #aaa;
            flex: 0 0 100px;
          }
          .detail-value {
            font-size: 0.9rem;
            font-weight: 500;
            color: #111;
            flex: 1;
            word-break: break-word;
          }
          .pre-wrap { white-space: pre-wrap; }
          .modal-footer {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
            padding: 0.75rem 1.5rem 1.25rem;
            border-top: 1px solid #f5f5f5;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.45rem 1rem;
            border-radius: 10px;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: transform 0.16s var(--ease-out), background 0.15s;
          }
          .btn:active { transform: scale(0.97); }
          .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
          .btn-secondary:hover { background: #ebebeb; }
          .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }
      `}</style>
      </DashboardLayout>
    </>
  )
}