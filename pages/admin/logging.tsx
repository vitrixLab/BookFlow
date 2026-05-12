// pages/admin/logging.tsx
import { useState } from 'react'
import { withSsrAuth } from '../../lib/withAuth'
import DashboardLayout from '../../components/DashboardLayout'
import { getChatInteractions, type ChatInteraction } from '../../lib/chat_db'
import Head from 'next/head'
import chatLabels from '../../chat.json'
import { format } from 'date-fns'
import Footer from '../../components/Footer'

const LABELS = chatLabels as any
const PAGE = LABELS.pages?.chatLogs || {}
const PAGE_SIZE = 20

export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user || user.role !== 'ADMIN') {
    return { redirect: { destination: '/login', permanent: false } }
  }

  let interactions: ChatInteraction[] = []
  try {
    interactions = await getChatInteractions(200)
  } catch (_) {}

  return {
    props: {
      user,
      initialInteractions: JSON.parse(JSON.stringify(interactions)),
    },
  }
})

export default function ChatLogs({
  user,
  initialInteractions,
}: {
  user: any
  initialInteractions: ChatInteraction[]
}) {
  const [allInteractions] = useState(initialInteractions)
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // ── Modal state ──
  const [selectedLog, setSelectedLog] = useState<ChatInteraction | null>(null)

  // Filtering
  const filtered = allInteractions.filter((log) => {
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter
    const matchesSearch =
      !searchTerm.trim() ||
      log.question.toLowerCase().includes(searchTerm.trim().toLowerCase())
    return matchesSource && matchesSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  const handleFilterChange = (newSource: string) => {
    setSourceFilter(newSource)
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1)
  }

  const handleInputChange = (value: string) => {
    setSearchInput(value)
    if (value.trim() === '') {
      setSearchTerm('')
      setCurrentPage(1)
    }
  }

  const truncate = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + '...'
  }

  return (
    <>
      <Head>
        <title>{PAGE.title || 'Chat Logs'} | Admin</title>
      </Head>
      <DashboardLayout user={user}>
        <div className="page">
          <h1 className="page-title">{PAGE.title}</h1>

          {/* Filters bar */}
          <div className="filters">
            <div className="search-bar">
              <select
                value={sourceFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                style={{ width: '180px' }}
              >
                <option value="all">{PAGE.allSources}</option>
                <option value="live_data">{PAGE.sourceLiveData}</option>
                <option value="knowledge_base">{PAGE.sourceKnowledgeBase}</option>
                <option value="nvidia_llm">{PAGE.sourceDocumentation}</option>
                <option value="fallback">{PAGE.sourceFallback}</option>
              </select>

              <input
                type="text"
                placeholder={PAGE.searchPlaceholder}
                value={searchInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} disabled={searching}>
                <i className="fas fa-search" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{PAGE.idColumn}</th>
                    <th>{PAGE.questionColumn}</th>
                    <th>{PAGE.answerColumn}</th>
                    <th>{PAGE.sourceColumn}</th>
                    <th>{PAGE.userColumn}</th>
                    <th>{PAGE.timestampColumn}</th>
                    <th>{PAGE.actionsColumn || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td className="cell-question">
                        {truncate(log.question, 100)}
                        {log.question.length > 100 && (
                          <button
                            className="see-more"
                            onClick={() => setSelectedLog(log)}
                          >
                            see more
                          </button>
                        )}
                      </td>
                      <td className="cell-answer">
                        {truncate(log.answer, 100)}
                        {log.answer.length > 100 && (
                          <button
                            className="see-more"
                            onClick={() => setSelectedLog(log)}
                          >
                            see more
                          </button>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${log.source}`}>
                          {log.source}
                        </span>
                      </td>
                      <td>
                        {log.role
                          ? `${log.role} (ID: ${log.userId})`
                          : PAGE.anonymous}
                      </td>
                      <td>
                        {format(new Date(log.timestamp), 'M/d/yyyy, h:mm:ss a')}
                      </td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() => setSelectedLog(log)}
                        >
                          <i className="fas fa-eye" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                        No logs found.
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
                  <i className="fas fa-chevron-left" /> {PAGE.previous}
                </button>
                <span className="page-info">
                  {PAGE.pageInfo
                    ?.replace('{current}', String(currentPage))
                    .replace('{total}', String(totalPages)) ||
                    `Page ${currentPage} of ${totalPages}`}
                </span>
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {PAGE.next} <i className="fas fa-chevron-right" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Detail Modal ── */}
        {selectedLog && (
          <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Log Detail</h3>
                <button
                  className="modal-close"
                  onClick={() => setSelectedLog(null)}
                  aria-label="Close"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{selectedLog.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Timestamp</span>
                  <span className="detail-value">
                    {format(new Date(selectedLog.timestamp), 'M/d/yyyy, h:mm:ss a')}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User</span>
                  <span className="detail-value">
                    {selectedLog.role
                      ? `${selectedLog.role} (ID: ${selectedLog.userId})`
                      : PAGE.anonymous}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Source</span>
                  <span className="detail-value">{selectedLog.source}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Question</span>
                  <span className="detail-value pre-wrap">{selectedLog.question}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Answer</span>
                  <span className="detail-value pre-wrap">{selectedLog.answer}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />

        <style jsx>{`
          /* Existing styles unchanged */
          .page {
            --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
            --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
            max-width: 1200px;
            margin: 0 auto;
          }
          .page-title {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 1.5rem;
          }
          .filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            align-items: center;
          }
          .filters select {
            min-width: 180px;
            padding: 0.6rem 0.8rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.9rem;
            transition: border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out);
          }
          .filters select:focus {
            border-color: var(--sap-primary, #0a6ed1);
            box-shadow: 0 0 0 3px rgba(10, 110, 209, 0.1);
            outline: none;
          }
          .search-bar {
            display: flex;
            gap: 0.5rem;
            flex: 1;
          }
          .search-bar input {
            flex: 1;
            min-width: 0;
            padding: 0.6rem 0.8rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.9rem;
            transition: border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out);
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
            transition: transform 160ms var(--ease-out);
            will-change: transform;
          }
          .search-bar button:active {
            transform: scale(0.97);
          }
          .search-bar button:disabled {
            opacity: 0.6;
            transform: none;
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
          table {
            width: 100%;
            border-collapse: collapse;
          }
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
          .cell-question,
          .cell-answer {
            max-width: 250px;
            word-break: break-word;
          }
          .see-more {
            background: none;
            border: none;
            color: var(--sap-primary);
            cursor: pointer;
            font-size: 0.82rem;
            font-weight: 600;
            padding: 0;
            margin-left: 4px;
            text-decoration: underline;
          }
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
          .btn-view:active {
            transform: scale(0.97);
          }
          .btn-view:hover {
            background: #e0e0e0;
          }
          .badge {
            display: inline-block;
            padding: 0.2rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #fff;
          }
          .badge-live_data { background: #0a6ed1; }
          .badge-knowledge_base { background: #6f42c1; }
          .badge-nvidia_llm { background: #d63384; }
          .badge-fallback { background: #dc3545; }

          /* ── Pagination ── */
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

          /* ── Modal ── */
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
          .modal-header h3 {
            font-size: 1rem;
            font-weight: 700;
            color: #111;
            margin: 0;
          }
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
          .modal-close:hover {
            background: #f5f5f5;
            color: #111;
          }
          .modal-body {
            padding: 1rem 1.5rem;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 0.55rem 0;
            border-bottom: 1px solid #f5f5f5;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
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
          .pre-wrap {
            white-space: pre-wrap;
          }
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
          .btn-secondary {
            background: #f5f5f5;
            color: #555;
            border: 1px solid #e8e8e8;
          }
          .btn-secondary:hover {
            background: #ebebeb;
          }
          .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }

          @media (max-width: 640px) {
            .page-title { font-size: 1.6rem; }
            .filters { flex-direction: column; align-items: stretch; }
            .filters select { width: 100%; min-width: unset; }
            .search-bar { width: 100%; }
            .search-bar input { min-width: 0; }
            .page-btn { padding: 0.35rem 0.6rem; font-size: 0.8rem; }
            .table-wrapper { padding: 0 0.75rem 0.75rem; }
            th, td { padding: 0.4rem; font-size: 0.78rem; }
            .modal-content { max-width: 95vw; }
          }
        `}</style>
      </DashboardLayout>
    </>
  )
}