# BookFlow Web-app

![BookFlow Logo](public/image/bookflow_primary_logo_v1.png)

[![Netlify Status](https://api.netlify.com/api/v1/badges/7bf84689-2051-48b2-97a0-7d591e079b39/deploy-status)](https://app.netlify.com/projects/bookfly-app/deploys)

This repository houses **BookFlow**, a full-stack appointment scheduling SaaS platform built to simulate a **Timely / Fresha‑like** booking experience. The primary goal of the project is to demonstrate the ability to **rescue, stabilise, modernise, and extend a legacy booking system** while implementing forward‑thinking architectural decisions.

---

### 1. What the Repository Does

BookFlow is a multi-role booking and workflow management platform that allows businesses to manage appointments, staff, clients, and services. The platform serves **three distinct user roles**: Admins, Employees, and Clients, each with their own dashboard.

| Role | Description |
|------|-------------|
| **Admin** | Command centre with KPI cards, overdue alerts, user & appointment management, pricing enforcement |
| **Employee** | Daily appointment view, SMS overview, create bookings, view details |
| **Client** | Service discovery, one-click booking, booking history |

The project is a **personal portfolio piece** created by **Jason S. Daño**, designed to showcase senior full-stack development capabilities — specifically system rescue, stabilisation, and legacy modernisation.

---

### 2. Complete Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (Pages Router), React, TypeScript |
| **Backend** | Next.js API routes (serverless functions) |
| **AI / NLP** | NVIDIA Llama 3.1‑8B (free tier), RAG retrieval |
| **Knowledge Base** | Custom binary index (`knowledge.bin`), in‑memory TF‑IDF search |
| **Database** | PostgreSQL 15 (Docker) |
| **ORM** | Prisma 5 |
| **Authentication** | iron‑session v7 |
| **Styling** | CSS Modules + global CSS (SAP Fiori design) |
| **Package Manager** | pnpm |
| **Background Jobs** | Netlify Functions (serverless) / Node.js + ts‑node |
| **Caching** | In‑memory session‑based cache |
| **CI/CD** | GitHub Actions |
| **Language Distribution** | TypeScript 95.8%, CSS 3.1%, Other 1.1% |

---

### 3. Project Structure & Code Organisation

The code is organised into a clean, modular structure:

```
stabilisation-demo/
├── components/           # Reusable UI components + layout shell
├── lib/                  # Core business logic & utilities
│   ├── db.ts             # Prisma client singleton
│   ├── session.ts        # iron‑session configuration
│   ├── withAuth.ts       # Auth wrappers for API and SSR
│   ├── formatDate.ts     # Shared date‑formatting utility
│   ├── notifications.tsx # Global notification context
│   ├── bloom.ts          # In‑memory Bloom filter (email + appointment ID)
│   ├── planLimits.ts     # Subscription plan limit enforcement
│   ├── knowledge.ts      # Binary knowledge loader & search
│   ├── chatbotQueries.ts # Intent‑based live DB query handler
│   ├── chatbotCache.ts   # Login‑time per‑role cache builder
│   └── rateLimit.ts      # API rate limiter
├── pages/                # Next.js Pages Router (page components + API routes)
│   ├── api/auth/         # Login, logout, register endpoints
│   ├── api/chatbot.ts    # NVIDIA‑powered assistant endpoint
│   ├── admin/            # Admin CRUD dashboards
│   ├── employee/         # Employee panel
│   └── client/           # Client booking + history
├── prisma/               # Database schema + migrations + seed data
├── scripts/              # build-knowledge-bin.js
├── netlify/functions/    # Serverless background worker
├── public/               # Static assets + knowledge.bin
├── styles/globals.css    # Global SAP Fiori + glass‑morphism theme
├── landing.json          # Landing page label configuration
├── pricing.json          # Tier plan configuration
├── site.json             # Admin/Employee/Client dashboard label catalogue
└── chat.json             # Chatbot widget labels + system prompt
```


---

### 4. Key Features & Implementation Details

#### 4.1 Authentication & Authorisation
- **iron‑session v7** provides signed, encrypted cookie‑based sessions.
- **bcrypt** password hashing for secure credential storage.
- Role‑based access control (Admin, Employee, Client) enforced via `withAuth` wrappers on both API routes and SSR pages.
- Session hardening with `httpOnly`, `sameSite`, and `secure` cookie flags.

#### 4.2 Admin Dashboard
- Real‑time KPI cards (users, appointments, revenue).
- Overdue appointment alerts.
- Weekly booking chart.
- Full CRUD for users, services, and appointments via modal‑based inline forms.

#### 4.3 Employee Panel
- Daily appointment view.
- SMS overview for client communication.
- Create new bookings on behalf of clients.
- Detail modal for viewing appointment information.

#### 4.4 Client Experience
- Service discovery with one‑click booking.
- Booking history with date‑fns formatted dates.
- Soft‑gated pricing page on first registration (admins/employees skip).

#### 4.5 Pricing & Subscription System
- **Four tiers**: Solo (free), Studio ($29/mo), Business ($59/mo), Enterprise (custom).
- Annual billing toggle with 20% savings.
- Visual highlight on the recommended plan with gold‑accent card and crown badge.
- Plan limits enforced via `planLimits.ts`.
- Plan‑change API with FAQ.

#### 4.6 SMS Retry Background Job
- Demonstrates retry logic with **exponential backoff**.
- Migrated to **Netlify Functions** for serverless execution.

#### 4.7 Bloom Filter Optimisation
- In‑memory Bloom filter for **O(1) probabilistic lookup** on email uniqueness and appointment ID validation.
- Pre‑check layer before hitting PostgreSQL — if filter says "definitely not present", skip the DB entirely.
- Phased roadmap: in‑memory prototype → Redis‑backed → production monitoring.

---

### 5. AI Assistant — The Chatbot System

The AI assistant is one of the most sophisticated features. It combines multiple retrieval strategies:

| Component | File | Purpose |
|-----------|------|---------|
| **knowledge.ts** | `lib/knowledge.ts` | Loads binary knowledge base (`knowledge.bin`), performs in‑memory TF‑IDF search across project documentation |
| **chatbotQueries.ts** | `lib/chatbotQueries.ts` | Intent‑based live database query handler using "What‑Where‑When‑Who‑How" algorithm |
| **chatbotCache.ts** | `lib/chatbotCache.ts` | Login‑time cache builder — pre‑fetches per‑role stats (users, appointments, clients) for instant answers |
| **chatbot.ts** (API) | `pages/api/chatbot.ts` | NVIDIA Llama 3.1‑8B powered endpoint with RAG retrieval |
| **build-knowledge-bin.js** | `scripts/build-knowledge-bin.js` | Builds binary knowledge base from project docs |
| **chat.json** | `chat.json` | Chatbot widget labels and system prompt configuration |

**How the chatbot works**:
1. A custom `scripts/build-knowledge-bin.js` scripts compiles documentation into a binary knowledge file.
2. On login, a per‑role cache (`chatbotCache.ts`) is built — admin sees different pre‑fetched statistics than employees or clients.
3. When a user asks a question:
   - The system determines if the query is about **documentation** (answered via binary knowledge base) or **live data** (answered via prisma queries through `chatbotQueries.ts`).
   - An **intent‑based "What‑Where‑When‑Who‑How" algorithm** parses the question structure to identify what data to retrieve.
   - Role‑scoped: Admins get full data access, employees see their assignments, clients only see their own bookings.
4. The NVIDIA Llama 3.1‑8B model (free tier) provides the natural language generation layer.

---

### 6. Database Design

The Prisma schema defines the core data model:

- **User** — authentication, roles (ADMIN, EMPLOYEE, CLIENT), plan limits
- **Service** — bookable services with pricing and duration
- **BookedAppointment** — bookings with status tracking
- **SmsLog** — SMS notification records
- **LoginTrace** — login audit trail

Migration management through `prisma migrate deploy` with a seed script (`prisma/seed.ts`) that generates 12 sample appointments, demo users, and services.

---

### 7. Security Implementation

Multiple security layers are implemented:

- **CSRF tokens**: double‑submit cookie pattern planned.
- **Rate limiting**: on auth and chatbot endpoints (via `rateLimit.ts`).
- **Zod validation**: input sanitisation across all API routes.
- **bcrypt**: passwords never stored in plain text.
- **Session hardening**: `httpOnly`, `sameSite`, `secure` cookie flags.

---

### 8. Design System

- **Glass‑morphism** topbar with a **navy sidebar**.
- **Two‑column fixed + fluid layout**.
- CSS custom properties (`:root`) for all colours, spacing, and typography — governed by `DESIGN.md`.
- **SAP Fiori influence**: professional enterprise‑grade aesthetics.
- **Mobile‑ready**: sidebar drawer for responsive views.

Key design tokens:

| Token | Value |
|-------|-------|
| `--sidebar-w` | 220px |
| `--topbar-h` | 64px |
| `--bg-sidebar` | #001e4a |

---

### 9. Development & Deployment

**Local setup**:
```bash
git clone
pnpm install
docker run --name stabilisation-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=stabilisation -p 5432:5432 -d postgres:15
pnpm prisma migrate deploy && pnpm prisma db seed
pnpm dev
```


**CI/CD**: GitHub Actions workflow skeleton, ready for Vercel / Netlify deployment.

---

### 10. Phasing & Development History

The project progressed through structured phases with **~81 total commits**:

| Phase | Status | Key Achievements |
|-------|--------|-----------------|
| **Phase 1** | ✅ Complete | Core SaaS — auth, dashboards, CRUD, pricing, Bloom filter, Docker, CI/CD |
| **Phase 1‑A‑b** | ✅ Complete | AI assistant, security hardening, serverless migration, login cache, chatbot UI widget |

Detailed phase reports are maintained in the repository:
- `Phase-1-Completion-Report-BookFlow.md`
- `Phase-1-A-b-Report.md`


---

### 11. Strengths & Innovations

1. **Multi‑role architecture** — clean separation of Admin, Employee, and Client concerns
2. **AI‑augmented assistant** — combines binary knowledge retrieval with live database queries via intent parsing
3. **Bloom filter pre‑check** — demonstrates scalable, probabilistic optimisation for high‑traffic scenarios
4. **Pricing soft‑gate** — elegant UX for plan enforcement without friction
5. **Serverless background jobs** — Netlify Functions integration for SMS retry logic with exponential backoff
6. **Comprehensive documentation** — DESIGN.md, PRICING_RESEARCH.md, DATABASE_OPTIMIZATION.md, plus phase reports

---

### 12. Planned Improvements

A detailed roadmap is outlined for future sprints:

- Deploy to staging (Vercel + Neon/Supabase)
- Real SMS provider integration (Twilio / AWS SNS)
- ETL pipeline (CSV import/export)
- Background job queue (BullMQ + Redis)
- Full test suite (Jest + Playwright)
- Redis‑backed Bloom filter
- Structured logging (Winston/Pino)
- Multi‑language support for the AI assistant
- Dark mode for dashboard and chat widget


---

### 13. Summary

BookFlow is a **professionally architected, feature‑rich SaaS booking platform** built as a portfolio demonstration of senior‑level full‑stack development. It goes beyond a typical demo by incorporating:

- **Production‑grade patterns** (Bloom filters, rate limiting, bcrypt, CSRF tokens)
- **AI integration** (NVIDIA LLM with RAG retrieval and live DB querying)
- **Modern tooling** (Next.js 14, TypeScript, Prisma 5, pnpm, Docker)
- **Design maturity** (glass‑morphism, SAP Fiori, responsive layout)
- **Scalability awareness** (documented database optimisation roadmap)

Built BookFlow, a full‑stack appointment scheduling SaaS that merges a modern Next.js/TypeScript stack with enterprise‑grade security, AI‑driven assistance, and scalable data optimisations. Designed from the ground up for maintainability and future growth — a direct demonstration of how to rescue and modernise legacy booking systems for a consulting engagement.