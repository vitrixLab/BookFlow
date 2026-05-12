// pages/admin/skeleton-demo.tsx
import DashboardLayout from '../../components/DashboardLayout'
import SettingsSkeleton from '../../components/skeleton/settings/SettingsSkeleton'

/**
 * STATIC TEST PAGE – renders the SettingsSkeleton directly inside
 * the admin DashboardLayout so you can visually inspect the loading
 * state without needing a slow network or page transitions.
 *
 * Visit: /admin/skeleton-demo
 */
export default function SkeletonDemo() {
  // Mock admin user (the layout needs a user object)
  const mockUser = {
    id: 1,
    name: 'Test Admin',
    email: 'admin@bookflow.test',
    role: 'ADMIN',
    photo: null,
  }

  return (
    <DashboardLayout user={mockUser}>
      <SettingsSkeleton />
    </DashboardLayout>
  )
}