# Implementation Roadmap

## Milestone 1: Data Foundation (M1)
**Goal:** Get the database schema correct and seeded.
- Complete all Prisma models (ChartOfAccount, FiscalPeriod, TaxCode, JournalHeader, etc.)
- Run migrations
- Seed with a sample chart of accounts, fiscal periods, and tax codes
- Verify model relationships in Prisma Studio

## Milestone 2: Posting & Validation Engine (M2)
**Goal:** Core journal entry logic.
- Posting Engine: convert JournalHeader → GeneralLedgerEntry in an atomic transaction.
- Validation Engine: ensure debits = credits, period open, accounts exist.
- Sequence Engine: generate unique sequential reference numbers.
- Unit tests for all three engines.

## Milestone 3: API Layer & Audit (M3)
**Goal:** Full CRUD for journals, ledger queries, and audit logging.
- Journal API (create, list, void)
- Ledger API (by account, by period, trial balance)
- Audit Engine: log all mutations to FinancialAuditTrail.
- Role‑based access (admin, accountant, viewer).

## Milestone 4: Reporting Engine & Period Closing (M4)
**Goal:** Generate financial statements and manage fiscal periods.
- Report Engine: trial balance, P&L, balance sheet using GL entries.
- Period Closing: close a fiscal period, prevent new entries, generate closing entries.
- Integration with the existing notification system for period‑end alerts.

## Milestone 5: Front‑end Workspaces (M5)
**Goal:** User interfaces for financial operations.
- Chart of Accounts management (tree view, CRUD)
- Journal workspace (entry form, line items, auto‑balancing)
- Ledger viewer (filtering, drill‑down)
- Reporting dashboard
- Responsive layout matching existing BookFlow design system.

## Milestone 6: Integrations & Connector Strategy (M6)
**Goal:** Connect booking/procurement to the financial module.
- Booking mapping: automatically create journal entries when an appointment is paid.
- Procurement mapping: map purchase orders to expense accounts.
- AI Assistant: extend the chatbot to answer financial queries.
- Connector strategy: define how external ERPs can sync via the GitHub repo model.

Each milestone has a dedicated Cursor prompt in `prompts/cursor/`.