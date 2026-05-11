// pages/client/settings/[bucket].tsx
import { withSsrAuth } from '../../../lib/withAuth'
import { getBucketsForRole } from '../../../lib/settingsConfig'
import { prisma } from '../../../lib/db'
import siteConfig from '../../../site.json'
import DashboardLayout from '../../../components/DashboardLayout'
import BucketLayout from '../../../components/settings/BucketLayout'
import ProfileBucket from '../../../components/settings/buckets/ProfileBucket'
import PlaceholderBucket from '../../../components/settings/buckets/PlaceholderBucket'
import Head from 'next/head'
 

const BUCKET_COMPONENTS: Record<string, React.FC<any>> = {
  profile: ProfileBucket,
  notifications: PlaceholderBucket,
  security: PlaceholderBucket,
}

export const getServerSideProps = withSsrAuth(async ({ req, params }) => {
  const user = req.session.user
  if (!user || user.role !== 'CLIENT') {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const bucket = params?.bucket as string
  const buckets = getBucketsForRole(user.role)
  if (!buckets.some(b => b.key === bucket)) {
    return { notFound: true }
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, plan: true, photo: true },
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

export default function ClientSettingsBucket({ user, bucket, config }: BucketPageProps) {
  const buckets = getBucketsForRole(user.role)
  const BucketComponent = BUCKET_COMPONENTS[bucket] || PlaceholderBucket
  const labels = config.pages.settings

  return (
    <>
      <Head>
        <title>{labels.title || 'Settings | BookFlow'}</title>
      </Head>
      <DashboardLayout user={user}>
        <BucketLayout buckets={buckets} activeKey={bucket} role={user.role}>
          <BucketComponent user={user} label={bucket} labels={labels} />
        </BucketLayout>
      </DashboardLayout>
    </>
  )
}