// components/skeleton/admin/KnowledgeBaseSkeleton.tsx
import Skeleton from '../Skeleton'

export default function AdminKnowledgeBaseSkeleton() {
  return (
    <main className="main-content">
      <div className="page">
        {/* Page header */}
        <Skeleton width="280px" height="2rem" borderRadius="8px" style={{ marginBottom: '1.5rem' }} />

        {/* Search bar */}
        <div className="search-bar">
          <Skeleton width="100%" height="2.4rem" borderRadius="8px" style={{ flex: 1 }} />
          <Skeleton width="48px" height="2.4rem" borderRadius="8px" />
        </div>

        {/* Source documents card */}
        <div className="card">
          <div className="card-head">
            <Skeleton width="24px" height="24px" borderRadius="6px" style={{ marginRight: '0.5rem' }} />
            <Skeleton width="180px" height="1rem" borderRadius="6px" />
          </div>
          <ul className="doc-list">
            {[...Array(3)].map((_, i) => (
              <li key={i}>
                <Skeleton width="60%" height="1rem" borderRadius="4px" />
                <Skeleton width="50px" height="0.8rem" borderRadius="4px" />
              </li>
            ))}
          </ul>
        </div>

        {/* Canonical statements card */}
        <div className="card">
          <div className="card-head">
            <Skeleton width="24px" height="24px" borderRadius="6px" style={{ marginRight: '0.5rem' }} />
            <Skeleton width="200px" height="1rem" borderRadius="6px" />
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {['ID', 'Statement', 'Score', 'Actions'].map(h => (
                    <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton height="1rem" width="30%" /></td>
                    <td className="statement-cell">
                      <Skeleton height="1rem" width="90%" />
                      <Skeleton height="1rem" width="60%" style={{ marginTop: '0.3rem' }} />
                    </td>
                    <td><Skeleton height="1rem" width="50%" /></td>
                    <td><Skeleton width="28px" height="28px" borderRadius="6px" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <Skeleton width="90px" height="2rem" borderRadius="8px" />
            <Skeleton width="120px" height="1rem" borderRadius="4px" />
            <Skeleton width="80px" height="2rem" borderRadius="8px" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { max-width: 1200px; margin: 0 auto; }
        .search-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; margin-bottom: 1.25rem; }
        .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 1.4rem 0.75rem; }
        .doc-list { list-style: none; padding: 0 1.4rem 1rem; margin: 0; }
        .doc-list li { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #f0f0f0; }
        .table-wrapper { overflow-x: auto; padding: 0 1.4rem 1rem; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.5rem 0.5rem; }
        td { padding: 0.5rem; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
        .statement-cell { max-width: 500px; }
        .pagination {
          display: flex; justify-content: center; align-items: center; gap: 1rem;
          padding: 1rem 1.4rem; border-top: 1px solid #f0f0f0;
        }
      `}</style>
    </main>
  )
}