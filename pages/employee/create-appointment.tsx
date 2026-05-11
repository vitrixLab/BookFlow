// pages/employee/create-appointment.tsx
import { withSsrAuth } from '../../lib/withAuth'
import { useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../components/DashboardLayout'
import { prisma } from '../../lib/db'
import siteConfig from '../../site.json'

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
      <button onClick={onClose} aria-label="Dismiss">
        <i className="fas fa-times" />
      </button>
      <style jsx>{`
        .toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 600; display: flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1rem; border-radius: 10px; background: #fff; color: #111; font-size: 0.85rem; font-weight: 500;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1); border: 1px solid #ebebeb; animation: toastIn 0.25s var(--ease-out);
        }
        .toast--success { border-left: 4px solid #22c55e; }
        .toast--error { border-left: 4px solid #ef4444; }
        .toast button { background: none; border: none; color: #888; cursor: pointer; padding: 0; margin-left: 0.5rem; font-size: 0.9rem; }
        .toast button:hover { color: #111; }
        @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  )
}

export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user || user.role !== 'EMPLOYEE') {
    return { redirect: { destination: '/login', permanent: false } }
  }
  const services = await prisma.service.findMany()
  const clients = await prisma.user.findMany({ where: { role: 'CLIENT' } })
  return { props: { user, services: JSON.parse(JSON.stringify(services)), clients: JSON.parse(JSON.stringify(clients)) } }
})

export default function CreateAppointment({ user, services, clients }) {
  const router = useRouter()
  const [form, setForm] = useState({ clientId: '', serviceId: '', datetime: '', notes: '' })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const labels = siteConfig.pages.employee.create_appointment

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, employeeId: user.id }),
    })
    if (res.ok) {
      setToast({ message: labels.success_message, type: 'success' })
      setTimeout(() => router.push('/employee/appointments'), 1500)
    } else {
      const err = await res.json().catch(() => ({ message: labels.error_message }))
      setToast({ message: err.message || labels.error_message, type: 'error' })
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="page">
        <div className="card">
          <div className="card-header">
            <i className="fas fa-plus-circle" />
            <h2>{labels.heading}</h2>
          </div>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          <form onSubmit={handleSubmit} className="form-body">
            <div className="form-group">
              <label>{labels.form.client_label}</label>
              <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required
                style={{
                  appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a6278' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '12px 12px',
                  paddingRight: '2.5rem',
                }}
              >
                <option value="">{labels.form.select_client_placeholder}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{labels.form.service_label}</label>
              <select value={form.serviceId} onChange={e => setForm({...form, serviceId: e.target.value})} required
                style={{
                  appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a6278' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '12px 12px',
                  paddingRight: '2.5rem',
                }}
              >
                <option value="">{labels.form.select_service_placeholder}</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{labels.form.datetime_label}</label>
              <input type="datetime-local" value={form.datetime} onChange={e => setForm({...form, datetime: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>{labels.form.notes_label || 'Notes'}</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} />
            </div>
            <button type="submit" className="btn btn-primary btn-full">{labels.button_create}</button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .page { max-width: 640px; margin: 0 auto; width: 100%; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .card-header { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
        .card-header i { color: var(--sap-primary, #0a6ed1); }
        .card-header h2 { margin: 0; font-size: 1rem; font-weight: 700; color: #111; }
        .form-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.2rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: #334155; }
        select, input, textarea {
          padding: 0.6rem 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;
          background-color: #fff; color: #111; width: 100%; box-sizing: border-box;
          transition: border-color 0.2s;
        }
        select:focus, input:focus, textarea:focus { outline: none; border-color: var(--sap-primary, #0a6ed1); box-shadow: 0 0 0 3px rgba(10,110,209,0.1); }
        .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
        .btn-full { width: 100%; }
        .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; }
      `}</style>
    </DashboardLayout>
  )
}