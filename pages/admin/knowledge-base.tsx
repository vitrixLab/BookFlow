// pages/admin/knowledge-base.tsx
import { useState } from 'react'
import { withSsrAuth } from '../../lib/withAuth'
import DashboardLayout from '../../components/DashboardLayout'
import { getSourceDocuments, getCanonicalStatements } from '../../lib/chat_db'
import Head from 'next/head'
import type { SourceDocument, CanonicalStatement } from '../../lib/chat_db'
import chatLabels from '../../chat.json'
import Footer from '../../components/Footer'

const LABELS = chatLabels as any;
const KB = LABELS.pages?.knowledgeBase || {};
const PAGE_SIZE = 20

export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user || user.role !== 'ADMIN') {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const sources = await getSourceDocuments()
  const statements = await getCanonicalStatements(2000)

  return {
    props: {
      user,
      initialSources: JSON.parse(JSON.stringify(sources)),
      allStatements: JSON.parse(JSON.stringify(statements)),
    },
  }
})

export default function KnowledgeBase({
  user,
  initialSources,
  allStatements,
}: {
  user: any
  initialSources: SourceDocument[]
  allStatements: CanonicalStatement[]
}) {
  const [sources] = useState(initialSources)
  const [statements, setStatements] = useState(allStatements)
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(statements.length / PAGE_SIZE)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const pageItems = statements.slice(startIdx, startIdx + PAGE_SIZE)

  const [selectedStatement, setSelectedStatement] = useState<CanonicalStatement | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setStatements(allStatements)
      setCurrentPage(1)
      return
    }
    setSearching(true)
    const res = await fetch(`/api/knowledge-search?q=${encodeURIComponent(searchTerm)}`).then(r => r.json())
    setStatements(res)
    setCurrentPage(1)
    setSearching(false)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  const truncate = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + '...'
  }

  return (
    <>
      <Head>
        <title>{KB.title || 'Knowledge Base'} | Admin</title>
      </Head>
      <DashboardLayout user={user}>
        <div className="page">
          <h1 className="page-title">{KB.title}</h1>

          {/* Search */}
          <div className="search-bar">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={KB.searchPlaceholder}
            />
            <button onClick={handleSearch} disabled={searching}>
              <i className="fas fa-search" />
            </button>
          </div>

          {/* Source documents */}
          <div className="card">
            <div className="card-head">
              <i className="fas fa-file-alt" />
              <h2>{KB.sourceDocumentsLabel} ({sources.length})</h2>
            </div>
            <ul className="doc-list">
              {sources.map((doc) => (
                <li key={doc.id}>
                  <strong>{doc.filepath.split('/').pop()}</strong>
                  <span className="doc-size">{doc.charLength} chars</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Canonical statements with pagination */}
          <div className="card">
            <div className="card-head">
              <i className="fas fa-brain" />
              <h2>{KB.canonicalStatementsLabel} ({statements.length})</h2>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{KB.idColumn}</th>
                    <th>{KB.statementColumn}</th>
                    <th>{KB.scoreColumn}</th>
                    <th>{KB.actionsColumn || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td className="statement-cell">
                        {truncate(s.finalText, 150)}
                        {s.finalText.length > 150 && (
                          <button
                            className="see-more"
                            onClick={() => setSelectedStatement(s)}
                          >
                            see more
                          </button>
                        )}
                      </td>
                      <td>{s.entropyScore.toFixed(2)}</td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() => setSelectedStatement(s)}
                        >
                          <i className="fas fa-eye" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                        No statements found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left" /> {KB.previous}
                </button>
                <span className="page-info">
                  {KB.pageInfo?.replace('{current}', String(currentPage)).replace('{total}', String(totalPages)) || `Page ${currentPage} of ${totalPages}`}
                </span>
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {KB.next} <i className="fas fa-chevron-right" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Detail Modal ── */}
        {selectedStatement && (
          <div className="modal-overlay" onClick={() => setSelectedStatement(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Statement Detail</h3>
                <button
                  className="modal-close"
                  onClick={() => setSelectedStatement(null)}
                  aria-label="Close"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{selectedStatement.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Cluster ID</span>
                  <span className="detail-value">{selectedStatement.clusterId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Entropy Score</span>
                  <span className="detail-value">{selectedStatement.entropyScore.toFixed(4)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Text</span>
                  <span className="detail-value pre-wrap">{selectedStatement.finalText}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedStatement(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />

        <style jsx>{`
          .page { max-width: 1200px; margin: 0 auto; }
          .page-title { font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem; }
          .search-bar {
            display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
          }
          .search-bar input {
            flex: 1; padding: 0.6rem 0.8rem; border: 1px solid #d1d5db;
            border-radius: 8px; font-size: 0.9rem;
          }
          .search-bar button {
            background: var(--sap-primary); color: #fff; border: none;
            border-radius: 8px; padding: 0.6rem 1rem; cursor: pointer;
          }
          .card {
            background: #fff; border-radius: 16px; border: 1px solid #ebebeb;
            overflow: hidden; margin-bottom: 1.25rem;
          }
          .card-head {
            display: flex; align-items: center; gap: 0.5rem;
            padding: 1rem 1.4rem 0.75rem;
          }
          .card-head i { color: var(--sap-primary); }
          .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }
          .doc-list {
            list-style: none; padding: 0 1.4rem 1rem; margin: 0;
          }
          .doc-list li {
            display: flex; justify-content: space-between; padding: 0.4rem 0;
            border-bottom: 1px solid #f0f0f0; font-size: 0.85rem;
          }
          .doc-size { color: #888; font-size: 0.75rem; }
          .table-wrapper { overflow-x: auto; padding: 0 1.4rem 1rem; }
          table { width: 100%; border-collapse: collapse; }
          th {
            text-align: left; padding: 0.5rem 0.5rem; font-size: 0.72rem;
            text-transform: uppercase; letter-spacing: 0.04em; color: #888;
            border-bottom: 1px solid #f0f0f0;
          }
          td { padding: 0.5rem; font-size: 0.84rem; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
          .statement-cell { max-width: 500px; word-break: break-word; }
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
          .btn-view:active { transform: scale(0.97); }
          .btn-view:hover { background: #e0e0e0; }

          /* Pagination */
          .pagination {
            display: flex; justify-content: center; align-items: center; gap: 1rem;
            padding: 1rem 1.4rem; border-top: 1px solid #f0f0f0;
          }
          .page-btn {
            background: #f5f5f5; border: 1px solid #e8e8e8; border-radius: 8px;
            padding: 0.4rem 0.8rem; font-size: 0.82rem; font-weight: 600;
            cursor: pointer; color: #555; display: inline-flex; align-items: center; gap: 0.3rem;
            transition: background 0.15s, transform 0.16s var(--ease-out);
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
            flex: 0 0 120px;
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