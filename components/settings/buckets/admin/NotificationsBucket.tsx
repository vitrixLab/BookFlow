// components/settings/buckets/admin/NotificationsBucket.tsx
import { useState } from 'react'

export default function NotificationsBucket() {
  const [smsRetry, setSmsRetry] = useState(3)
  const [smsDelay, setSmsDelay] = useState(60)
  const [overdueAlert, setOverdueAlert] = useState(true)
  const [newBookingAlert, setNewBookingAlert] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await new Promise(resolve => setTimeout(resolve, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="notif-bucket">
      <h2 className="section-title">Notifications</h2>
      <p className="section-desc">Configure how BookFlow sends SMS reminders and email alerts.</p>

      <form onSubmit={handleSave}>
        <div className="card">
          <div className="card-head"><i className="fas fa-mobile-alt" /><h2>SMS Retry Configuration</h2></div>
          <div className="form-columns">
            <div className="form-group">
              <label>Max Retry Attempts</label>
              <input type="number" value={smsRetry} onChange={e => setSmsRetry(Number(e.target.value))} min={1} max={10} />
            </div>
            <div className="form-group">
              <label>Delay Between Retries (seconds)</label>
              <input type="number" value={smsDelay} onChange={e => setSmsDelay(Number(e.target.value))} min={30} max={600} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><i className="fas fa-bell" /><h2>Alert Thresholds</h2></div>
          <div className="perm-list">
            <label className="perm-row">
              <span>Overdue Appointment Reminders</span>
              <input type="checkbox" checked={overdueAlert} onChange={() => setOverdueAlert(!overdueAlert)} />
            </label>
            <label className="perm-row">
              <span>New Booking Notifications</span>
              <input type="checkbox" checked={newBookingAlert} onChange={() => setNewBookingAlert(!newBookingAlert)} />
            </label>
          </div>
        </div>

        <div className="form-actions">
          {saved && <span className="save-success"><i className="fas fa-check-circle" /> Saved</span>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save</>}
          </button>
        </div>
      </form>

      <style jsx>{`
        .notif-bucket { display: flex; flex-direction: column; gap: 1.25rem; }
        .section-title { font-family: 'Fraunces', Georgia, serif; font-size: 1.6rem; font-weight: 800; color: #111; margin: 0; }
        .section-desc { font-size: 0.88rem; color: #888; margin: -0.5rem 0 0; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; margin-bottom: 1.25rem; }
        .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
        .card-head i { font-size: 1.1rem; color: var(--sap-primary, #0a6ed1); }
        .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }
        .form-columns { display: flex; gap: 1rem; padding: 0 1.4rem 1.25rem; }
        .form-group { flex: 1; }
        .form-group label { font-size: 0.75rem; font-weight: 600; color: #666; margin-bottom: 0.3rem; display: block; }
        .form-group input { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem; color: #111; }
        .perm-list { padding: 0 1.4rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .perm-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem; color: #333; padding: 0.4rem 0; }
        .perm-row input[type="checkbox"] { width: 18px; height: 18px; accent-color: #0a6ed1; }
        .form-actions { display: flex; justify-content: flex-end; align-items: center; gap: 1rem; margin-top: 0.5rem; }
        .btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 0.4rem; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #0854a0; }
        .save-success { font-size: 0.85rem; font-weight: 600; color: #22c55e; display: flex; align-items: center; gap: 0.3rem; animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) { .form-columns { flex-direction: column; gap: 0; } }
      `}</style>
    </div>
  )
}