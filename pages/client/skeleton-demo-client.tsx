// pages/client/skeleton-demo-client.tsx
import DashboardLayout from '../../components/DashboardLayout'
import ClientDashboardSkeleton from '../../components/skeleton/client/DashboardSkeleton'
import ClientBookingsSkeleton from '../../components/skeleton/client/BookingsSkeleton'
import ClientBookAppointmentsSkeleton from '../../components/skeleton/client/BookAppointmentsSkeleton'

import AIAssistantSkeleton from '../../components/skeleton/AIAssistantSkeleton'

/**
 * STATIC DEMO PAGE – renders all three client skeletons inside the
 * DashboardLayout so you can visually inspect the loading states
 * for client dashboard, my-bookings, and book-appointment pages.
 *
 * Visit: /client/skeleton-demo-client
 */
export default function ClientSkeletonDemo() {
  const mockUser = {
    id: 2,
    name: 'Test Client',
    email: 'client@bookflow.test',
    role: 'CLIENT',
    photo: null,
  }

  return (
    <DashboardLayout user={mockUser}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.5rem' }}>Client Dashboard Skeleton</h2>
        <ClientDashboardSkeleton />

        <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.5rem' }}>My Bookings Skeleton</h2>
        <ClientBookingsSkeleton />

        <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.5rem' }}>Book Appointment Skeleton</h2>
        <ClientBookAppointmentsSkeleton />
        
        <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.5rem' }}>AI Assistant Skeleton</h2>
        <AIAssistantSkeleton />
        
      </div>
    </DashboardLayout>
  )
}