// components/skeleton/admin/DashboardSkeleton.tsx
import Skeleton from '../Skeleton'

export default function AdminDashboardSkeleton() {
  return (
    <main className="main-content">
      <div className="page">
        {/* Page header */}
        <div className="page-header">
          <Skeleton width="220px" height="2rem" borderRadius="8px" />
          {/* Optional alert chip placeholder */}
          <Skeleton width="140px" height="2rem" borderRadius="999px" />
        </div>

        {/* Two-column grid */}
        <div className="two-col">
          {/* LEFT COLUMN */}
          <div className="col-left">
            {/* Overview Card */}
            <div className="card">
              <div className="card-head">
                <Skeleton width="120px" height="1rem" borderRadius="6px" />
              </div>
              <div className="kpi-row">
                <div className="kpi">
                  <Skeleton width="30px" height="30px" borderRadius="8px" style={{ marginBottom: '0.75rem' }} />
                  <Skeleton width="80%" height="0.9rem" borderRadius="4px" style={{ marginBottom: '0.5rem' }} />
                  <Skeleton width="60%" height="2.6rem" borderRadius="6px" style={{ marginBottom: '0.35rem' }} />
                  <Skeleton width="40%" height="0.8rem" borderRadius="4px" />
                </div>
                <div className="kpi-sep" />
                <div className="kpi">
                  <Skeleton width="30px" height="30px" borderRadius="8px" style={{ marginBottom: '0.75rem' }} />
                  <Skeleton width="80%" height="0.9rem" borderRadius="4px" style={{ marginBottom: '0.5rem' }} />
                  <Skeleton width="60%" height="2.6rem" borderRadius="6px" style={{ marginBottom: '0.35rem' }} />
                  <Skeleton width="40%" height="0.8rem" borderRadius="4px" />
                </div>
              </div>
              <div className="users-row">
                <div style={{ marginBottom: '1rem' }}>
                  <Skeleton width="60%" height="1rem" borderRadius="4px" style={{ marginBottom: '0.3rem' }} />
                  <Skeleton width="40%" height="0.8rem" borderRadius="4px" />
                </div>
                <div className="avatars" style={{ display: 'flex', gap: '1rem' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="av">
                      <Skeleton width="52px" height="52px" borderRadius="50%" />
                      <Skeleton width="52px" height="0.8rem" borderRadius="4px" style={{ marginTop: '0.4rem' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart Card */}
            <div className="card chart-card">
              <div className="card-head">
                <Skeleton width="150px" height="1rem" borderRadius="6px" />
              </div>
              <div className="chart-wrap">
                {/* Background number (hidden on mobile) */}
                <div className="chart-bg-num skeleton" style={{ width: '60px', height: '4rem', borderRadius: '8px', position: 'absolute', bottom: '1rem', left: '0.5rem', opacity: 0.15 }} />
                <div className="chart" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', padding: '0 1.4rem 0', height: '180px' }}>
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="bar-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', height: '100%' }}>
                      <Skeleton width="100%" height={`${30 + Math.random() * 70}%`} borderRadius="6px 6px 4px 4px" />
                      <Skeleton width="80%" height="0.7rem" borderRadius="4px" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Observatory Card (collapsed placeholder) */}
            <div className="card">
              <div className="card-head">
                <Skeleton width="120px" height="1rem" borderRadius="6px" />
              </div>
              <div style={{ padding: '0 1.4rem 1rem' }}>
                <Skeleton width="100%" height="60px" borderRadius="10px" />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-right">
            {/* Pending Appointments */}
            <div className="card">
              <div className="card-head">
                <Skeleton width="140px" height="1rem" borderRadius="6px" />
              </div>
              <ul className="item-list" style={{ listStyle: 'none', margin: 0, padding: '0 0.75rem 0.75rem' }}>
                {[...Array(3)].map((_, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.5rem' }}>
                    <Skeleton width="40px" height="40px" borderRadius="10px" />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="80%" height="0.9rem" borderRadius="4px" style={{ marginBottom: '0.3rem' }} />
                      <Skeleton width="60%" height="0.8rem" borderRadius="4px" />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Skeleton width="80px" height="0.8rem" borderRadius="4px" style={{ marginBottom: '0.3rem' }} />
                      <Skeleton width="7px" height="7px" borderRadius="50%" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Overdue (optional, can be hidden based on data but we'll show for skeleton) */}
            <div className="card">
              <div className="card-head">
                <Skeleton width="100px" height="1rem" borderRadius="6px" />
              </div>
              <ul className="item-list" style={{ listStyle: 'none', margin: 0, padding: '0 0.75rem 0.75rem' }}>
                {[...Array(2)].map((_, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.5rem' }}>
                    <Skeleton width="40px" height="40px" borderRadius="10px" />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="80%" height="0.9rem" borderRadius="4px" style={{ marginBottom: '0.3rem' }} />
                      <Skeleton width="60%" height="0.8rem" borderRadius="4px" />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Skeleton width="80px" height="0.8rem" borderRadius="4px" style={{ marginBottom: '0.3rem' }} />
                      <Skeleton width="7px" height="7px" borderRadius="50%" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* System Health */}
            <div className="card">
              <div className="card-head">
                <Skeleton width="140px" height="1rem" borderRadius="6px" />
              </div>
              <div style={{ padding: '0 1.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Skeleton width="10px" height="10px" borderRadius="50%" />
                <Skeleton width="60%" height="0.9rem" borderRadius="4px" />
              </div>
              <div className="kpi-row" style={{ padding: '0.25rem 1.4rem 1.25rem' }}>
                <div className="kpi">
                  <Skeleton width="30px" height="30px" borderRadius="8px" style={{ marginBottom: '0.75rem' }} />
                  <Skeleton width="80%" height="0.9rem" borderRadius="4px" style={{ marginBottom: '0.5rem' }} />
                  <Skeleton width="50%" height="1.6rem" borderRadius="6px" style={{ marginBottom: '0.35rem' }} />
                  <Skeleton width="60%" height="0.8rem" borderRadius="4px" />
                </div>
                <div className="kpi-sep" />
                <div className="kpi">
                  <Skeleton width="30px" height="30px" borderRadius="8px" style={{ marginBottom: '0.75rem' }} />
                  <Skeleton width="80%" height="0.9rem" borderRadius="4px" style={{ marginBottom: '0.5rem' }} />
                  <Skeleton width="50%" height="1.6rem" borderRadius="6px" style={{ marginBottom: '0.35rem' }} />
                  <Skeleton width="60%" height="0.8rem" borderRadius="4px" />
                </div>
              </div>
              <div style={{ padding: '0 1.4rem 1rem' }}>
                <Skeleton width="40%" height="0.8rem" borderRadius="4px" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-head">
                <Skeleton width="100px" height="1rem" borderRadius="6px" />
              </div>
              <div className="qa-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0 0.75rem 0.75rem' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#f8f8f8', border: '1px solid #f0f0f0' }}>
                    <Skeleton width="80%" height="0.9rem" borderRadius="4px" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Resets and layout matching the real dashboard */
        .page { max-width: 1200px; margin: 0 auto; width: 100%; }
        .page-header {
          display: flex; align-items: center; gap: 1rem;
          margin-bottom: 1.75rem; flex-wrap: wrap;
        }
        .two-col {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.25rem;
          align-items: start;
          width: 100%;
          max-width: 100%;
        }
        .col-left, .col-right {
          display: flex; flex-direction: column; gap: 1.25rem;
        }
        .card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #ebebeb;
          overflow: hidden;
          width: 100%;
          max-width: 100%;
        }
        .card-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.1rem 1.4rem 0.75rem;
        }
        .kpi-row {
          display: flex;
          padding: 0.25rem 1.4rem 1.25rem;
          border-bottom: 1px solid #f5f5f5;
        }
        .kpi { flex: 1; }
        .kpi-sep { width: 1px; background: #f0f0f0; margin: 0 1.5rem; flex-shrink: 0; }
        .users-row { padding: 1rem 1.4rem 1.25rem; }
        .avatars { display: flex; gap: 1rem; flex-wrap: wrap; }
        .av { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
        .chart-card { position: relative; overflow: hidden; }
        .chart-wrap { overflow-x: auto; position: relative; padding-bottom: 1rem; }
        .chart { display: flex; align-items: flex-end; gap: 0.5rem; padding: 0 1.4rem 0; height: 180px; position: relative; z-index: 1; }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 0.4rem; height: 100%; position: relative; }
        .item-list { list-style: none; margin: 0; padding: 0 0.75rem 0.75rem; }
        .qa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; padding: 0 0.75rem 0.75rem; }

        /* Responsive: keep same breakpoints as real page */
        @media (max-width: 960px) {
          .two-col { grid-template-columns: 1fr; }
        }
        @media (max-width: 500px) {
          .kpi-row { flex-direction: column; gap: 1.25rem; }
          .kpi-sep { width: 100%; height: 1px; margin: 0; }
          .chart-bg-num { display: none; }
          .two-col { grid-template-columns: 1fr; width: 100%; }
        }
      `}</style>
    </main>
  )
}