import { withSsrAuth } from '../../lib/withAuth'
import { prisma } from '../../lib/db'
import DashboardLayout from '../../components/DashboardLayout'
import siteConfig from '../../site.json'
import { formatDate } from '../../lib/formatDate'
import { useState } from 'react'

/* ─── Toast ─────────────────────────────────────── */
function Toast({ message, type = 'success', onClose }: {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}) {
  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      <i className={`fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
      <span>{message}</span>
      <button onClick={onClose} aria-label="Dismiss"><i className="fas fa-times" /></button>
      <style jsx>{`
        .toast { position: fixed; bottom: 24px; right: 24px; z-index: 600; display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 10px; background: #fff; color: #111; font-size: 0.85rem; font-weight: 500; box-shadow: 0 12px 30px rgba(0,0,0,0.1); border: 1px solid #ebebeb; animation: toastIn 0.25s var(--ease-out); }
        .toast--success { border-left: 4px solid #22c55e; }
        .toast--error { border-left: 4px solid #ef4444; }
        .toast button { background: none; border: none; color: #888; cursor: pointer; padding: 0; margin-left: 0.5rem; font-size: 0.9rem; }
        .toast button:hover { color: #111; }
        @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  )
}

/* ─── Modal (same structure, here with optional actions) ── */
function BookingModal({ appointment, labels, onClose, onAction }: {
  appointment: any
  labels: any
  onClose: () => void
  onAction?: (id: number, action: string) => void   // optional for appointments list
}) {
  const status = appointment.status
  const showConfirm = status === 'PENDING'
  const showComplete = status === 'PENDING' || status === 'CONFIRMED'
  const showCancel = status !== 'CANCELLED' && status !== 'COMPLETED'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{labels.title}</h3>
          <button onClick={onClose} className="modal-close" aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <span className="detail-label">{labels.service_label}</span>
            <span className="detail-value">{appointment.serviceName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{labels.client_label}</span>
            <span className="detail-value">{appointment.clientName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{labels.datetime_label}</span>
            <span className="detail-value">{appointment.datetimeFormatted}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{labels.status_label}</span>
            <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{labels.sms_status_label}</span>
            <span className="detail-value">{appointment.smsSent ? labels.sent : labels.not_sent}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{labels.notes_label}</span>
            <span className="detail-value">{appointment.notes || '—'}</span>
          </div>
        </div>
        {onAction && (
          <div className="modal-actions">
            {showConfirm && (
              <button className="btn btn-success btn-sm" onClick={() => onAction(appointment.id, 'confirm')}>
                {labels.confirm_button}
              </button>
            )}
            {showComplete && (
              <button className="btn btn-primary btn-sm" onClick={() => onAction(appointment.id, 'complete')}>
                {labels.complete_button}
              </button>
            )}
            {showCancel && (
              <button className="btn btn-danger btn-sm" onClick={() => onAction(appointment.id, 'cancel')}>
                {labels.cancel_button}
              </button>
            )}
          </div>
        )}
      </div>
      <style jsx>{`
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background: #fff; border-radius: 16px; width: 90%; max-width: 480px; padding: 1.5rem; box-shadow: 0 24px 48px rgba(0,0,0,0.1); animation: modalIn 0.2s ease; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
        .modal-header h3 { margin: 0; font-size: 1.15rem; }
        .modal-close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #888; }
        .modal-body { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .detail-row { display: flex; flex-direction: column; gap: 0.2rem; }
        .detail-label { font-size: 0.725rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; }
        .detail-value { font-size: 0.9rem; color: #111; }
        .status-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; }
        .status-pending   { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #d1fae5; color: #065f46; }
        .status-completed { background: #e0e7ff; color: #3730a3; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap; }
        .btn { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 0.3rem; }
        .btn-success { background: #22c55e; color: #fff; }
        .btn-danger  { background: #ef4444; color: #fff; }
        .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
        .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user || user.role !== 'EMPLOYEE') {
    return { redirect: { destination: '/login', permanent: false } }
  }
  
  const appointments = await prisma.bookedAppointment.findMany({
    where: { employeeId: user.id },
    include: { service: true, client: true },
    orderBy: { datetime: 'asc' },
  })
  
  const formattedAppointments = appointments.map((a) => ({
    id: a.id,
    clientName: a.client.name,
    serviceName: a.service.name,
    datetimeFormatted: formatDate(a.datetime.toISOString()),
    status: a.status,
    smsSent: a.smsSent,
    notes: a.notes,
  }))
  
  return { 
    props: { 
      user, 
      appointments: formattedAppointments,
      config: siteConfig,
    } 
  }
})

export default function EmployeeAppointments({ user, appointments, config }: any) {
  const c = config || {
    pages: {
      employee: {
        manage_appointments: {
          heading: 'My Appointments',
          table: { client: 'Client', service: 'Service', datetime: 'Date & Time', status: 'Status', action: 'Action' },
        },
        view_appointment: {
          title: 'Appointment Details',
          service_label: 'Service',
          client_label: 'Client',
          datetime_label: 'Date & Time',
          status_label: 'Status',
          sms_status_label: 'SMS',
          sent: 'Sent',
          not_sent: 'Not sent',
          notes_label: 'Notes',
          confirm_button: 'Confirm',
          complete_button: 'Complete',
          cancel_button: 'Cancel',
        },
      },
    },
  }
  const labels = c.pages.employee.manage_appointments.table
  const heading = c.pages.employee.manage_appointments.heading
  const modalLabels = c.pages.employee.view_appointment

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const openModal = (app: any) => setSelectedAppointment(app)
  const closeModal = () => setSelectedAppointment(null)

  const handleAction = async (id: number, action: string) => {
    // same logic as dashboard
  }

  return (
    <DashboardLayout user={user}>
      <div className="card">
        <div className="card-header">
          <i className="fas fa-calendar-alt" />
          <h2>{heading}</h2>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{labels.client}</th>
                <th>{labels.service}</th>
                <th>{labels.datetime}</th>
                <th>{labels.status}</th>
                <th>{labels.action || 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a: any) => (
                <tr key={a.id}>
                  <td>{a.clientName}</td>
                  <td>{a.serviceName}</td>
                  <td>{a.datetimeFormatted}</td>
                  <td>
                    <span className={`status-badge status-${a.status.toLowerCase()}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openModal(a)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAppointment && (
        <BookingModal
          appointment={selectedAppointment}
          labels={modalLabels}
          onClose={closeModal}
          onAction={handleAction}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style jsx>{`
        .status-badge {
          display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
        }
        .status-pending   { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #d1fae5; color: #065f46; }
        .status-completed { background: #e0e7ff; color: #3730a3; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
        .btn-sm { padding: 0.3rem 0.8rem; font-size: 0.75rem; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .card-header { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
        .card-header i { color: var(--sap-primary, #0a6ed1); }
        .card-header h2 { margin: 0; font-size: 0.92rem; font-weight: 700; color: #111; }
        .table-wrapper { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.75rem 1rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; border-bottom: 1px solid #f0f0f0; background: #fafafa; }
        td { padding: 0.6rem 1rem; font-size: 0.84rem; color: #111; border-bottom: 1px solid #f5f5f5; }
        tbody tr:nth-child(even) { background: #fafbfc; }
        tbody tr:hover { background: #f1f5f9; }
      `}</style>
    </DashboardLayout>
  )
}