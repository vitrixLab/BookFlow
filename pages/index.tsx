import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import landingConfig from '../landing.json'

/* ─── Scroll‑reveal hook (stagger + reduced‑motion support) ─── */
function useScrollReveal(selector = '[data-reveal]') {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      document.querySelectorAll(selector).forEach(el => el.classList.add('revealed'))
      return
    }
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement
            const delay = el.style.getPropertyValue('--reveal-delay') || '0ms'
            el.style.transitionDelay = delay
            el.classList.add('revealed')
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll(selector).forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

/* ─── Star rating component ──────────────────── */
function Stars({ count = 5 }) {
  return (
    <span className="stars" aria-label={`${count} out of 5 stars`} role="img">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const landing = landingConfig
  useScrollReveal()

  const trustMetrics = landing.trustMetrics ?? [
    { value: '12,000+', label: 'Teams onboarded' },
    { value: '4.9 ★', label: 'Average rating' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: 'SOC 2', label: 'Type II certified' },
  ]

  const faqItems = landing.faq?.items ?? [
    { q: 'Is there a free plan?', a: 'Yes — our free tier covers up to 5 users and unlimited projects. No credit card required.' },
    { q: 'How long does setup take?', a: 'Most teams are live in under 30 minutes. Our onboarding wizard walks you through every step.' },
    { q: 'Can I import data from other tools?', a: 'Absolutely. We support CSV import and direct integrations with Jira, Asana, and Google Sheets.' },
    { q: 'What if I need help?', a: 'Paid plans include live chat support. All users get access to our documentation and community forum.' },
  ]

  return (
    <>
      <Head>
        <title>{landing.meta.title}</title>
        <meta name="description" content={landing.meta.description} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </Head>

      <a href="#main-content" className="skip-link">{landing.accessibility.skipLink}</a>

      <div className="landing-wrap">

        {/* ── NAVIGATION ──────────────────────────────── */}
        <nav className="nav" aria-label="Main navigation" role="navigation">
          <div className="nav-inner">
            <a href="/" className="nav-brand" aria-label={`${landing.nav.brand} home`}>
              <img src="/image/bookflow_primary_logo.png" alt="BookFlow logo" className="hero-img" width="235" height="60" loading="eager" decoding="async" />
            </a>

            <div className="nav-links" role="list">
              <Link href="#features" className="nav-link" role="listitem">{landing.nav.featuresLabel}</Link>
              <Link href="#how-it-works" className="nav-link" role="listitem">{landing.nav.howItWorksLabel}</Link>
              <Link href="#faq" className="nav-link" role="listitem">{landing.nav.faqLabel}</Link>
            </div>

            <div className="nav-actions">
              <Link href="/login" className="btn btn-ghost">{landing.nav.login}</Link>
              <Link href="/register" className="btn btn-primary" aria-describedby="nav-cta-desc">{landing.nav.register}</Link>
              <span id="nav-cta-desc" className="sr-only">No credit card required. Free for up to 5 users.</span>
            </div>

            <button
              className="nav-mobile-toggle"
              aria-label={landing.nav.mobileMenuLabel}
              aria-expanded="false"
              aria-controls="mobile-menu"
              onClick={e => {
                const expanded = e.currentTarget.getAttribute('aria-expanded') === 'true'
                e.currentTarget.setAttribute('aria-expanded', String(!expanded))
                document.getElementById('mobile-menu')?.classList.toggle('open')
              }}
            >
              <i className="fas fa-bars" aria-hidden="true" />
            </button>
          </div>

          <div id="mobile-menu" className="nav-mobile-menu" role="menu" aria-label="Mobile navigation">
            <Link href="#features" className="nav-mobile-link" role="menuitem">{landing.nav.featuresLabel}</Link>
            <Link href="#how-it-works" className="nav-mobile-link" role="menuitem">{landing.nav.howItWorksLabel}</Link>
            <Link href="#faq" className="nav-mobile-link" role="menuitem">{landing.nav.faqLabel}</Link>
            <Link href="/login" className="nav-mobile-link" role="menuitem">Log in</Link>
            <Link href="/register" className="btn btn-primary nav-mobile-cta" role="menuitem">Start Free Trial</Link>
          </div>
        </nav>

        <main id="main-content" tabIndex={-1}>
          <section className="hero" aria-labelledby="hero-heading">
            <div className="hero-mesh" aria-hidden="true">
              <div className="mesh-blob blob-1" />
              <div className="mesh-blob blob-2" />
              <div className="mesh-blob blob-3" />
            </div>
            <div className="hero-content" data-reveal>
              <div className="hero-badge" aria-label="Trust indicator">
                <Stars />
                <span>{landing.hero.badge}</span>
              </div>
              <h1 id="hero-heading" className="hero-title">
                {landing.hero.title_line1}<br />
                <em className="hero-highlight">{landing.hero.title_line2}</em>
              </h1>
              <p className="hero-subtitle">{landing.hero.subtitle}</p>
              <div className="hero-cta" role="group" aria-label="Get started actions">
                <Link href="/register" className="btn btn-primary btn-xl">{landing.hero.cta_primary}<i className="fas fa-arrow-right" aria-hidden="true" /></Link>
                <Link href="#features" className="btn btn-outline btn-xl">{landing.hero.cta_secondary}</Link>
              </div>
              <p className="hero-microcopy" aria-live="polite">{landing.hero.footerMicrocopy}</p>
            </div>
            <div className="hero-visual" data-reveal aria-hidden="false">
              <div className="hero-img-wrapper">
                <img src="/image/landing_page_sample.png" alt="Dashboard showing calendar scheduling overview" className="hero-img" width="720" height="480" loading="eager" decoding="async" />
                <div className="hero-float-badge" aria-hidden="true">
                  <i className="fas fa-check-circle" />
                  <span>{landing.hero.floatBadge}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── CLIENT LOGOS CAROUSEL ── */}
          <section className="section section-alt" aria-labelledby="clients-heading">
            <div className="section-intro" data-reveal>
              <p className="section-eyebrow">{landing.logos.eyebrow}</p>
              <h2 id="clients-heading" className="section-title">{landing.logos.heading}</h2>
            </div>
            <div className="client-logo-wrap">
              <ul className="client-logo client-logo-left">
                {landing.clients.map((c, i) => (
                  <li key={i}>
                    <img src={c.logo} alt={c.name} />
                    <span className="client-logo-text">{c.name}</span>
                  </li>
                ))}
                {landing.clients.map((c, i) => (
                  <li key={`dup-left-${i}`}>
                    <img src={c.logo} alt={c.name} />
                    <span className="client-logo-text">{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="client-logo-wrap mt-3">
              <ul className="client-logo client-logo-right">
                {landing.clients.map((c, i) => (
                  <li key={i}>
                    <img src={c.logo} alt={c.name} />
                    <span className="client-logo-text">{c.name}</span>
                  </li>
                ))}
                {landing.clients.map((c, i) => (
                  <li key={`dup-right-${i}`}>
                    <img src={c.logo} alt={c.name} />
                    <span className="client-logo-text">{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── TRUST METRICS ── */}
          <section className="trust-bar" aria-labelledby="trust-heading">
            <p id="trust-heading" className="sr-only">{landing.trustBar.srHeading}</p>
            <div className="trust-inner">
              {trustMetrics.map((m, i) => (
                <div className="trust-metric" key={i} data-reveal style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
                  <strong className="trust-value">{m.value}</strong>
                  <span className="trust-label">{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="features" className="section" aria-labelledby="features-heading">
            <div className="section-intro" data-reveal>
              <p className="section-eyebrow">{landing.features.eyebrow}</p>
              <h2 id="features-heading" className="section-title">{landing.features.heading}</h2>
            </div>
            <div className="features-grid">
              {landing.features.items.map((item, i) => (
                <article className="feature-card" key={i} data-reveal style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
                  <div className="feature-icon-wrap" aria-hidden="true"><i className={`fas ${item.icon}`} /></div>
                  <h3 className="feature-title">{item.title}</h3>
                  <p className="feature-desc">{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="how-it-works" className="section section-alt" aria-labelledby="steps-heading">
            <div className="section-intro" data-reveal>
              <p className="section-eyebrow">{landing.steps.eyebrow}</p>
              <h2 id="steps-heading" className="section-title">{landing.steps.heading}</h2>
            </div>
            <ol className="steps-list" aria-label="Onboarding steps">
              {landing.steps.items.map((step, i) => (
                <li className="step-item" key={i} data-reveal style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
                  <div className="step-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</div>
                  <div className="step-content">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-desc">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="section" aria-labelledby="testimonials-heading">
            <div className="section-intro" data-reveal>
              <p className="section-eyebrow">{landing.testimonials.eyebrow}</p>
              <h2 id="testimonials-heading" className="section-title">{landing.testimonials.heading}</h2>
            </div>
            <div className="testimonials-grid">
              {landing.testimonials.items.map((t, i) => (
                <figure className="testimonial-card" key={i} data-reveal style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
                  <div className="testimonial-stars"><Stars /></div>
                  <blockquote className="testimonial-quote"><p>"{t.quote}"</p></blockquote>
                  <figcaption className="testimonial-author">
                    {(() => {
                      const initial = t.name.charAt(0).toUpperCase()
                      let pic = null
                      if (initial === 'S') pic = 'user_images/2.png'
                      else if (initial === 'M') pic = 'user_images/7.png'
                      else if (initial === 'L') pic = 'user_images/8.png'
                      return pic ? (
                        <img src={`/${pic}`} alt={t.name} width="81" height="81" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div className="author-avatar" aria-hidden="true">{t.name.charAt(0)}</div>
                      )
                    })()}
                    <div className="author-info">
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section id="faq" className="section section-alt" aria-labelledby="faq-heading">
            <div className="section-intro" data-reveal>
              <p className="section-eyebrow">{landing.faq.eyebrow}</p>
              <h2 id="faq-heading" className="section-title">{landing.faq.heading}</h2>
            </div>
            <dl className="faq-list">
              {faqItems.map((item, i) => (
                <div className="faq-item" key={i} data-reveal style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
                  <dt>
                    <button
                      className="faq-toggle"
                      aria-expanded="false"
                      aria-controls={`faq-answer-${i}`}
                      id={`faq-question-${i}`}
                      onClick={e => {
                        const expanded = e.currentTarget.getAttribute('aria-expanded') === 'true'
                        e.currentTarget.setAttribute('aria-expanded', String(!expanded))
                        document.getElementById(`faq-answer-${i}`)?.classList.toggle('open')
                      }}
                    >
                      <span>{item.q}</span>
                      <i className="fas fa-chevron-down faq-chevron" aria-hidden="true" />
                    </button>
                  </dt>
                  <dd id={`faq-answer-${i}`} className="faq-answer" role="region" aria-labelledby={`faq-question-${i}`}>
                    <p>{item.a}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="cta-banner" aria-labelledby="cta-heading" data-reveal>
            <div className="cta-mesh" aria-hidden="true" />
            <div className="cta-inner">
              <p className="section-eyebrow cta-eyebrow">{landing.cta.eyebrow}</p>
              <h2 id="cta-heading" className="cta-title">{landing.cta.heading}</h2>
              <p className="cta-subtitle">{landing.cta.subtitle}</p>
              <div className="cta-actions" role="group" aria-label="Sign up actions">
                <button
                  onClick={() => router.push('/register')}
                  className="btn cta-btn"
                  style={{ 
                    padding: '1rem 2.8rem',
                    width: '90%',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    border: 'none',
                    cursor: 'pointer',
                    justifyContent: 'center'
                  }}
                >
                  {landing.cta.button}
                  <i className="fas fa-arrow-right" aria-hidden="true" style={{ marginLeft: '0.5rem' }} />
                </button>
              </div>
              <p>&nbsp;</p>
              <p className="cta-microcopy">{landing.cta.microcopy}</p>
            </div>
          </section>
        </main>

        <footer className="footer" role="contentinfo">
          <div className="footer-inner">
            <div className="footer-brand">
              <span className="nav-brand-text">{landing.footer.brand}</span>
              <p className="footer-copy">© {new Date().getFullYear()} {landing.footer.brand}. All rights reserved.</p>
            </div>
            <nav className="footer-nav" aria-label="Footer navigation">
              <Link href="/privacy">{landing.footer.privacy}</Link>
              <Link href="/terms">{landing.footer.terms}</Link>
              <Link href="/contact">{landing.footer.contact}</Link>
            </nav>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
        a { text-decoration: none; }
        :focus-visible { outline: 3px solid #0a6ed1; outline-offset: 3px; border-radius: 4px; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        .skip-link { position: fixed; top: 0; left: 0; z-index: 9999; padding: 0.75rem 1.5rem; background: #0a6ed1; color: #fff; font-weight: 700; font-size: 0.9rem; border-bottom-right-radius: 8px; transform: translateY(-100%); transition: transform 0.2s ease; text-decoration: none; }
        .skip-link:focus { transform: translateY(0); }
        @media (prefers-reduced-motion: no-preference) { 
          [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 0.55s cubic-bezier(0.23, 1, 0.32, 1), transform 0.55s cubic-bezier(0.23, 1, 0.32, 1); } 
          [data-reveal].revealed { opacity: 1; transform: none; } 
        }
        @media (prefers-reduced-motion: reduce) { [data-reveal] { opacity: 1; transform: none; } }
        
        /* ─── Button press feedback ─── */
        .btn:active { transform: scale(0.97) !important; }
        .btn { transition: transform 0.16s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.16s ease, background 0.18s ease, border-color 0.18s ease; }
      `}</style>

      <style jsx>{`
        :root { 
          --navy: #001e4a; --navy-mid: #00317a; --blue: #0a6ed1; --blue-light: #d6eaff; --accent: #f0a500; 
          --text: #0f1c2e; --muted: #4a6278; --border: rgba(0,0,0,0.09); --surface: #ffffff; --surface-alt: #f4f7fb; 
          --radius: 14px; --shadow: 0 4px 24px rgba(0,30,74,0.10); --shadow-lg: 0 16px 48px rgba(0,30,74,0.16); 
          --font-display: 'Fraunces', Georgia, serif; --font-body: 'Plus Jakarta Sans', system-ui, sans-serif; 
        }
        .landing-wrap { font-family: var(--font-body); color: var(--text); background: var(--surface); overflow-x: hidden; }
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(214,234,255,0.5); backdrop-filter: blur(20px) saturate(2); -webkit-backdrop-filter: blur(20px) saturate(2); border-bottom: 1px solid rgba(10,110,209,0.12); box-shadow: 0 4px 20px rgba(0,30,74,0.06); }
        .nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(1.5rem, 6vw, 5rem); height: 68px; max-width: 1400px; margin: 0 auto; }
        .nav-brand { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; min-height: 44px; padding: 4px 0; }
        .nav-brand-icon { color: var(--blue); font-size: 1.2rem; }
        .nav-brand-text { font-family: var(--font-display); font-weight: 900; font-size: 1.25rem; color: var(--navy); letter-spacing: -0.02em; }
        .nav-links { display: flex; gap: 2rem; list-style: none; }
        .nav-link { text-decoration: none; color: var(--muted); font-weight: 600; font-size: 0.92rem; padding: 0.5rem 0; position: relative; transition: color 0.2s; }
        .nav-link::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--blue); transform: scaleX(0); transform-origin: left; transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); }
        .nav-link:hover { color: var(--blue); }
        .nav-link:hover::after { transform: scaleX(1); }
        .nav-actions { display: flex; align-items: center; gap: 0.75rem; }
        .nav-mobile-toggle { display: none; background: none; border: none; cursor: pointer; color: var(--navy); font-size: 1.25rem; width: 44px; height: 44px; align-items: center; justify-content: center; border-radius: 8px; }
        .nav-mobile-menu { display: none; flex-direction: column; gap: 0.5rem; padding: 1rem clamp(1.5rem, 6vw, 5rem) 1.5rem; border-top: 1px solid var(--border); background: var(--surface); }
        .nav-mobile-menu.open { display: flex; }
        .nav-mobile-link { text-decoration: none; color: var(--muted); font-weight: 600; padding: 0.7rem 0; border-bottom: 1px solid var(--border); font-size: 0.95rem; min-height: 44px; display: flex; align-items: center; }
        .nav-mobile-cta { margin-top: 0.5rem; text-align: center; justify-content: center; }
        .btn { text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.5rem; border-radius: 8px; font-family: var(--font-body); font-weight: 700; font-size: 0.9rem; border: 2px solid transparent; cursor: pointer; transition: transform 0.16s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.16s ease, background 0.18s ease, border-color 0.18s ease; min-height: 44px; white-space: nowrap; }
        .btn:active { transform: scale(0.97); }
        .btn-primary { background: var(--blue); color: #fff; border-color: var(--blue); box-shadow: 0 2px 10px rgba(10,110,209,0.3); }
        .btn-primary:hover { background: #0860b8; border-color: #0860b8; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(10,110,209,0.35); }
        .btn-primary:active { transform: scale(0.97); }
        .btn-ghost { background: transparent; color: var(--muted); border-color: transparent; }
        .btn-ghost:hover { color: var(--navy); background: var(--surface-alt); }
        .btn-outline { background: transparent; color: var(--blue); border-color: var(--blue); }
        .btn-outline:hover { background: var(--blue-light); }
        .btn-white { background: #fff; color: var(--navy); border-color: #fff; }
        .btn-white:hover { background: #f0f4ff; border-color: #f0f4ff; }
        .btn-xl { padding: 0.9rem 2.2rem; font-size: 1.05rem; min-height: 52px; border-radius: 10px; }
        .hero { position: relative; overflow: hidden; display: flex; align-items: center; gap: clamp(2rem, 5vw, 6rem); padding: 5rem clamp(1.5rem, 6vw, 5rem) clamp(4rem, 8vw, 8rem); max-width: 100%; margin: 2rem auto; background: linear-gradient(120deg, #f0f4ff 0%, #0a6ed1 300%); box-shadow: 0 8px 24px rgba(0,30,74,0.2); }
        .hero-mesh { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .mesh-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; }
        .blob-1 { width: 600px; height: 600px; background: radial-gradient(circle, #d6eaff 0%, transparent 70%); top: -200px; right: -100px; }
        .blob-2 { width: 400px; height: 400px; background: radial-gradient(circle, #e8f0fe 0%, transparent 70%); bottom: -100px; left: -50px; }
        .blob-3 { width: 300px; height: 300px; background: radial-gradient(circle, #fef3c7 0%, transparent 70%); top: 100px; left: 30%; }
        .hero-content { flex: 1; position: relative; z-index: 1; }
        .hero-visual { flex: 1.1; position: relative; z-index: 1; }
        .hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--blue-light); border: 1px solid rgba(10,110,209,0.2); padding: 0.4rem 1rem; border-radius: 999px; font-size: 0.82rem; font-weight: 600; color: #004f9f; margin-bottom: 1.5rem; }
        .stars { display: inline-flex; gap: 2px; color: var(--accent); }
        .hero-title { font-family: var(--font-display); font-size: clamp(2.8rem, 5.5vw, 5rem); font-weight: 900; line-height: 1.05; color: var(--navy); letter-spacing: -0.03em; margin-bottom: 1.5rem; }
        .hero-highlight { font-style: italic; color: var(--blue); background: linear-gradient(135deg, #0a6ed1, #004f9f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-subtitle { font-size: clamp(1.05rem, 2vw, 1.25rem); color: var(--muted); line-height: 1.7; margin-bottom: 2.5rem; max-width: 520px; }
        .hero-cta { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
        .hero-microcopy { font-size: 0.82rem; color: var(--muted); }
        .hero-img-wrapper { position: relative; }
        .hero-img { width: 100%; border-radius: var(--radius); box-shadow: var(--shadow-lg); border: 1px solid var(--border); display: block; }
        .hero-float-badge { position: absolute; bottom: -14px; left: 24px; display: flex; align-items: center; gap: 0.4rem; background: white; color: #1a7a4c; padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.82rem; font-weight: 700; box-shadow: 0 4px 16px rgba(0,0,0,0.12); border: 1px solid #d1fae5; }
        .client-logo-wrap { position: relative; overflow: hidden; height: 120px; }
        .client-logo { position: absolute; top: 0; left: 0; display: flex; white-space: nowrap; list-style: none; padding: 0; margin: 0; }
        .client-logo-left { animation: logomoveleft 20s linear infinite; }
        .client-logo-right { transform: translate(-100%, 0); animation: logomoveright 20s linear infinite; }
        .client-logo li { background: #ffffff; border: 1px solid var(--border, rgba(0,0,0,0.08)); border-radius: 10px; height: 80px; width: 200px; display: flex; align-items: center; justify-content: center; margin: 0 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); flex-shrink: 0; gap: 0.8rem; padding: 0 1.2rem; transition: box-shadow 0.2s, transform 0.2s; }
        .client-logo li:hover { box-shadow: 0 8px 24px rgba(0,30,74,0.12); }
        .client-logo img { filter: grayscale(100%) brightness(0%); width: 36px; height: 36px; object-fit: contain; flex-shrink: 0; }
        .client-logo-text { font-family: var(--font-body); font-weight: 600; font-size: 0.9rem; color: #4a6278; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.8; white-space: nowrap; }
        .client-logo-wrap:hover .client-logo { animation-play-state: paused; }
        @keyframes logomoveleft { 0% { transform: translate(0, 0); } 100% { transform: translate(-50%, 0); } }
        @keyframes logomoveright { 0% { transform: translate(-50%, 0); } 100% { transform: translate(0, 0); } }
        .mt-3 { margin-top: 1rem; }
        .trust-bar { background: var(--navy); padding: 2.5rem clamp(1.5rem, 6vw, 5rem); }
        .trust-inner { display: flex; flex-wrap: wrap; justify-content: center; gap: 3rem 5rem; max-width: 1000px; margin: 0 auto; }
        .trust-metric { text-align: center; }
        .trust-value { display: block; font-family: var(--font-display); font-size: 2rem; font-weight: 900; color: #2d3748; letter-spacing: -0.02em; }
        .trust-label { font-size: 0.85rem; color: gray; font-weight: 500; }
        .section { padding: clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 5rem); max-width: 1400px; margin: 0 auto; }
        .section-alt { background: var(--surface-alt); max-width: 100%; padding: clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 5rem); }
        .section-alt > * { max-width: 1400px; margin-left: auto; margin-right: auto; }
        .section-intro { text-align: center; margin-bottom: clamp(2.5rem, 5vw, 4.5rem); }
        .section-eyebrow { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--blue); margin-bottom: 0.75rem; }
        .section-title { font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; color: var(--navy); letter-spacing: -0.025em; line-height: 1.15; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .feature-card { padding: 2.5rem; border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface); transition: transform 0.25s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.25s ease, box-shadow 0.25s ease; }
        .feature-card:hover { transform: translateY(-4px); border-color: rgba(10,110,209,0.3); box-shadow: var(--shadow); }
        .feature-icon-wrap { width: 52px; height: 52px; border-radius: 12px; background: var(--blue-light); display: flex; align-items: center; justify-content: center; color: var(--blue); font-size: 1.4rem; margin-bottom: 1.5rem; }
        .feature-title { font-weight: 700; color: var(--navy); margin-bottom: 0.6rem; font-size: 1.05rem; }
        .feature-desc { color: var(--muted); line-height: 1.65; font-size: 0.93rem; }
        .steps-list { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2.5rem; counter-reset: steps; }
        .step-item { display: flex; flex-direction: column; align-items: flex-start; position: relative; }
        .step-number { font-family: var(--font-display); font-size: 3rem; font-weight: 900; color: var(--blue-light); line-height: 1; margin-bottom: 1rem; -webkit-text-stroke: 2px var(--blue); color: transparent; }
        .step-title { font-weight: 700; color: var(--navy); margin-bottom: 0.5rem; }
        .step-desc { color: var(--muted); font-size: 0.93rem; line-height: 1.65; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .testimonial-card { background: var(--surface); padding: 2.2rem; border-radius: var(--radius); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.25rem; transition: box-shadow 0.2s; }
        .testimonial-card:hover { box-shadow: var(--shadow); }
        .testimonial-stars { color: var(--accent); }
        .testimonial-quote { font-size: 1rem; line-height: 1.7; color: var(--text); font-style: italic; flex: 1; }
        .testimonial-author { display: flex; align-items: center; gap: 0.85rem; }
        .author-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; flex-shrink: 0; }
        .author-info strong { display: block; color: var(--navy); font-size: 0.95rem; }
        .author-info span { color: var(--muted); font-size: 0.83rem; }
        .faq-list { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 0; }
        .faq-item { border-bottom: 1px solid var(--border); }
        .faq-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 1.25rem 0; background: none; border: none; cursor: pointer; text-align: left; font-family: var(--font-body); font-size: 1rem; font-weight: 600; color: var(--navy); gap: 1rem; min-height: 44px; }
        .faq-toggle:hover { color: var(--blue); }
        .faq-chevron { font-size: 0.9rem; color: var(--muted); flex-shrink: 0; transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); }
        .faq-toggle[aria-expanded="true"] .faq-chevron { transform: rotate(180deg); }
        .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.35s cubic-bezier(0.32, 0.72, 0, 1), padding 0.35s cubic-bezier(0.32, 0.72, 0, 1); padding-bottom: 0; }
        .faq-answer.open { max-height: 200px; padding-bottom: 1.25rem; }
        .faq-answer p { color: var(--muted); line-height: 1.7; font-size: 0.95rem; }
        .cta-banner { position: relative; overflow: hidden; background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%); padding: clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 5rem); text-align: center; color: black; margin: 3rem clamp(1rem, 4vw, 3rem); border-radius: 24px; }
        .cta-mesh { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 20% 50%, rgba(10,110,209,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(0,80,180,0.2) 0%, transparent 60%); }
        .cta-inner { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; }
        .cta-eyebrow { color: #4a6278; }
        .cta-title { font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 900; letter-spacing: -0.03em; margin: 0.75rem 0 1.25rem; line-height: 1.1; color: #1e293b; }
        .cta-subtitle { font-size: 1.1rem; opacity: 0.8; margin-bottom: 2.5rem; line-height: 1.6; }
        .cta-actions { margin-bottom: 1.25rem; }
        .cta-btn { background: #0a6ed1; color: #fff; border-color: #0a6ed1; font-size: 1.2rem; padding: 1rem 2.8rem; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.15); }
        .cta-btn:hover { background: #0860a0; border-color: var(--blue); transform: translateY(-1px); box-shadow: 0 14px 36px rgba(10, 110, 209, 0.2); transition: all 0.2s ease; }
        .cta-microcopy { font-size: 0.82rem; opacity: 0.55; }
        .footer { border-top: 1px solid var(--border); padding: 2.5rem clamp(1.5rem, 6vw, 5rem); }
        .footer-inner { display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto; flex-wrap: wrap; gap: 1.5rem; }
        .footer-brand .nav-brand-text { font-size: 1.1rem; }
        .footer-copy { font-size: 0.82rem; color: var(--muted); margin-top: 0.3rem; }
        .footer-nav { display: flex; gap: 2rem; flex-wrap: wrap; }
        .footer-nav a { color: var(--muted); text-decoration: none; font-size: 0.88rem; font-weight: 500; min-height: 44px; display: flex; align-items: center; transition: color 0.18s; }
        .footer-nav a:hover { color: var(--blue); }
        @media (max-width: 900px) { .nav-links { display: none; } .nav-actions { display: none; } .nav-mobile-toggle { display: flex; } .hero { flex-direction: column; text-align: center; } .hero-cta { justify-content: center; } .hero-subtitle { margin: 0 auto 2.5rem; } .hero-float-badge { left: 50%; transform: translateX(-50%); bottom: -18px; } .steps-list { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; } }
        @media (max-width: 600px) { .cta-banner { margin: 1.5rem 1rem; border-radius: 16px; } .trust-inner { gap: 2rem 3rem; } .footer-inner { flex-direction: column; text-align: center; } .footer-nav { justify-content: center; } }
        @media (forced-colors: active) { .btn-primary { forced-color-adjust: none; } .hero-highlight { -webkit-text-fill-color: revert; background: none; color: Highlight; } }
      `}</style>
    </>
  )
}