# Financial Architecture

## High‑Level Design
BookFlow’s financial module implements **double‑entry accounting**, where every transaction is recorded as a balanced journal entry. It follows the **event‑driven model** to decouple operational events (booking, procurement) from financial recording.

## Core Concepts
- **Chart of Accounts (COA)**: Hierarchical, multi‑segment (e.g., `ASSETS.CURRENT.BANK`).
- **Journal**: A header with multiple detail lines; each line has an account, debit, credit, and description.
- **Posting Engine**: Converts journal details into **General Ledger entries** (permanent, immutable).
- **Fiscal Periods**: Time‑bound windows that must be open for posting.
- **Reference Sequence**: Automatic sequential numbering (e.g., `INV-2026-0001`).

## Architectural Decisions
- **Single DB, per‑tenant isolation via Prisma multi‑schema or row‑level filtering** (we use row‑level with `tenantId`).
- **Immutable audit trail**: `FinancialAuditTrail` records every mutation; deletes are prohibited.
- **Engine separation**: Posting, validation, sequencing, and reporting are independent services behind a unified API layer.
- **API routing**: All financial endpoints under `/api/financial/*`, using Next.js API routes with `withAuth` and `withMetrics` wrappers.

## Technology Stack
- Next.js / TypeScript
- Prisma ORM with PostgreSQL
- Existing auth and session middleware
- React with existing component library for UI

## Integration Points
- Booking → journal entry creation (income)
- Procurement → journal entries for expenses
- AI Assistant → queries over financial data (read‑only)
- External ERPs → connectors via GitHub repo model