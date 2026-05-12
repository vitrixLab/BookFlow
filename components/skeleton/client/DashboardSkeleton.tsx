// components/skeleton/client/DashboardSkeleton.tsx
import Skeleton from '../Skeleton'

export default function ClientDashboardSkeleton() {
  return (
    <main className="main-content">
      <div className="page">
        {/* Page header */}
        <Skeleton width="220px" height="2rem" borderRadius="8px" style={{ marginBottom: '1.75rem' }} />

        {/* Stats grid */}
        <div className="stats-grid">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="stat-card">
              <Skeleton height="2rem" width="60%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="1rem" width="40%" />
            </div>
          ))}
        </div>

        {/* Book a Service table */}
        <div className="card table-card">
          <div className="card-head">
            <Skeleton width="24px" height="24px" borderRadius="6px" style={{ marginRight: '0.5rem' }} />
            <Skeleton width="120px" height="1rem" borderRadius="6px" />
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {['Service', 'Description', 'Duration', 'Price', 'Actions'].map(h => (
                    <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton height="1rem" width="70%" /></td>
                    <td className="desc-cell">
                      <Skeleton height="1rem" width="80%" />
                      <br />
                      <Skeleton width="40px" height="0.8rem" borderRadius="4px" style={{ marginTop: '0.2rem' }} />
                    </td>
                    <td><Skeleton height="1rem" width="50%" /></td>
                    <td><Skeleton height="1rem" width="40%" /></td>
                    <td className="actions-cell">
                      <Skeleton width="60px" height="1.8rem" borderRadius="6px" />
                      <Skeleton width="50px" height="1.8rem" borderRadius="6px" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination placeholder */}
          <div className="pagination">
            <Skeleton width="90px" height="2rem" borderRadius="8px" />
            <Skeleton width="120px" height="1rem" borderRadius="4px" />
            <Skeleton width="80px" height="2rem" borderRadius="8px" />
          </div>
        </div>

        {/* Recent Bookings table */}
        <div className="card table-card">
          <div className="card-head">
            <Skeleton width="24px" height="24px" borderRadius="6px" style={{ marginRight: '0.5rem' }} />
            <Skeleton width="140px" height="1rem" borderRadius="6px" />
          </div>

          {/* Filters bar */}
          <div className="filters">
            <Skeleton width="200px" height="2.4rem" borderRadius="6px" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Skeleton width="50px" height="1rem" borderRadius="4px" />
              <Skeleton width="120px" height="2.4rem" borderRadius="6px" />
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {['Service', 'Date & Time', 'Status', 'Actions'].map(h => (
                    <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton height="1rem" width="70%" /></td>
                    <td><Skeleton height="1rem" width="80%" /></td>
                    <td><Skeleton width="70px" height="1.2rem" borderRadius="999px" /></td>
                    <td><Skeleton width="60px" height="1.8rem" borderRadius="6px" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination placeholder */}
          <div className="pagination">
            <Skeleton width="90px" height="2rem" borderRadius="8px" />
            <Skeleton width="120px" height="1rem" borderRadius="4px" />
            <Skeleton width="80px" height="2rem" borderRadius="8px" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { max-width: 1000px; margin: 0 auto; width: 100%; }
        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .stat-card {
          background: #fff; border-radius: 12px; border: 1px solid #ebebeb; padding: 1.2rem;
        }
        .card {
          background: #fff; border-radius: 16px; border: 1px solid #ebebeb;
          overflow: hidden; margin-bottom: 1.25rem;
        }
        .card-head {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 1.1rem 1.4rem 0.75rem;
        }
        .table-card { overflow: hidden; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.75rem 1rem; }
        td { padding: 0.6rem 1rem; border-bottom: 1px solid #f5f5f5; }
        .desc-cell { max-width: 250px; }
        .actions-cell { display: flex; gap: 0.5rem; align-items: center; }

        .filters {
          display: flex; gap: 1rem; align-items: center;
          padding: 0 1.4rem 0.75rem; flex-wrap: wrap;
        }

        .pagination {
          display: flex; justify-content: center; align-items: center; gap: 1rem;
          padding: 1rem 1.4rem; border-top: 1px solid #f0f0f0;
        }
      `}</style>
    </main>
  )
}