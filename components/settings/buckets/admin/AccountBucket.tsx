// components/settings/buckets/admin/AccountBucket.tsx
import { useState } from 'react'

interface AccountBucketProps {
  user: {
    name: string
    email: string
    role: string
    plan?: string
    photo?: string
  }
  labels: any    // from site.json → pages.settings
}

export default function AccountBucket({ user, labels }: AccountBucketProps) {
  const [businessName, setBusinessName] = useState('BookFlow')
  const [timezone, setTimezone] = useState('UTC+8 (Asia/Manila)')
  const [locale, setLocale] = useState('en-PH')
  const [contactEmail, setContactEmail] = useState(user.email || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    // Placeholder API call – replace with actual endpoint later
    await new Promise(resolve => setTimeout(resolve, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="account-bucket">
      <h2 className="section-title">Accounts</h2>
      <p className="section-desc">View/Edit your personal account details & preferences.</p>
      <div className="card">
        <div className="card-head">
          <i className="fas fa-building" />
          <h2>Business Profile</h2>
        </div>

        <form onSubmit={handleSave} className="compact-form">
          <div className="form-columns">
            <div className="form-group">
              <label>Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-columns">
            <div className="form-group">
              <label>Timezone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option>UTC+8 (Asia/Manila)</option>
                <option>UTC+0 (GMT)</option>
                <option>UTC-5 (US Eastern)</option>
                <option>UTC-8 (US Pacific)</option>
                <option>UTC+5:30 (IST)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Locale</label>
              <select value={locale} onChange={(e) => setLocale(e.target.value)}>
                <option value="en-PH">English (Philippines)</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            {saved && <span className="save-success"><i className="fas fa-check-circle" /> Saved</span>}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <><i className="fas fa-spinner fa-spin" /> Saving…</>
              ) : (
                <><i className="fas fa-save" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Owner Profile Card */}
      <div className="card">
        <div className="card-head">
          <i className="fas fa-user-shield" />
          <h2>Owner Profile</h2>
        </div>
        <div className="profile-sheet">
          <div className="profile-avatar">
            {user.photo ? (
              <img src={user.photo.startsWith('http') ? user.photo : `/${user.photo}`} alt="Owner" />
            ) : (
              <span className="profile-initials">
                {user.name.split(' ').slice(0,2).map(n => n[0]).join('')}
              </span>
            )}
          </div>
          <div className="profile-fields">
            <div className="pf-row">
              <span className="pf-label">{labels?.profile_name_label || 'Name'}</span>
              <span className="pf-value">{user.name}</span>
            </div>
            <div className="pf-row">
              <span className="pf-label">{labels?.profile_email_label || 'Email'}</span>
              <span className="pf-value">{user.email}</span>
            </div>
            <div className="pf-row">
              <span className="pf-label">Role</span>
              <span className="pf-value accent">Admin</span>
            </div>
            <div className="pf-row">
              <span className="pf-label">Plan</span>
              <span className="pf-value accent">{user.plan || 'Business'}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .account-bucket {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #ebebeb;
          overflow: hidden;
        }
        .card-head {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1.1rem 1.4rem 0.75rem;
        }
          
        .section-title { font-family: 'Fraunces', Georgia, serif; font-size: 1.6rem; font-weight: 800; color: #111; margin: 0; }
        .section-desc { font-size: 0.88rem; color: #888; margin: -0.5rem 0 0; }
        
        .card-head i {
          font-size: 1.1rem;
          color: var(--sap-primary, #0a6ed1);
        }
        .card-head h2 {
          font-size: 0.92rem;
          font-weight: 700;
          color: #111;
          margin: 0;
        }
        .compact-form {
          padding: 0 1.4rem 1.25rem;
        }
        .form-columns {
          display: flex;
          gap: 1rem;
        }
        .form-group {
          flex: 1;
          margin-bottom: 1rem;
        }
        .form-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #666;
          margin-bottom: 0.3rem;
          display: block;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.55rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #111;
          transition: border-color 0.15s, box-shadow 0.15s;
          background: #fff;
        }
        .form-group input:focus,
        .form-group select:focus {
          border-color: var(--sap-primary, #0a6ed1);
          box-shadow: 0 0 0 3px rgba(10,110,209,0.15);
          outline: none;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 1rem;
        }
        .btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: background 0.2s, opacity 0.2s;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-primary {
          background: var(--sap-primary, #0a6ed1);
          color: #fff;
        }
        .btn-primary:hover:not(:disabled) {
          background: #0854a0;
        }
        .save-success {
          font-size: 0.85rem;
          font-weight: 600;
          color: #22c55e;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Owner profile card */
        .profile-sheet {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
          padding: 0 1.4rem 1.25rem;
        }
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #e8e8e8;
        }
        .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .profile-initials {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: #0a6ed1;
        }
        .profile-fields {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .pf-row {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid #e2e0e0;
        }
        .pf-row:last-child { border-bottom: none; }
        .pf-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #888;
          font-weight: 600;
          min-width: 60px;
        }
        .pf-value { font-size: 0.95rem; color: #111; font-weight: 500; }
        .pf-value.accent { color: #0a6ed1; font-weight: 700; }

        @media (max-width: 768px) {
          .form-columns { flex-direction: column; gap: 0; }
          .profile-sheet { flex-direction: column; align-items: center; text-align: center; }
          .pf-row { flex-direction: column; gap: 0.2rem; }
        }
      `}</style>
    </div>
  )
}