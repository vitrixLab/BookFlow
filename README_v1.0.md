# Booking & Workflow SaaS – Stabilisation Demo

A full-stack booking platform built to demonstrate stabilisation skills:
fixing, upgrading, and extending legacy systems.

This project simulates a **Timely / Fresha-like** appointment scheduling SaaS
with role-based dashboards, background job processing, and a polished UI.

> Built for a Senior Full Stack Developer application to showcase the ability
> to rescue and modernise messy codebases.

---

## 🚀 Live Demo (Local)

The application runs locally with Docker + pnpm.
No production deployment yet — ready for staging.

---

## ✨ Features

* 🔐 **Session-based authentication** with role-based access (Admin, Employee, Client)
* 🧑‍💼 **Admin panel** — manage users, services, monitor system stats
* 👩‍🔧 **Employee panel** — view appointments, create bookings, see SMS reminders
* 🧑‍🦱 **Client panel** — discover services, book appointments, view booking history
* 📱 **SMS retry background job** — retry logic with exponential backoff
* 🎨 **Unified SAP Fiori / Glass UI** — clean, responsive design
* 🗃️ **PostgreSQL + Prisma ORM** — migrations and seeding
* ⚙️ **CI/CD ready** — GitHub Actions skeleton included

---

## 🛠️ Tech Stack

| Layer           | Technology                                   |
| --------------- | -------------------------------------------- |
| Frontend        | Next.js 14 (Pages Router), React, TypeScript |
| Backend         | Next.js API routes                           |
| Database        | PostgreSQL 15 (Docker)                       |
| ORM             | Prisma 5                                     |
| Auth            | iron-session v7                              |
| Styling         | CSS Modules + global CSS                     |
| Package Manager | pnpm                                         |
| Background Jobs | Node.js + ts-node                            |
| CI/CD           | GitHub Actions                               |

---

## 📁 Project Structure

```text
stabilisation-demo/
├── components/               # Reusable UI (DashboardLayout, etc.)
├── lib/                      # Utilities (db, session, auth wrappers)
├── pages/                    # Next.js pages & API routes
│   ├── api/                  # REST endpoints
│   ├── admin/                # Admin dashboard pages
│   ├── employee/             # Employee dashboard pages
│   └── client/               # Client dashboard pages
├── prisma/                   # Schema, migrations, seed data
├── src/background-jobs/      # SMS retry worker
├── styles/                   # Global CSS (SAP + glass theme)
├── site.json                 # UI label catalogue (i18n‑ready)
└── config files
```

---

## 🏁 Getting Started

### Prerequisites

* Node.js 18+
* pnpm
* Docker

### Installation

```bash
git clone <repo-url>
cd stabilisation-demo
pnpm install
```

### Start PostgreSQL

```bash
docker run --name stabilisation-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=stabilisation \
  -p 5432:5432 \
  -d postgres:15
```

### Environment Setup

Create `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stabilisation?schema=public"
SESSION_PASSWORD="a-very-secure-random-string-at-least-32-chars"
```

### Run Migrations & Seed

```bash
pnpm prisma migrate deploy
pnpm prisma db seed
```

### Start Development Server

```bash
pnpm dev
```

Visit: http://localhost:3000

### Run Background Worker

```bash
pnpm worker
```

---

## 🧪 Demo Credentials

| Role     | Email                                                           | Password |
| -------- | --------------------------------------------------------------- | -------- |
| Admin    | [admin@booking.com](mailto:admin@booking.com)                   | admin123 |
| Employee | [emma.johnson@booking.com](mailto:emma.johnson@booking.com)     | demo123  |
| Employee | [michael.chen@booking.com](mailto:michael.chen@booking.com)     | demo123  |
| Employee | [sarah.williams@booking.com](mailto:sarah.williams@booking.com) | demo123  |
| Client   | [client1@example.com](mailto:client1@example.com)               | demo123  |
| Client   | [sarah@example.com](mailto:sarah@example.com)                   | demo123  |
| Client   | [mike@example.com](mailto:mike@example.com)                     | demo123  |
| Client   | [lisa@example.com](mailto:lisa@example.com)                     | demo123  |

---

## 📖 API Overview

| Method | Endpoint                 | Purpose             |
| ------ | ------------------------ | ------------------- |
| POST   | /api/auth/login          | User login          |
| POST   | /api/auth/logout         | Destroy session     |
| POST   | /api/auth/register       | Client registration |
| GET    | /api/admin/users         | List users          |
| POST   | /api/admin/users         | Create user         |
| PUT    | /api/admin/users/[id]    | Update user         |
| DELETE | /api/admin/users/[id]    | Delete user         |
| GET    | /api/admin/services      | List services       |
| POST   | /api/admin/services      | Create service      |
| PUT    | /api/admin/services/[id] | Update service      |
| DELETE | /api/admin/services/[id] | Delete service      |
| POST   | /api/appointments        | Book appointment    |

---

## 🧩 Upcoming Improvements

* [ ] Deploy to staging (Vercel + Neon/Supabase)
* [ ] Integrate real SMS provider (Twilio / AWS SNS)
* [ ] CSV import/export (ETL example)
* [ ] Appointment cancellation & reschedule
* [ ] Password hashing (bcrypt)
* [ ] Queue system (BullMQ + Redis)
* [ ] Full test suite (Jest + Playwright)

---

## 📄 License

Private portfolio project. All rights reserved.

---

## 🙋‍♂️ Author

**Jason S. Daño**
Senior Full Stack Developer — system rescue, stabilisation, and legacy modernisation

> "The best code isn’t the one you write from scratch — it’s the one you bring back to life."
