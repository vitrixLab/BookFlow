# BookFlow Financial Domain – Project Overview

## Objective

Extend BookFlow from a pure booking system into a double‑entry accounting platform that adheres to the **GS2026 financial framework**.  

The module will provide:

- Chart of Accounts (hierarchical, multi‑segment)

- Journal entries with automatic double‑entry validation

- General Ledger with real‑time posting

- Financial reports (trial balance, P&L, balance sheet)

- Audit trail and period closing

## Key Principles

- **Event‑driven architecture** – Booking, procurement, and manual entries all flow through the journal.

- **Immutable audit trail** – No deletes, only soft‑voids with full traceability.

- **Multi‑tenant isolation** – Each business gets its own chart of accounts and fiscal periods.

- **GS2026 compliance** – Chart segments, tax codes, and reporting templates follow the standard.

## Technology

- **Backend:** Next.js API routes + Prisma + PostgreSQL

- **Frontend:** React (existing BookFlow stack) with new financial components

- **Testing:** Jest + React Testing Library + Cypress

## Current State (from branch `AntiGravity`)

- The database currently contains only the core booking system tables `User`, `Service`, `BookedAppointment`, `SmsLog`, `LoginTrace`).

- Financial models, migrations, and API stubs **have not been built yet**.

- A few placeholder front‑end files exist, but they are non‑functional.

- All financial implementation work must be done from scratch according to the specs in this workspace.

## Implementation Status (Snapshot)

> Full details: `76_STATUS.md`](./76_[STATUS.md](http://STATUS.md))

**Overall Progress** ██████░░░░░░░░░░  ~15%

| Milestone | Status | Progress |

|-----------|--------|----------|

| M1 – Data Foundation | 🟨 In progress | 80% |

| M2 – Core Engines | ⬜ Planned | 0% |

| M3 – API & Audit | ⬜ Planned | 0% |

| M4 – Reporting & Periods | ⬜ Planned | 0% |

| M5 – Front‑end Workspaces | ⬜ Planned | 0% |

| M6 – Integrations & Connectors | ⬜ Planned | 0% |

**Next Action:** Complete seed data for M1, verify in Prisma Studio, then start M2 with Cursor.