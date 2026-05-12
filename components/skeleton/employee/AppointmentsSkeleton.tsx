// components/skeleton/employee/AppointmentsSkeleton.tsx
import Skeleton from '../Skeleton'

export default function EmployeeAppointmentsSkeleton() {
  return (
    <main className="main-content">
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Skeleton width="1rem" height="1rem" borderRadius="50%" />
          <Skeleton height="1.2rem" width="30%" />
        </div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['Client', 'Service', 'Date', 'Status', 'Action'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 4 ? '40%' : '70%'} />
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