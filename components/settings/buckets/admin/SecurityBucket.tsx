// components/settings/buckets/admin/SecurityBucket.tsx
import { useState } from 'react'

export default function SecurityBucket() {
  const [sessionTimeout, setSessionTimeout] = useState(14)
  const [twoFA, setTwoFA] = useState(false)
  const [rateLimit, setRateLimit] = useState(60)
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

  const loginHistory = [
    { date: '2026-05-07 09:14', ip: '192.168.1.1', device: 'Chrome / Windows', success: true },
    { date: '2026-05-06 18:30', ip: '192.168.1.1', device: 'Chrome / Windows', success: true },
    { date: '2026-05-05 14:22', ip: '98.76.54.32', device: 'Safari / iPhone', success: false },
    { date: '2026-05-04 08:01', ip: '192.168.1.1', device: 'Firefox / Mac', success: true },
  ]

  return (
    <div className="security-bucket">
      <h2 className="section-title">Security</h2>
      <p className="section-desc">Manage session timeout, 2FA, and review login history.</p>

      <form onSubmit={handleSave}>
        <div className="cards-grid">
          <div className="card">
            <div className="card-head"><i className="fas fa-clock" /><h2>Session Timeout</h2></div>
            <div className="form-group">
              <label>Timeout (days)</label>
              <input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} min={1} max={90} />
            </div>
          </div>

          <div className="card">
            <div className="card-head"><i className="fas fa-lock" /><h2>Two‑Factor Authentication</h2></div>
            <div className="perm-row">
              <span>Enforce 2FA for all admin accounts</span>
              <input type="checkbox" checked={twoFA} onChange={() => setTwoFA(!twoFA)} />
            </div>
          </div>

          <div className="card">
            <div className="card-head"><i className="fas fa-tachometer-alt" /><h2>Rate Limiting</h2></div>
            <div className="form-group">
              <label>Max Requests / Minute</label>
              <input type="number" value={rateLimit} onChange={e => setRateLimit(Number(e.target.value))} min={10} max={600} />
            </div>
          </div>
        </div>

        <div className="form-actions">
          {saved && <span className="save-success"><i className="fas fa-check-circle" /> Saved</span>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save</>}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="card-head"><i className="fas fa-history" /><h2>Login History</h2></div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Date</th><th>IP Address</th><th>Device</th><th>Result</th></tr>
            </thead>
            <tbody>
              {loginHistory.map((entry, i) => (
                <tr key={i}>
                  <td>{entry.date}</td>
                  <td className="td-mono">{entry.ip}</td>
                  <td>{entry.device}</td>
                  <td><span className={`badge ${entry.success ? 'badge--success' : 'badge--fail'}`}>{entry.success ? 'Success' : 'Failed'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .security-bucket { display: flex; flex-direction: column; gap: 1.25rem; }
        .section-title { font-family: 'Fraunces', Georgia, serif; font-size: 1.6rem; font-weight: 800; color: #111; margin: 0; }
        .section-desc { font-size: 0.88rem; color: #888; margin: -0.5rem 0 0; }
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
        .card-head i { font-size: 1.1rem; color: var(--sap-primary, #0a6ed1); }
        .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }
        .form-group { padding: 0 1.4rem 1.25rem; }
        .form-group label { font-size: 0.75rem; font-weight: 600; color: #666; margin-bottom: 0.3rem; display: block; }
        .form-group input { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem; color: #111; }
        .perm-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem; color: #333; padding: 0 1.4rem 1.25rem; }
        .perm-row input[type="checkbox"] { width: 18px; height: 18px; accent-color: #0a6ed1; }
        .form-actions { display: flex; justify-content: flex-end; align-items: center; gap: 1rem; }
        .btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 0.4rem; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #0854a0; }
        .save-success { font-size: 0.85rem; font-weight: 600; color: #22c55e; display: flex; align-items: center; gap: 0.3rem; animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .table-wrapper { overflow-x: auto; padding: 0 1.4rem 1rem; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.65rem 0.5rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; border-bottom: 1px solid #f0f0f0; }
        td { padding: 0.5rem 0.5rem; font-size: 0.84rem; color: #111; border-bottom: 1px solid #f5f5f5; }
        .td-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.78rem; color: #555; }
        .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
        .badge--success { background: #d1fae5; color: #065f46; }
        .badge--fail { background: #fee2e2; color: #991b1b; }
        @media (max-width: 768px) { .cards-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}