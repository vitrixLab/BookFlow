import { withSsrAuth } from '../../lib/withAuth'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../components/DashboardLayout'
import siteConfig from '../../site.json'
import { prisma } from '../../lib/db'

/* ─── Toast (same as admin) ─────────────────────── */
function Toast({ message, type = 'success', onClose }: {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

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

export const getServerSideProps = withSsrAuth(async ({ req, query }) => {
  const user = req.session.user
  if (!user || user.role !== 'CLIENT') {
    return { redirect: { destination: '/login', permanent: false } }
  }
  const services = await prisma.service.findMany()
  const preselectedService = query.service ? parseInt(query.service as string) : null
  return { props: { user, services: JSON.parse(JSON.stringify(services)), preselectedService, config: siteConfig } }
})

export default function ClientBookAppointment({ user, services, preselectedService, config }) {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState(preselectedService || '')
  const [datetime, setDatetime] = useState('')
  const [phone, setPhone] = useState(user.phone || '')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: parseInt(selectedService as string),
        clientId: user.id,
        datetime,
        phone,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setToast({ message: config.pages.client.book_appointment.success_message, type: 'success' })
      setTimeout(() => router.push('/client/my-bookings'), 2000)
    } else {
      setToast({ message: data.error || 'Booking failed', type: 'error' })
    }
    setLoading(false)
  }

  return (
    <DashboardLayout user={user}>
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">{config.pages.client.book_appointment.logo_text}</h1>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="compact-form">
            <div className="form-group">
              <label>{config.pages.client.book_appointment.service_label}</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                required
              >
                <option value="">-- Select Service --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} – {s.durationMin} min – ${s.price}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{config.pages.client.book_appointment.datetime_label}</label>
              <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>{config.pages.client.book_appointment.phone_label}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={config.pages.client.book_appointment.phone_placeholder} required />
              <small>{config.pages.client.book_appointment.sms_confirmation}</small>
            </div>
            <div className="form-actions" 
                style={{ 
                    display: 'flex'
                }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : config.pages.client.book_appointment.submit_button}
              </button>
              <p>&nbsp;</p><p>&nbsp;</p>
              <button type="button" className="btn btn-secondary" onClick={() => router.push('/client/dashboard')}>
                {config.pages.client.book_appointment.exit_button}
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style jsx>{`
        .page { max-width: 600px; margin: 0 auto; width: 100%; }
        .page-header { margin-bottom: 1.75rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #111; letter-spacing: -0.03em; margin: 0; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; padding: 1.5rem; }
        .compact-form { }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { font-size: 0.75rem; font-weight: 600; color: #666; margin-bottom: 0.3rem; display: block; }
        .form-group input,
        .form-group select {
          width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.85rem; color: #111; transition: border-color 0.15s, box-shadow 0.15s; background: #fff;
        }
        .form-group input:focus,
        .form-group select:focus { border-color: var(--sap-primary, #0a6ed1); box-shadow: 0 0 0 3px rgba(10,110,209,0.15); outline: none; }
        .form-group select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a6278' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 12px 12px;
          padding-right: 2.5rem;
        }
        .form-actions { display: flex; gap: 0.75rem; align-items: center; margin-top: 1.5rem; }
        .btn {
          padding: 0.5rem 1.2rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none;
          transition: transform 0.16s var(--ease-out), box-shadow 0.16s ease, background-color 0.18s ease;
          display: inline-flex; align-items: center; gap: 0.4rem;
        }
        .btn:active { transform: scale(0.97); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #0854a0; }
        .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
        .btn-secondary:hover:not(:disabled) { background: #ebebeb; }

        .spinner {
          display: inline-block; width: 1em; height: 1em;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: spin 0.6s linear infinite;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        small { display: block; margin-top: 0.3rem; font-size: 0.75rem; color: #888; }

        @media (max-width: 480px) {
          .form-actions { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </DashboardLayout>
  )
}