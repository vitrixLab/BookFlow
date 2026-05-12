// components/skeleton/client/BookAppointmentsSkeleton.tsx
import Skeleton from '../Skeleton'

export default function ClientBookAppointmentsSkeleton() {
  return (
    <main className="main-content">
      <div className="page">
        {/* Page header */}
        <div className="page-header">
          <Skeleton width="240px" height="2rem" borderRadius="8px" />
        </div>

        {/* Booking form card */}
        <div className="card">
          <div className="compact-form">
            {/* Service dropdown */}
            <div className="form-group">
              <Skeleton width="30%" height="0.75rem" borderRadius="4px" style={{ marginBottom: '0.4rem' }} />
              <Skeleton width="100%" height="2.4rem" borderRadius="8px" />
            </div>
            {/* Date & Time */}
            <div className="form-group">
              <Skeleton width="30%" height="0.75rem" borderRadius="4px" style={{ marginBottom: '0.4rem' }} />
              <Skeleton width="100%" height="2.4rem" borderRadius="8px" />
            </div>
            {/* Phone */}
            <div className="form-group">
              <Skeleton width="30%" height="0.75rem" borderRadius="4px" style={{ marginBottom: '0.4rem' }} />
              <Skeleton width="100%" height="2.4rem" borderRadius="8px" />
              <Skeleton width="70%" height="0.75rem" borderRadius="4px" style={{ marginTop: '0.3rem' }} />
            </div>
            {/* Buttons */}
            <div className="form-actions">
              <Skeleton width="100px" height="2.4rem" borderRadius="8px" />
              <Skeleton width="80px" height="2.4rem" borderRadius="8px" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { max-width: 600px; margin: 0 auto; width: 100%; }
        .page-header { margin-bottom: 1.75rem; }
        .card {
          background: #fff; border-radius: 16px; border: 1px solid #ebebeb;
          overflow: hidden; padding: 1.5rem;
        }
        .compact-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group { }
        .form-actions {
          display: flex; gap: 0.75rem; align-items: center; margin-top: 1.5rem;
        }
      `}</style>
    </main>
  )
}