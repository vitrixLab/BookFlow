// components/settings/SidebarNav.tsx
import { useRouter } from 'next/router'
import { SettingsBucket } from '../../lib/settingsConfig'

interface SidebarNavProps {
  buckets: SettingsBucket[]
  activeKey: string
  role: string
}

export default function SidebarNav({ buckets, activeKey, role }: SidebarNavProps) {
  const router = useRouter()
  const prefix = `/${role.toLowerCase()}/settings`

  return (
    <nav className="settings-nav">
      <div className="nav-label">Settings</div>
      {buckets.map(bucket => (
        <button
          key={bucket.key}
          className={`nav-link ${bucket.key === activeKey ? 'nav-link--active' : ''}`}
          onClick={() => router.push(`${prefix}/${bucket.key}`)}
        >
          <i className={`fas fa-${bucket.icon}`} />
          <span>{bucket.label}</span>
        </button>
      ))}
      <style jsx>{`
        .settings-nav {
          width: 200px;
          flex-shrink: 0;
          padding: 1.5rem 0;
          border-right: 1px solid #ebebeb;
          background: #f9fafb;
          min-height: calc(100vh - 64px);
        }
        .nav-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: #888;
          padding: 0 1.25rem 0.75rem;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.55rem 1.25rem;
          border: none;
          background: none;
          font-size: 0.85rem;
          font-weight: 500;
          color: #555;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .nav-link:hover {
          background: #f0f0f0;
          color: #111;
        }
        .nav-link--active {
          background: #e8f0fe;
          color: #0a6ed1;
          font-weight: 600;
        }
        .nav-link i {
          width: 18px;
          text-align: center;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .settings-nav {
            display: none;
          }
        }
      `}</style>
    </nav>
  )
}