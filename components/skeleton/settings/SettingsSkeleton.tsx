// components/skeleton/settings/SettingsSkeleton.tsx
import Skeleton from '../Skeleton'

export default function SettingsSkeleton() {
  return (
    <>
      {/* Mobile top chips – exactly like SidebarNavMobile */}
      <div className="mobile-nav">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mobile-nav-link skeleton">
            <div className="mobile-icon skeleton" />
            <div className="mobile-label skeleton" />
          </div>
        ))}
      </div>

      <div className="bucket-layout">
        {/* LEFT SETTINGS NAV – exactly like SidebarNav */}
        <nav className="settings-nav">
          <div className="nav-label skeleton"></div>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`nav-link skeleton ${i === 0 ? 'nav-link--active' : ''}`}
            >
              <div className="nav-icon skeleton" />
              <div className="nav-text skeleton" />
            </div>
          ))}
        </nav>

        {/* MAIN CONTENT */}
        <section className="bucket-content">
          {/* Page header */}
          <div className="settings-page-header">
            <div className="page-title skeleton" />
            <div className="page-subtitle skeleton" />
          </div>

          {/* Business Profile Card */}
          <div className="settings-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <div className="card-icon skeleton" />
                <div className="card-title skeleton" />
              </div>
            </div>
            <div className="settings-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="field-group">
                  <div className="field-label skeleton" />
                  <div className="field-input skeleton" />
                </div>
              ))}
            </div>
            <div className="button-row">
              <div className="save-btn skeleton" />
            </div>
          </div>

          {/* Owner Profile Card */}
          <div className="settings-card owner-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <div className="card-icon skeleton" />
                <div className="card-title skeleton" />
              </div>
            </div>
            <div className="owner-layout">
              <div className="avatar-skeleton skeleton" />
              <div className="owner-info">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="owner-info-row">
                    <div className="owner-label skeleton" />
                    <div className="owner-value skeleton" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ── MOBILE CHIPS (matching SidebarNavMobile) ── */
        .mobile-nav {
          display: none;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          padding: 0.6rem 1.25rem;
          gap: 0.5rem;
          border-bottom: 1px solid #ebebeb;
          background: #fff;
        }
        .mobile-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 1rem;
          border-radius: 20px;
          border: 1px solid #e8e8e8;
          background: #f9f9f9;
          flex-shrink: 0;
        }
        .mobile-icon {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .mobile-label {
          width: 40px;
          height: 12px;
          border-radius: 999px;
        }

        /* ── SIDEBAR (matching SidebarNav) ── */
        .bucket-layout {
          display: flex;
          min-height: calc(100vh - 64px);
        }
        .settings-nav {
          width: 200px;
          flex-shrink: 0;
          padding: 1.5rem 0;
          border-right: 1px solid #ebebeb;
          background: #f9fafb;
        }
        .nav-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: #888;
          padding: 0 1.25rem 0.75rem;
          height: 12px;
          width: 100%;
          border-radius: 999px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.55rem 1.25rem;
          background: none;
          border: none;
        }
        .nav-link.nav-link--active {
          background: #e8f0fe;
        }
        .nav-icon {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .nav-text {
          width: 75%;
          height: 12px;
          border-radius: 999px;
        }

        .bucket-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .settings-page-header {
          margin-bottom: 1.5rem;
        }
        .page-title {
          width: 180px;
          height: 32px;
          border-radius: 10px;
          margin-bottom: 0.8rem;
        }
        .page-subtitle {
          width: 320px;
          max-width: 100%;
          height: 14px;
          border-radius: 999px;
        }

        .settings-card {
          background: #ffffff;
          border: 1px solid #e8edf3;
          border-radius: 24px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
        }
        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .card-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .card-icon {
          width: 20px;
          height: 20px;
          border-radius: 6px;
        }
        .card-title {
          width: 180px;
          height: 18px;
          border-radius: 999px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.25rem;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .field-label {
          width: 90px;
          height: 11px;
          border-radius: 999px;
        }
        .field-input {
          width: 100%;
          height: 48px;
          border-radius: 14px;
        }

        .button-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 2rem;
        }
        .save-btn {
          width: 150px;
          height: 44px;
          border-radius: 14px;
        }

        .owner-layout {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }
        .avatar-skeleton {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .owner-info {
          flex: 1;
        }
        .owner-info-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem 0;
          border-bottom: 1px solid #f1f4f8;
        }
        .owner-label {
          width: 70px;
          height: 11px;
          border-radius: 999px;
        }
        .owner-value {
          width: 180px;
          height: 14px;
          border-radius: 999px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .mobile-nav {
            display: flex;
          }
          .bucket-layout {
            flex-direction: column;
          }
          .settings-nav {
            display: none;
          }
          .bucket-content {
            padding: 1rem;
          }
        }
        @media (max-width: 480px) {
          .bucket-content {
            padding: 1rem;
          }
        }
      `}</style>
    </>
  )
}