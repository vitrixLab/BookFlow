// components/settings/SidebarNavMobile.tsx
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { SettingsBucket } from '../../lib/settingsConfig'

interface SidebarNavMobileProps {
  buckets: SettingsBucket[]
  activeKey: string
  role: string
}

export default function SidebarNavMobile({ buckets, activeKey, role }: SidebarNavMobileProps) {
  const router = useRouter()
  const prefix = `/${role.toLowerCase()}/settings`
  const activeRef = useRef<HTMLButtonElement>(null)

  // Auto‑scroll the active tab into view (useful only if the container still overflows)
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeKey])

  return (
    <div className="mobile-nav">
      {buckets.map(bucket => (
        <button
          key={bucket.key}
          ref={bucket.key === activeKey ? activeRef : undefined}
          className={`mobile-nav-link ${bucket.key === activeKey ? 'mobile-nav-link--active' : ''}`}
          onClick={() => router.push(`${prefix}/${bucket.key}`)}
        >
          <i className={`fas fa-${bucket.icon}`}/>
          <span  
            style={{ 
                marginLeft: '-6px',
            }}
          >
            {bucket.label}</span>
        </button>
      ))}

      <style jsx>{`
        .mobile-nav {
          display: none;                     /* hidden on desktop */
          flex-wrap: wrap;                  /* flow onto multiple rows */
          align-items: flex-start;
          padding: 0.6rem 1.25rem;
          gap: 0.5rem;                      /* spacing between chips */
          border-bottom: 1px solid #ebebeb;
          background: #fff;
        }
        .mobile-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          padding: 0.6rem 1rem;            /* slightly smaller since it doesn't need scroll tolerance */
          border-radius: 20px;
          border: 1px solid #e8e8e8;
          background: #f9f9f9;
          font-size: 0.8rem;
          font-weight: 500;
          color: #555;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s, transform 0.15s;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .mobile-nav-link i {
          font-size: 0.85rem;
        }
        .mobile-nav-link--active {
          background: #0a6ed1;
          color: #fff;
          border-color: #0a6ed1;
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(10,110,209,0.15);
        }

        @media (max-width: 768px) {
          .mobile-nav {
            display: flex;                  /* visible on mobile */
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}