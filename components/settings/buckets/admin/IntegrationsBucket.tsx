// components/settings/buckets/admin/IntegrationsBucket.tsx
export default function IntegrationsBucket() {
  return (
    <div className="integrations-bucket">
      <h2 className="section-title">Integrations</h2>
      <p className="section-desc">Connect external services to BookFlow.</p>

      <div className="integrations-grid">
        <div className="card">
          <div className="card-head"><i className="fas fa-sms" /><h2>SMS Provider</h2></div>
          <div className="card-body">
            <p className="provider-name">Twilio</p>
            <p className="provider-status"><span className="dot dot--inactive" /> Not configured</p>
            <button className="btn btn-secondary" disabled>Configure (coming soon)</button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><i className="fas fa-robot" /><h2>AI Assistant</h2></div>
          <div className="card-body">
            <p className="provider-name">NVIDIA LLaMA 3.1‑8B</p>
            <p className="provider-status"><span className="dot dot--active" /> Active</p>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><i className="fas fa-plug" /><h2>Webhook Endpoints</h2></div>
          <div className="card-body">
            <p className="empty-state">No webhooks configured yet.</p>
            <button className="btn btn-secondary" disabled>Add Endpoint (coming soon)</button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><i className="fas fa-key" /><h2>API Keys</h2></div>
          <div className="card-body">
            <p className="empty-state">No API keys generated.</p>
            <button className="btn btn-secondary" disabled>Generate Key (coming soon)</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .integrations-bucket { display: flex; flex-direction: column; gap: 1.25rem; }
        .section-title { font-family: 'Fraunces', Georgia, serif; font-size: 1.6rem; font-weight: 800; color: #111; margin: 0; }
        .section-desc { font-size: 0.88rem; color: #888; margin: -0.5rem 0 0; }
        .integrations-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
        .card-head i { font-size: 1.1rem; color: var(--sap-primary, #0a6ed1); }
        .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }
        .card-body { padding: 0 1.4rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .provider-name { font-size: 1rem; font-weight: 700; color: #111; margin: 0; }
        .provider-status { font-size: 0.82rem; color: #888; display: flex; align-items: center; gap: 0.4rem; margin: 0; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot--active { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.4); }
        .dot--inactive { background: #d1d5db; }
        .empty-state { font-size: 0.84rem; color: #888; margin: 0; }
        .btn { padding: 0.4rem 0.9rem; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; border: 1px solid #d1d5db; background: #f5f5f5; color: #555; display: inline-flex; align-items: center; gap: 0.3rem; }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  )
}