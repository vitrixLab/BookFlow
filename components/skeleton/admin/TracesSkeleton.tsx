// components/skeleton/admin/TracesSkeleton.tsx
import Skeleton from '../Skeleton'

export default function AdminTracesSkeleton() {
  return (
    <main className="main-content">
      <div className="page">
        <Skeleton width="240px" height="2rem" borderRadius="8px" style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="220px" height="1rem" borderRadius="4px" style={{ marginBottom: '1.5rem' }} />

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {['Timestamp', 'Method', 'URL', 'Status', 'Response', 'Error', 'Actions'].map(h => (
                    <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton height="1rem" width="80%" /></td>
                    <td><Skeleton width="60px" height="1.2rem" borderRadius="6px" /></td>
                    <td className="cell-url"><Skeleton height="1rem" width="70%" /></td>
                    <td><Skeleton width="40px" height="1.2rem" borderRadius="6px" /></td>
                    <td className="cell-response"><Skeleton height="1rem" width="60%" /></td>
                    <td className="cell-error"><Skeleton height="1rem" width="50%" /></td>
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
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .table-wrapper { overflow-x: auto; padding: 0 1.4rem 1rem; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.5rem; }
        td { padding: 0.5rem; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
        .cell-url { max-width: 250px; }
        .cell-response { max-width: 200px; }
        .cell-error { max-width: 150px; }
        .pagination {
          display: flex; justify-content: center; align-items: center; gap: 1rem;
          padding: 1rem 1.4rem; border-top: 1px solid #f0f0f0;
        }
      `}</style>
    </main>
  )
}