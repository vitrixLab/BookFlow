// components/skeleton/client/BookingsSkeleton.tsx
import Skeleton from '../Skeleton'

export default function ClientBookingsSkeleton() {
  return (
    <main className="main-content">
      <div className="page">
        {/* Page header */}
        <div className="page-header">
          <Skeleton width="200px" height="2rem" borderRadius="8px" />
          <Skeleton width="50px" height="1.8rem" borderRadius="999px" />
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="search-bar">
            <Skeleton width="100%" height="2.4rem" borderRadius="6px" style={{ flex: 1 }} />
            <Skeleton width="48px" height="2.4rem" borderRadius="6px" />
          </div>
          <div className="status-filter">
            <Skeleton width="50px" height="1rem" borderRadius="4px" />
            <Skeleton width="120px" height="2.4rem" borderRadius="6px" />
          </div>
        </div>

        {/* Table card */}
        <div className="card table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {['Service', 'Date & Time', 'Status', 'Action'].map(h => (
                    <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton height="1rem" width="80%" /></td>
                    <td><Skeleton height="1rem" width="90%" /></td>
                    <td><Skeleton width="70px" height="1.2rem" borderRadius="999px" /></td>
                    <td><Skeleton width="60px" height="1.8rem" borderRadius="6px" /></td>
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
        .page { max-width: 1000px; margin: 0 auto; width: 100%; }
        .page-header {
          display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem;
        }
        .filters {
          display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .search-bar { display: flex; gap: 0.25rem; flex: 1; min-width: 200px; }
        .status-filter { display: flex; align-items: center; gap: 0.5rem; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .table-card { overflow: hidden; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.75rem 1rem; }
        td { padding: 0.6rem 1rem; border-bottom: 1px solid #f5f5f5; }
        .pagination {
          display: flex; justify-content: center; align-items: center; gap: 1rem;
          padding: 1rem 1.4rem; border-top: 1px solid #f0f0f0;
        }
      `}</style>
    </main>
  )
}