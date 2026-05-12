// components/skeleton/admin/ServicesSkeleton.tsx 
import Skeleton from '../Skeleton'

export default function AdminServicesSkeleton() {
  return (
    <main className="main-content">
    
      {/* Page header */}
      <div className="page-header">
        <Skeleton width="220px" height="2rem" borderRadius="8px" />&nbsp;
      </div>
        
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <Skeleton height="1.5rem" width="30%" style={{ marginBottom: '1rem' }} />
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="40%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
            <div style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="40%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="40%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
            <div style={{ flex: 1 }}>
              <Skeleton height="0.8rem" width="40%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="2.2rem" borderRadius="8px" />
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <Skeleton height="1.5rem" width="50%" style={{ marginBottom: '1rem' }} />
          <Skeleton height="4rem" borderRadius="8px" style={{ marginBottom: '0.75rem' }} />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="1rem" width="80%" style={{ marginBottom: '0.5rem' }} />
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <Skeleton height="2rem" width="30%" style={{ marginBottom: '1rem' }} />
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {['ID', 'Name', 'Duration', 'Price', 'Actions'].map(h => (
                <th key={h}><Skeleton height="0.8rem" width="80%" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(4)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} style={{ padding: '0.75rem' }}>
                    <Skeleton height="1rem" width={j === 0 ? '30%' : '70%'} />
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