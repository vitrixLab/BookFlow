import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import pricingConfig from '../pricing.json'

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const p = pricingConfig

  const formatPrice = (plan: any) => {
    if (plan.monthlyPrice === null) return 'Custom'
    const price = annual ? plan.annualPrice : plan.monthlyPrice
    return price === 0 ? 'Free' : `$${price}`
  }

  const periodLabel = annual ? '/mo, billed yearly' : '/mo'

  return (
    <>
      <Head>
        <title>{p.meta.title}</title>
        <meta name="description" content={p.meta.description} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </Head>

      {/* Glass navigation bar */}
      <nav className="pricing-nav">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <img src="/image/bookflow_primary_logo.png" alt="BookFlow" style={{ height: 32 }} />
          </Link>
          <Link href="/login" className="nav-login">
            <strong>Log in</strong>
          </Link> 
        </div>
      </nav>

      <main className="pricing-main">
        {/* Header */}
        <section className="pricing-hero">
          <p className="pricing-eyebrow">{p.headline.eyebrow}</p>
          <h1 className="pricing-title">{p.headline.title}</h1>
          <p className="pricing-subtitle">{p.headline.subtitle}</p>

          {/* Billing toggle */}
          <div className="billing-toggle">
            <button
              onClick={() => setAnnual(false)}
              className={annual ? 'toggle-option' : 'toggle-option active'}
            >
              {p.billing.monthly}
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={annual ? 'toggle-option active' : 'toggle-option'}
            >
              {p.billing.annual}
              <span className="save-badge">{p.billing.save}</span>
            </button>
          </div>
        </section>

        {/* Plan cards */}
        <section className="plans-grid">
          {p.plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${plan.tag ? 'featured' : ''}`}
            >
              {plan.tag && <span className="popular-badge"> <i className="fas fa-crown" style={{ marginRight: '0.3rem' }} />{plan.tag}</span>}
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="price-value">{formatPrice(plan)}</span>
                {plan.monthlyPrice !== null && (
                  <span className="price-period">{periodLabel}</span>
                )}
              </div>
              <ul className="plan-features">
                {plan.features.map((feat, idx) => (
                  <li key={idx}>
                    <i className="fas fa-check-circle" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  window.location.href = `/api/pricing/choose?plan=${plan.id}`
                }}
                className={`plan-cta ${plan.tag ? 'primary' : 'outline'}`}
              >
                {plan.cta}
              </button>
            </div> 
          ))}

            <div className="plan-card-skip">  
            </div> 
            <div className="plan-card-skip">  
            </div> 
        </section>

        {/* Skip link (now a button) */}
        <div className="skip-link-container">
          <button
            onClick={() => {
              window.location.href = '/api/pricing/choose?plan=solo'
            }}
            className="skip-link-btn"
          >
            I'll decide later – just start free
          </button>
        </div>


        {/* FAQ */}
        <section className="faq-section">
          <h2 className="faq-title">{p.faq.heading}</h2>
          <dl className="faq-list">
            {p.faq.items.map((item, i) => (
              <div key={i} className="faq-item">
                <dt className="faq-question">{item.q}</dt>
                <dd className="faq-answer">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Footer */}
        <footer className="pricing-footer">
          <div className="footer-left">
            <span className="footer-brand">{p.footer.brand}</span>
            <span className="footer-copy">© {new Date().getFullYear()}</span>
          </div>
          <div className="footer-links">
            <Link href="/privacy">{p.footer.privacy}</Link>
            <Link href="/terms">{p.footer.terms}</Link>
            <Link href="/contact">{p.footer.contact}</Link>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #0f1c2e; background: #ffffff; }
        a { text-decoration: none; color: inherit; }
      `}</style>

      <style jsx>{`
        /* ── NAV ── */
        .pricing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(214,234,255,0.5);
          backdrop-filter: blur(20px) saturate(2);
          -webkit-backdrop-filter: blur(20px) saturate(2);
          border-bottom: 1px solid rgba(10,110,209,0.12);
        }
        .nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 1.5rem; height: 68px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-brand { display: flex; align-items: center; }
        .nav-login {
          color: #4a6278; font-weight: 900; font-size: 0.95rem; 
          transition: color 0.2s;
        }
        .nav-login:hover { color: #0a6ed1; }

        /* ── HERO ── */
        .pricing-main { padding-top: 68px; }
        .pricing-hero {
          text-align: center;
          padding: 5rem 1.5rem 3rem;
          background: linear-gradient(180deg, #f4f7fb 0%, #ffffff 100%);
        }
        .pricing-eyebrow {
          color: #0a6ed1; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.12em; font-size: 0.8rem; margin-bottom: 0.75rem;
        }
        .pricing-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 900; color: #001e4a;
          margin-bottom: 1rem; line-height: 1.15;
        }
        .pricing-subtitle {
          color: #4a6278; font-size: 1.1rem; max-width: 560px;
          margin: 0 auto 2rem;
        }

        /* billing toggle */
        .billing-toggle {
          display: inline-flex; align-items: center; gap: 0;
          background: #ffffff; border-radius: 40px; padding: 0.2rem;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .toggle-option {
          padding: 0.5rem 1.5rem; border-radius: 40px; border: none;
          background: transparent; color: #4a6278;
          font-weight: 600; cursor: pointer; font-size: 0.9rem;
          transition: all 0.2s;
        }
        .toggle-option.active {
          background: #0a6ed1; color: white;
        }
        .save-badge {
          font-size: 0.75rem; opacity: 0.8; margin-left: 0.3rem;
        }

        /* ── PLAN CARDS ── */
        .plans-grid {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 2rem;
          background: linear-gradient(180deg, #ffffff 0%, #eef5ff 100%);  /* background: linear-gradient(20deg, #ffffff 0%, #0a6ed1 900%); soft blue tint */
          box-shadow: 0 8px 24px rgba(0, 30, 74, 0.2);
          justify-content: center;          /* center the cards when they don’t fill the row */
        }
        .plan-card {
          background: white;
          border: 1.5px solid rgba(0,0,0,0.08);
          border-radius: 16px;
          padding: 2.5rem 2rem;
          display: flex; flex-direction: column;
          position: relative;
          transition: transform 0.25s, box-shadow 0.25s; 
          background: linear-gradient(135deg, #ffffff 0%, #0a6ed1 900%);
        }
        .plan-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,30,74,0.12);
        }
        .plan-card.featured {
          border-color: #F0C040;
          background: linear-gradient(135deg, #ffffff 0%, #F0C040 120%);
          transition: box-shadow 0.25s, transform 0.25s, border-color 0.25s;
        }
        
        .plan-card.featured:hover {
          box-shadow: 0 16px 40px rgba(204, 122, 42, 0.25);  /* near orange / brown */
          transform: translateY(-6px);
          border-color: #D4AF37;
        }
        .plan-card-skip { 
          border: 1.5px solid rgba(0,0,0,0.08);
          border-radius: 16px;
          padding: 2.5rem 2rem;
          display: flex; flex-direction: column;
          position: relative;
          transition: transform 0.25s, box-shadow 0.25s; 
          background: linear-gradient(135deg, #ffffff 0%, #0a6ed1 900%);
        }
        .popular-badge {
          position: absolute; top: 12px; right: 16px;
          background: #B8860B; color: white;
          padding: 0.2rem 0.9rem; border-radius: 20px;
          font-size: 0.75rem; font-weight: 700;
        }
        .plan-name {
          font-weight: 700; color: #001e4a; margin-bottom: 0.3rem;
          font-size: 1.2rem;
        }
        .plan-price {
          margin-bottom: 1.5rem;
        }
        .price-value {
          font-size: 2.5rem; font-weight: 900; color: #001e4a;
        }
        .price-period {
          color: #7a869a; margin-left: 0.3rem; font-size: 0.9rem;
        }
        .plan-features {
          list-style: none; margin: 0 0 2rem; flex: 1;
          color: #4a6278; font-size: 0.93rem; line-height: 1.8;
        }
        .plan-features li {
          display: flex; align-items: flex-start; gap: 0.5rem;
        }
        .plan-features i {
          color: #10b981; margin-top: 0.25rem; flex-shrink: 0;
        }

        /* ── BUTTONS (CTA) ── */
        .plan-cta {
          display: inline-block; text-align: center;
          padding: 0.85rem 2rem;
          border-radius: 12px;
          font-weight: 600; font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 150px;
          text-decoration: none !important;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .plan-cta.primary {
          background: #0a6ed1;
          color: white;
          box-shadow: 0 6px 18px rgba(10,110,209,0.3);
        }
        .plan-cta.primary:hover {
          background: #0860b8; 
          box-shadow: 0 10px 24px rgba(10,110,209,0.35);
        }
        .plan-cta.primary:active {
          transform: translateY(0);
          box-shadow: 0 4px 12px rgba(10,110,209,0.3);
        }
        .plan-cta.outline {
          background: transparent;
          color: #0a6ed1;
          border: 2px solid #0a6ed1;
          box-shadow: none;
        }
        .plan-cta.outline:hover {
          background: #d6eaff; 
          box-shadow: 0 6px 16px rgba(10,110,209,0.15);
        }
        .plan-cta.outline:active {
          transform: translateY(0);
          box-shadow: none;
        }

        /* ── SKIP (button) ── */
        .skip-link-container {
          text-align: center; margin-bottom: 3rem;
        }
        .skip-link-btn {
          background: transparent; border: none; color: #4a6278;
          font-size: 1.1rem; text-decoration: underline;
          text-underline-offset: 2px; cursor: pointer;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          margin-top: 4rem; 
          margin-bottom: 1.5rem; 
        }
        .skip-link-btn:hover {
          color: #0a6ed1;
        }

        /* ── FAQ ── */
        .faq-section {
          max-width: 800px; margin: 0 auto; padding: 4rem 1.5rem;
          box-shadow: 0 6px 16px rgba(10,110,209,0.15);
          
          margin-top: -1rem;
          margin-bottom: 4rem; 
        }
        .faq-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 2rem; font-weight: 900; color: #001e4a;
          text-align: center; margin-bottom: 3rem;
        }
        .faq-item {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1.5rem; margin-bottom: 1.5rem;
        }
        .faq-question {
          font-weight: 700; color: #001e4a; margin-bottom: 0.5rem;
          font-size: 1rem;
        }
        .faq-answer {
          color: #4a6278; line-height: 1.6; font-size: 0.95rem;
          margin: 0;
        }

        /* ── FOOTER ── */
        .pricing-footer {
          border-top: 1px solid #e2e8f0;
          padding: 2rem 1.5rem;
          display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 1rem;
          max-width: 1200px; margin: 0 auto;
          font-size: 0.9rem; color: #4a6278;
        }
        .footer-left {
          display: flex; gap: 0.5rem; align-items: center;
        }
        .footer-brand { font-weight: 700; }
        .footer-links {
          display: flex; gap: 2rem; flex-wrap: wrap;
        }
        .footer-links a {
          color: #4a6278; text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: #0a6ed1; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .plans-grid {
            grid-template-columns: 1fr;
            padding: 2rem 1rem 4rem;
          }
          .pricing-hero {
            padding: 4rem 1rem 2rem;
          }
          .faq-section {
            padding: 3rem 1rem;
          }
          .pricing-footer {
            flex-direction: column; text-align: center;
          }
          .footer-links { justify-content: center; }
        }
      `}</style>
    </>
  )
}
