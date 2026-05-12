// components/skeleton/employee/DashboardSkeleton.tsx
import Skeleton from '../Skeleton'

export default function EmployeeDashboardSkeleton() {
  return (
    <main className="main-content">
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card stat-card" style={{ padding: '1.2rem' }}>
            <Skeleton height="2rem" width="60%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton height="1rem" width="40%" />
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Skeleton width="1rem" height="1rem" borderRadius="50%" />
          <Skeleton height="1.2rem" width="30%" />
        </div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['Service', 'Client', 'Date', 'Action'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(4)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 3 ? '40%' : '70%'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}