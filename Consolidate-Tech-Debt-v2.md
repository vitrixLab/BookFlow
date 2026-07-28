We’ll consolidate the tech debt from the full‑stack audit into a single, actionable list categorised by **Frontend (FE)**, **Backend (BE)**, **Database (DB)**, and **Security (SEC)**. Each item includes its priority level and a short rationale so you can tackle them sprint by sprint.

---

### 🔴 Critical (Now)

| Priority | Category | Tech Debt | Rationale |
|----------|----------|-----------|-----------|
| 🔴 | SEC | Missing security headers (CSP, HSTS, X‑Frame‑Options, X‑Content‑Type‑Options, Referrer‑Policy) | No protection against clickjacking, MIME sniffing, or content injection. Add via `_headers` or `netlify.toml`.
| 🔴 | FE | Logo carousel duplicates 14 logos 4 times in DOM | Causes performance bloat, layout jank, and looks unprofessional. Fix by duplicating only once or using CSS animation.
| 🔴 | FE | Add `lang="en"` to `<html>` | Missing language declaration fails WCAG 2.1 level A and hurts accessibility/SEO.
| 🔴 | FE | Add `robots.txt` and `sitemap.xml` | Search engines can’t crawl the site properly; critical for SEO.
| 🔴 | SEC | Remove or wire social login buttons (Google, Facebook, Microsoft) | Non‑functional buttons mislead users and damage trust. Implement Google OAuth (already partially done) and hide others.
| 🔴 | BE/SEC | Apply rate‑limiting to all auth and sensitive endpoints | Prevents brute‑force attacks and API abuse. The `withRateLimit` wrapper is ready – just apply it to login, register, and chatbot.

---

### 🟡 High (Next Sprint)

| Priority | Category | Tech Debt | Rationale |
|----------|----------|-----------|-----------|
| 🟡 | FE/UX | Optimise font loading: `font-display: swap` and preload woff2 | Blocking Google Fonts delays LCP by ~800ms. Swapping yields faster perceived load.
| 🟡 | FE | Replace Font Awesome with a lighter icon set (or at least subset) | Full Font Awesome blocks rendering and adds ~100KB unused icons. Use SVG sprites or individually imported icons.
| 🟡 | FE | Implement `next/dynamic` for heavy dashboard components | Reduces initial JS bundle and Total Blocking Time (TBT) for faster interactivity.
| 🟡 | BE/DB | Add `npx prisma migrate deploy` to Netlify build command | Ensures database schema stays in sync with code; currently missing from build pipeline.
| 🟡 | SEC | Complete CSRF protection on all state‑changing endpoints | Mitigates cross‑site request forgery; only partially implemented.
| 🟡 | FE/SEO | Add Open Graph / Twitter Card meta tags | Improves link previews and social‑share appearance.
| 🟡 | BE | Replace `console.error` with structured logging (Winston/Pino) | Debug logs in production leak information; structured logs are easier to monitor.

---

### 🟢 Medium (This Month)

| Priority | Category | Tech Debt | Rationale |
|----------|----------|-----------|-----------|
| 🟢 | FE | Add structured data (JSON‑LD `SoftwareApplication` schema) | Enhances search results with rich snippets, improving SEO.
| 🟢 | UX/FE | Add “Skip” option on pricing page / simplify onboarding | New clients forced to see pricing before using the product – increases drop‑off. A “Try Free” skip button would boost conversion.
| 🟢 | BE | Integrate Sentry or Logflare for error & performance monitoring | No production monitoring means crashes go unnoticed. Critical for reliability.
| 🟢 | FE | Fix inconsistent typography – ensure Fraunces/Plus Jakarta Sans fallback is consistent across dashboards | Some dashboard areas use system fonts instead of the intended display fonts, weakening visual hierarchy.
| 🟢 | DB | Add missing indexes on frequently queried columns (appointment `datetime`, user `role`, etc.) | Can speed up common queries by 10x; low effort, high impact.
| 🟢 | SEC | Vet SOC 2 claim – either remove or link to verifiable trust badge | Unverified security claims can damage reputation and violate compliance.

---

### 🔵 Low (Future)

| Priority | Category | Tech Debt | Rationale |
|----------|----------|-----------|-----------|
| 🔵 | FE | Replace `<img>` with `next/image` where possible | Better performance (lazy loading, auto‑optimisation).
| 🔵 | FE | Add dark mode for dashboards | Increasing user demand; no structural changes required.
| 🔵 | BE/DB | Migrate background jobs to a proper queue (BullMQ + Redis) if volume grows | Current Netlify scheduled functions work for low volume, but not scalable.
| 🔵 | FE | A/B test new landing page hero copy | Incremental CRO improvements.
| 🔵 | SEC | Periodic third‑party penetration test | Validates security posture as the app matures.

---

### Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| **FE** | 4 | 4 | 3 | 3 |
| **BE** | 1 | 2 | 1 | 1 |
| **DB** | 0 | 0 | 1 | 0 |
| **SEC** | 3 | 1 | 1 | 1 |

Start with the **Critical** items (mostly security and trust/first‑impression fixes). Then move to **High** for performance and UX polish. The table above can be directly pasted into your project board or roadmap.