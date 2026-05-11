// components/settings/BucketLayout.tsx
import { ReactNode } from 'react'
import { SettingsBucket } from '../../lib/settingsConfig'
import SidebarNav from './SidebarNav'
import SidebarNavMobile from './SidebarNavMobile'

interface BucketLayoutProps {
  children: ReactNode
  buckets: SettingsBucket[]
  activeKey: string
  role: string
}

export default function BucketLayout({ children, buckets, activeKey, role }: BucketLayoutProps) {
  return (
    <>
      <div className="bucket-layout">
        <SidebarNavMobile buckets={buckets} activeKey={activeKey} role={role} />
        <SidebarNav buckets={buckets} activeKey={activeKey} role={role} />
        <main className="bucket-content">{children}</main>
      </div>
      <style jsx>{`
        .bucket-layout {
          display: flex;
          min-height: calc(100vh - 64px);
        }
        .bucket-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .bucket-layout {
            flex-direction: column;
          }
          .bucket-content {
            padding: 1.5rem;
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