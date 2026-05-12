// pages/admin/skeleton-demo-admin.tsx
import DashboardLayout from '../../components/DashboardLayout'
import AdminDashboardSkeleton from '../../components/skeleton/admin/DashboardSkeleton'
import AdminServicesSkeleton from '../../components/skeleton/admin/ServicesSkeleton'
import AdminUsersSkeleton from '../../components/skeleton/admin/UsersSkeleton'
import AdminAIAssistantSkeleton from '../../components/skeleton/admin/AIAssistantSkeleton'
import AdminAppointmentsSkeleton from '../../components/skeleton/admin/AppointmentsSkeleton'
import AdminKnowledgeBaseSkeleton from '../../components/skeleton/admin/KnowledgeBaseSkeleton'
import AdminLoggingSkeleton from '../../components/skeleton/admin/LoggingSkeleton'
import AdminTracesSkeleton from '../../components/skeleton/admin/TracesSkeleton'

/**
 * STATIC DEMO PAGE – renders all four admin skeletons inside the
 * DashboardLayout so you can visually inspect the loading states
 * for the admin dashboard, services, users, and appointments.
 *
 * Visit: /admin/skeleton-demo-admin
 */
export default function AdminSkeletonDemo() {
  const mockUser = {
    id: 1,
    name: 'Test Admin',
    email: 'admin@bookflow.test',
    role: 'ADMIN',
    photo: null,
  }

  return (
    <DashboardLayout user={mockUser}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.5rem' }}>Dashboard Skeleton</h2>
        <AdminDashboardSkeleton />

        <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.5rem' }}>Services Skeleton</h2>
        <AdminServicesSkeleton />

        <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.5rem' }}>Users Skeleton</h2>
        <AdminUsersSkeleton />

        <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.5rem' }}>Appointments Skeleton</h2>
        <AdminAppointmentsSkeleton />
        
        <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.5rem' }}>AI Assistant Skeleton</h2>
        <AdminAIAssistantSkeleton />
        
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.5rem' }}>KnowledgeBase Skeleton</h2>
        <AdminKnowledgeBaseSkeleton />

        <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.5rem' }}>Logging Skeleton</h2>
        <AdminLoggingSkeleton />

        <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.5rem' }}>Traces Skeleton</h2>
        <AdminTracesSkeleton />

      </div>
    </DashboardLayout>
  )
}