// components/skeleton/employee/CreateAppointmentsSkeleton.tsx
import Skeleton from '../Skeleton'

export default function EmployeeCreateAppointmentsSkeleton() {
  return (
    <main className="main-content">
      <div className="card" style={{ padding: '1.5rem', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Skeleton width="1.2rem" height="1.2rem" borderRadius="50%" />
          <Skeleton height="1.5rem" width="40%" />
        </div>
        {['client', 'service', 'datetime', 'notes'].map((_, i) => (
          <div key={i} style={{ marginBottom: '1.2rem' }}>
            <Skeleton height="0.8rem" width="20%" style={{ marginBottom: '0.4rem' }} />
            <Skeleton height="2.2rem" borderRadius="8px" />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <Skeleton height="2.2rem" width="30%" borderRadius="8px" />
        </div>
      </div>
    </main>
  )
}