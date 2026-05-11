// components/settings/buckets/admin/BillingBucket.tsx
interface BillingBucketProps {
  user: { plan?: string }
}

export default function BillingBucket({ user }: BillingBucketProps) {
  const plan = user.plan || 'Business'

  const planDetails: Record<string, { price: string; employees: string; clients: string; features: string[] }> = {
    Solo: { price: 'Free', employees: '1', clients: '25', features: ['Basic scheduling', 'Client management'] },
    Studio: { price: '$29/mo', employees: '5', clients: '250', features: ['All Solo features', 'SMS reminders', '1 admin account'] },
    Business: { price: '$59/mo', employees: 'Unlimited', clients: 'Unlimited', features: ['All Studio features', 'Priority support', 'Unlimited admins', 'API access'] },
  }

  const info = planDetails[plan] || planDetails.Business

  return (
    <div className="billing-bucket">
      <h2 className="section-title">Billing & Plan</h2>
      <p className="section-desc">Your current plan and usage.</p>

      <div className="card">
        <div className="card-head"><i className="fas fa-credit-card" /><h2>Current Plan</h2></div>
        <div className="plan-highlight">
          <span className="plan-name">{plan}</span>
          <span className="plan-price">{info.price}</span>
        </div>
        <div className="plan-limits">
          <div className="limit-row"><span>Employees</span><strong>{info.employees}</strong></div>
          <div className="limit-row"><span>Clients</span><strong>{info.clients}</strong></div>
        </div>
        <div className="plan-features">
          <span className="features-label">Included</span>
          <ul>{info.features.map(f => <li key={f}>{f}</li>)}</ul>
        </div>
        <div className="plan-actions">
          <button className="btn btn-primary" disabled>Upgrade Plan (coming soon)</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><i className="fas fa-file-invoice" /><h2>Invoice History</h2></div>
        <p className="empty-state">No invoices yet.</p>
      </div>

      <style jsx>{`
        .billing-bucket { display: flex; flex-direction: column; gap: 1.25rem; }
        .section-title { font-family: 'Fraunces', Georgia, serif; font-size: 1.6rem; font-weight: 800; color: #111; margin: 0; }
        .section-desc { font-size: 0.88rem; color: #888; margin: -0.5rem 0 0; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
        .card-head i { font-size: 1.1rem; color: var(--sap-primary, #0a6ed1); }
        .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }
        .plan-highlight { display: flex; align-items: baseline; gap: 1rem; padding: 0.5rem 1.4rem 0; }
        .plan-name { font-family: 'Fraunces', Georgia, serif; font-size: 2rem; font-weight: 800; color: #0a6ed1; }
        .plan-price { font-size: 1.1rem; font-weight: 600; color: #888; }
        .plan-limits { display: flex; gap: 2rem; padding: 0.75rem 1.4rem; }
        .limit-row { font-size: 0.85rem; color: #555; }
        .limit-row strong { color: #111; margin-left: 0.3rem; }
        .plan-features { padding: 0 1.4rem 1rem; }
        .features-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #888; font-weight: 600; }
        .plan-features ul { list-style: none; padding: 0.5rem 0 0; margin: 0; }
        .plan-features li { font-size: 0.84rem; color: #333; padding: 0.25rem 0; }
        .plan-features li::before { content: '✓ '; color: #22c55e; font-weight: bold; margin-right: 0.4rem; }
        .plan-actions { padding: 0 1.4rem 1.25rem; }
        .btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 0.4rem; }
        .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .empty-state { text-align: center; padding: 2rem; font-size: 0.88rem; color: #888; }
      `}</style>
    </div>
  )
}