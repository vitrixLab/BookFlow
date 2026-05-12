// pages/admin/settings/[bucket].tsx
import { withSsrAuth } from '../../../lib/withAuth'
import { getBucketsForRole } from '../../../lib/settingsConfig'
import { prisma } from '../../../lib/db'
import siteConfig from '../../../site.json'
import DashboardLayout from '../../../components/DashboardLayout'
import BucketLayout from '../../../components/settings/BucketLayout'
import ProfileBucket from '../../../components/settings/buckets/ProfileBucket'
import PlaceholderBucket from '../../../components/settings/buckets/PlaceholderBucket'
import AccountBucket from '../../../components/settings/buckets/admin/AccountBucket' 
import RolesBucket from '../../../components/settings/buckets/admin/RolesBucket'
import NotificationsBucket from '../../../components/settings/buckets/admin/NotificationsBucket'
import BillingBucket from '../../../components/settings/buckets/admin/BillingBucket'
import IntegrationsBucket from '../../../components/settings/buckets/admin/IntegrationsBucket'
import SecurityBucket from '../../../components/settings/buckets/admin/SecurityBucket' 
import Head from 'next/head'

const BUCKET_COMPONENTS: Record<string, React.FC<any>> = { 
  account:       AccountBucket,   // ✅ replaced from PlaceholderBucket
  roles:         RolesBucket,
  notifications: NotificationsBucket,
  billing:       BillingBucket,
  integrations:  IntegrationsBucket, // PlaceholderBucket is still in progress, so keeping placeholder for now 
  security:      SecurityBucket,
  profile:       ProfileBucket,   // for backward compatibility
}

export const getServerSideProps = withSsrAuth(async ({ req, params }) => {
  const user = req.session.user
  if (!user || user.role !== 'ADMIN') {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const bucket = params?.bucket as string
  const buckets = getBucketsForRole(user.role)
  const bucketExists = buckets.some(b => b.key === bucket)

  if (!bucketExists) {
    return { notFound: true }
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, plan: true, photo: true, isSuperAdmin: true, },
  })

  return {
    props: {
      user: fullUser,
      bucket,
      config: siteConfig,
    },
  }
})

interface BucketPageProps {
  user: any
  bucket: string
  config: typeof siteConfig
}

export default function AdminSettingsBucket({ user, bucket, config }: BucketPageProps) {
  const buckets = getBucketsForRole(user.role)
  const BucketComponent = BUCKET_COMPONENTS[bucket] || PlaceholderBucket
  const labels = config.pages.settings

  return (
    <>
      <Head>
        <title>{labels?.title || 'Settings | BookFlow'}</title>
      </Head>
      <DashboardLayout user={user}>
        <BucketLayout buckets={buckets} activeKey={bucket} role={user.role}>
          <BucketComponent user={user} label={bucket} labels={labels} />
        </BucketLayout>
      </DashboardLayout>
    </>
  )
}