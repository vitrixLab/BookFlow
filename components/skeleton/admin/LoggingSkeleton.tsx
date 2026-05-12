// components/skeleton/admin/LoggingSkeleton.tsx
import Skeleton from '../Skeleton'

export default function AdminLoggingSkeleton() {
  return (
    <main className="main-content">
      <div className="page">
        <Skeleton width="200px" height="2rem" borderRadius="8px" style={{ marginBottom: '1.5rem' }} />

        {/* Filters bar */}
        <div className="filters">
          <div className="search-bar">
            <Skeleton width="180px" height="2.4rem" borderRadius="8px" />
            <div style={{ flex: 1 }}>
              <Skeleton width="100%" height="2.4rem" borderRadius="8px" />
            </div>
            <Skeleton width="48px" height="2.4rem" borderRadius="8px" />
          </div>
        </div>

        {/* Table card */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {['ID', 'Question', 'Answer', 'Source', 'User', 'Timestamp', 'Actions'].map(h => (
                    <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton height="1rem" width="30%" /></td>
                    <td className="cell-question"><Skeleton height="1rem" width="90%" /></td>
                    <td className="cell-answer"><Skeleton height="1rem" width="80%" /></td>
                    <td><Skeleton width="60px" height="1.2rem" borderRadius="6px" /></td>
                    <td><Skeleton height="1rem" width="80%" /></td>
                    <td><Skeleton height="1rem" width="90%" /></td>
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
        .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: center; }
        .search-bar { display: flex; gap: 0.5rem; flex: 1; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .table-wrapper { overflow-x: auto; padding: 0 1.4rem 1rem; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.5rem; }
        td { padding: 0.5rem; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
        .cell-question, .cell-answer { max-width: 250px; }
        .pagination {
          display: flex; justify-content: center; align-items: center; gap: 1rem;
          padding: 1rem 1.4rem; border-top: 1px solid #f0f0f0;
        }
      `}</style>
    </main>
  )
}