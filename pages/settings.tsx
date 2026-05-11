// pages/settings.tsx
import { withSsrAuth } from '../lib/withAuth'

export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const role = user.role.toLowerCase()
  let destination = '/client/settings/profile'
  if (role === 'admin') destination = '/admin/settings/account'
  else if (role === 'employee') destination = '/employee/settings/profile'

  return { redirect: { destination, permanent: false } }
})

// This component will never render because of the redirect
export default function SettingsRedirect() {
  return null
}