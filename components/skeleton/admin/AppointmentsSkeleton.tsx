// components/skeleton/admin/AppointmentsSkeleton.tsx 
import Skeleton from '../Skeleton'

export default function AdminAppointmentsSkeleton() {
  return (
    <main className="main-content">
      <div className="page">
        {/* Page header */}
        <div className="page-header">
          <Skeleton width="220px" height="2rem" borderRadius="8px" />
        </div>

        {/* Add User Card */}
        <div className="card">
          <div className="card-head">
            <Skeleton width="24px" height="24px" borderRadius="6px" style={{ marginRight: '0.5rem' }} />
            <Skeleton width="120px" height="1rem" borderRadius="6px" />
          </div>
          <div className="compact-form">
            <div className="form-row">
              <div className="form-group">
                <Skeleton width="60%" height="0.75rem" borderRadius="4px" style={{ marginBottom: '0.4rem' }} />
                <Skeleton width="100%" height="2.2rem" borderRadius="8px" />
              </div>
              <div className="form-group">
                <Skeleton width="40%" height="0.75rem" borderRadius="4px" style={{ marginBottom: '0.4rem' }} />
                <Skeleton width="100%" height="2.2rem" borderRadius="8px" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <Skeleton width="50%" height="0.75rem" borderRadius="4px" style={{ marginBottom: '0.4rem' }} />
                <Skeleton width="100%" height="2.2rem" borderRadius="8px" />
              </div>
              <div className="form-group">
                <Skeleton width="30%" height="0.75rem" borderRadius="4px" style={{ marginBottom: '0.4rem' }} />
                <Skeleton width="100%" height="2.2rem" borderRadius="8px" />
              </div>
            </div>
            <div className="form-row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <Skeleton width="80%" height="0.75rem" borderRadius="4px" style={{ marginBottom: '0.4rem' }} />
                <Skeleton width="100%" height="2.2rem" borderRadius="8px" />
              </div>
              <div className="form-actions" style={{ marginLeft: '1rem' }}>
                <Skeleton width="100px" height="2.2rem" borderRadius="8px" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filters">
          <div className="search-bar">
            <Skeleton width="100%" height="2.4rem" borderRadius="8px" />
            <Skeleton width="48px" height="2.4rem" borderRadius="8px" />
          </div>
          <div className="role-filter">
            <Skeleton width="50px" height="1rem" borderRadius="4px" style={{ marginRight: '0.5rem' }} />
            <Skeleton width="140px" height="2.4rem" borderRadius="8px" />
          </div>
        </div>

        {/* Users Table Card */}
        <div className="card table-card">
          <div className="card-head">
            <Skeleton width="24px" height="24px" borderRadius="6px" style={{ marginRight: '0.5rem' }} />
            <Skeleton width="100px" height="1rem" borderRadius="6px" />
            <Skeleton width="50px" height="1.2rem" borderRadius="999px" style={{ marginLeft: 'auto' }} />
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {['ID', 'Name', 'Email', 'Role', 'Phone', 'Joined', 'Actions'].map(h => (
                    <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton height="1rem" width="30%" /></td>
                    <td><Skeleton height="1rem" width="70%" /></td>
                    <td><Skeleton height="1rem" width="80%" /></td>
                    <td><Skeleton height="1rem" width="60%" /></td>
                    <td><Skeleton height="1rem" width="50%" /></td>
                    <td><Skeleton height="1rem" width="60%" /></td>
                    <td className="actions-cell">
                      <Skeleton width="28px" height="28px" borderRadius="6px" />
                      <Skeleton width="28px" height="28px" borderRadius="6px" />
                    </td>
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
        .page { max-width: 1200px; margin: 0 auto; width: 100%; }
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem; flex-wrap: wrap; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; margin-bottom: 1.25rem; }
        .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
        .compact-form { padding: 0 1.4rem 1.25rem; }
        .form-row { display: flex; gap: 1rem; }
        .form-group { flex: 1; margin-bottom: 1rem; }
        .form-actions { display: flex; justify-content: flex-end; align-items: flex-end; }

        .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: center; flex-wrap: wrap; }
        .search-bar { display: flex; gap: 0.5rem; flex: 1; min-width: 250px; }
        .role-filter { display: flex; align-items: center; gap: 0.5rem; }

        .table-card { overflow: hidden; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.75rem 1rem; }
        td { padding: 0.6rem 1rem; border-bottom: 1px solid #f5f5f5; }
        .actions-cell { display: flex; align-items: center; gap: 0.5rem; }

        .pagination {
          display: flex; justify-content: center; align-items: center; gap: 1rem;
          padding: 1rem 1.4rem; border-top: 1px solid #f0f0f0;
        }

        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 0; }
          .filters { flex-direction: column; align-items: stretch; }
          .search-bar { min-width: unset; }
          .role-filter { align-self: flex-start; }
          .table-wrapper { padding: 0 0.5rem; }
        }
      `}</style>
    </main>
  )
}