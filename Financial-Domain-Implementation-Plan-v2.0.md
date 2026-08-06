# BookFlow Financial Domain — Implementation Plan v2.0

**Status:** Draft  
**Date:** 2026-08-06  
**Scope:** GS2026-aligned Financial Domain for BookFlow Enterprise Business Operations Platform  
**Supersedes:** Implementation Plan v1.0 (backend-heavy, ~85% backend / 15% UI)

---

## 1. Why v2.0

Implementation Plan v1.0 treated the Financial Domain as a backend-first subsystem with UI deferred to late milestones. That split is misaligned with BookFlow's evolution into an **Enterprise Business Operations Platform**.

Accountants, finance managers, auditors, and operational users do not experience schemas or posting engines—they experience screens, workflows, and feedback loops. A financial domain that is technically correct but unusable fails in production regardless of ledger integrity.

**v2.0 principle:** Every milestone ships **backend capability and its corresponding UI experience together**. Target balance: **~50% backend / 50% UI** across the full roadmap.

| Dimension | v1.0 | v2.0 |
| --- | --- | --- |
| Delivery model | Backend milestones → UI polish pass | Paired backend + UX per milestone |
| Navigation | Assumed admin sidebar extension | First-class Financial workspace with sub-nav |
| Validation | Server-side only | Real-time inline + server reconciliation |
| AI | Separate chatbot endpoint | Embedded Financial Assistant with deep links |
| Mobile | Not planned | Approval, dashboard, notifications |
| Design system | Ad hoc page styling | Shared financial component library |

---

## 2. Alignment with Existing BookFlow Architecture

The Financial module must feel native—not bolted on.

| Existing asset | Financial reuse |
| --- | --- |
| `components/DashboardLayout.tsx` | Top-level app shell; add Financial nav group |
| `schema/components.json` | i18n-ready labels for all financial screens |
| `design.md` tokens (`--sap-primary`, cards, tables) | Financial screens inherit tokens; extend with status/workflow tokens |
| `components/settings/BucketLayout.tsx` | **Financial sub-navigation** (Master Data, Journals, Ledger, Reports) |
| `pages/admin/procurement/*` | Reference for list → detail → form CRUD patterns |
| `components/admin/ObservatoryPanel.tsx` | Pattern for KPI cards on Financial Dashboard |
| `lib/withAuth.ts` / role guards | Extend with financial role matrix |
| AI Assistant (`/admin/ai-assistant`) | Extend with financial intent routing + deep links |
| Skeleton loaders (`components/skeleton/`) | Per-screen loading states for all financial routes |

### Proposed route structure

```text
pages/admin/financial/
├── dashboard.tsx
├── master-data/
│   ├── chart-of-accounts.tsx
│   ├── fiscal-periods.tsx
│   ├── tax-codes.tsx
│   ├── cost-centers.tsx
│   ├── departments.tsx
│   └── reference-series.tsx
├── journals/
│   ├── index.tsx              # type selector / redirect
│   ├── sales.tsx
│   ├── purchase.tsx
│   ├── cash-receipt.tsx
│   ├── cash-disbursement.tsx
│   ├── general.tsx
│   ├── pending-posting.tsx
│   └── [id].tsx               # journal entry screen
├── ledger/
│   ├── general.tsx
│   ├── subsidiary.tsx
│   └── inquiry.tsx
├── reports/
│   ├── trial-balance.tsx
│   ├── balance-sheet.tsx
│   ├── income-statement.tsx
│   ├── cash-flow.tsx
│   └── analytics.tsx
├── period-closing.tsx
└── audit-trail.tsx

pages/api/financial/[...path].ts   # BFF proxy (mirrors procurement pattern)
components/financial/                # shared financial UI library
lib/financialApi.ts                  # typed client (mirrors procurementApi)
```

---

## 3. Component Overview

Six components. Each lists **backend** and **UI** deliverables that ship in the same milestone.

---

### Component 1: Domain Foundation & Master Data

**Backend**

- Prisma models: `ChartOfAccount`, `FiscalPeriod`, `TaxCode`, `CostCenter`, `Department`, `ReferenceSeries`
- Hierarchical CoA with parent/child, posting restrictions, active/inactive flags
- Fiscal period open/close/lock states
- Reference series auto-numbering per journal type (e.g. `SJ-2026-00001`)
- REST/tRPC endpoints with Zod validation
- Seed data for demo CoA (Assets → Expenses hierarchy)

**UI (ships with backend)**

- Financial workspace shell: `FinancialLayout` extending `BucketLayout`
- Chart of Accounts tree view (expand/collapse, search, active toggle)
- Master data CRUD screens for Fiscal Periods, Tax Codes, Cost Centers, Departments, Reference Series
- Inline validation badges; keyboard-navigable forms
- Role-gated edit vs read-only views

**Exit criteria:** Accountant can configure CoA and fiscal calendar entirely through UI; no direct DB access required.

---

### Component 2: Journal Engine & Posting Workflow

**Backend**

- Models: `Journal`, `JournalLine`, `JournalStatus` enum (`DRAFT → VALIDATED → APPROVED → POSTED → LOCKED`)
- Double-entry validation (debits = credits, account posting rules, period open check)
- Journal types: Sales, Purchase, Cash Receipt, Cash Disbursement, General
- Bulk post / bulk approve operations
- Tax calculation hooks on line items
- Audit event emission on every state transition

**UI (ships with backend)**

- Journal list per type: filters (date, status, account, user), sort, export, bulk actions
- Journal entry screen:
  - Header: Reference No, Posting Date, Journal Type, Fiscal Period, Status, Description
  - Line grid: Account, Description, Debit, Credit, Cost Center, Department, Project, Tax Code
  - Footer: Debit/Credit totals, difference, validation status, auto-balance indicator
- Keyboard shortcuts (Tab/Enter line navigation, Ctrl+S save, Ctrl+P post)
- Account autocomplete with usage hints
- Posting workflow stepper with color, icon, user, timestamp per state
- Slide-over detail panel for quick review without leaving list

**Exit criteria:** Full journal lifecycle manageable from UI; posting failures surface inline with actionable messages.

---

### Component 3: General Ledger & Subsidiary Ledger

**Backend**

- `LedgerEntry` materialized on post (immutable after lock)
- Running balance computation per account per period
- Subsidiary ledger views (AR, AP, Cash) derived from account type mapping
- Account inquiry API with drill-down to source journal
- Opening/closing balance snapshots per fiscal period

**UI (ships with backend)**

- General Ledger inquiry: account selector, period filter, running balance column
- Drill-down from ledger line → journal entry screen (read-only if locked)
- Subsidiary Ledger views with same interaction model
- Export (CSV/Excel) from list toolbar

**Exit criteria:** Accountant can trace any balance to its originating journal from the UI.

---

### Component 4: Financial Reporting

**Backend**

- Report engines: Trial Balance, Balance Sheet, Income Statement, Cash Flow
- Multi-dimensional filters: company, branch, cost center, fiscal period
- Balanced/unbalanced detection for Trial Balance
- PDF and Excel export pipelines
- Report snapshot caching for closed periods

**UI (ships with backend)**

- Interactive Trial Balance with 🟢 Balanced / 🔴 Out of Balance indicators
- Report filter bar (shared component): period, company, branch, cost center
- Drill-down from report row → ledger inquiry → journal
- Print-ready layouts; export buttons in consistent toolbar position
- Financial Analytics dashboard widgets (trend charts, period comparison)

**Exit criteria:** Finance Manager can run month-end Trial Balance and drill to supporting entries without leaving BookFlow.

---

### Component 5: Period Closing, Audit Trail & Integrations

**Backend**

- Period closing checklist workflow (unposted journals, TB balance, sub-ledger reconciliation)
- Immutable audit log (`AuditEvent` with actor, action, entity, diff, timestamp)
- Integration hooks: Booking → Sales Journal, Procurement → Purchase Journal
- Notification events (WebSocket or polling) for approval queues and exceptions
- Branch-scoped data isolation for multi-branch tenants

**UI (ships with backend)**

- Period Closing wizard with checklist steps and blockers
- Audit Trail timeline view (clickable steps linking to journals/ledger)
- Real-time notification toasts + notification center entries:
  - Journal ready for approval
  - Posting failed
  - Fiscal period closing reminder
  - Trial Balance out of balance
  - Reference number generated
  - Audit exception detected
- Integration status panel showing auto-generated journals from Booking/Procurement

**Exit criteria:** Auditor can reconstruct full posting history via timeline; period close blocked until UI checklist passes.

---

### Component 6: Financial UI & UX Architecture

Component 6 is not a late-phase polish pass—it is the **cross-cutting UX layer** that spans Components 1–5 and defines shared patterns used from Milestone 1 onward.

#### Design philosophy

The Financial Domain follows BookFlow's existing design language while adopting enterprise ERP usability principles (SAP Fiori, Oracle Fusion, Microsoft Dynamics).

#### UI principles

- Minimal clicks for common accounting tasks
- Keyboard-first data entry
- Real-time validation
- Progressive disclosure (simple by default, advanced on demand)
- Responsive layouts
- Accessibility (WCAG 2.1 AA)
- Consistent design tokens with existing BookFlow UI
- Role-based navigation and permissions
- Audit-friendly interfaces with clear status indicators

#### Financial navigation structure

```text
BookFlow
│
├── Dashboard
├── Booking
├── CRM
├── Procurement
├── Inventory
├── Financial
│      │
│      ├── Dashboard
│      ├── Master Data
│      │      ├── Chart of Accounts
│      │      ├── Fiscal Periods
│      │      ├── Tax Codes
│      │      ├── Cost Centers
│      │      ├── Departments
│      │      └── Reference Series
│      │
│      ├── Journals
│      │      ├── Sales Journal
│      │      ├── Purchase Journal
│      │      ├── Cash Receipt Journal
│      │      ├── Cash Disbursement Journal
│      │      ├── General Journal
│      │      └── Pending Posting
│      │
│      ├── Ledger
│      │      ├── General Ledger
│      │      ├── Subsidiary Ledger
│      │      └── Account Inquiry
│      │
│      ├── Reports
│      │      ├── Trial Balance
│      │      ├── Balance Sheet
│      │      ├── Income Statement
│      │      ├── Cash Flow
│      │      └── Financial Analytics
│      │
│      ├── Period Closing
│      │
│      └── Audit Trail
│
└── Settings
```

#### Shared financial component library

All financial screens compose from shared BookFlow + financial-specific components:

| Component | Purpose |
| --- | --- |
| `FinancialLayout` | Sub-nav shell (BucketLayout pattern) |
| `KpiCard` | Dashboard metrics (reuse ObservatoryPanel patterns) |
| `FinancialDataTable` | Sortable, filterable, exportable tables |
| `JournalLineGrid` | Keyboard-first editable grid |
| `AccountTree` | Hierarchical CoA with drag-and-drop reclassification |
| `WorkflowStepper` | Draft → Validated → Approved → Posted → Locked |
| `AuditTimeline` | Clickable event timeline |
| `StatusBadge` | Journal/report/period status with semantic colors |
| `ValidationBanner` | Inline debit/credit balance and rule violations |
| `ReportFilterBar` | Shared multi-dimensional report filters |
| `ApprovalActionBar` | Bulk approve/post with confirmation |
| `FinancialSlideOver` | Detail panel without route change |
| `CommandPalette` | Quick navigation + financial actions |
| `FinancialAssistantPanel` | Embedded AI (not separate chatbot) |

Extend existing platform components where possible: Toast, Modal, Skeleton loaders, global search.

#### Financial Dashboard widgets

- Current Assets / Current Liabilities
- Revenue Today / Revenue This Month
- Expenses This Month / Net Income
- Cash Position
- Pending Journals / Unposted Entries
- Trial Balance Status
- Open Fiscal Period
- Recent Audit Logs

#### AI Financial Assistant (embedded)

Integrated within the Financial module—not a standalone chatbot page.

Example prompts:

- Show today's Sales Journal
- Show all unposted journals
- Explain Journal SJ-2026-0012
- Generate Trial Balance
- Show Accounts Receivable Aging
- Why did posting fail?
- Show expenses by department
- Compare this month vs last month

Responses include **deep links** that open the relevant journal, ledger, or report.

#### Mobile experience

Primary mobile use cases (desktop-first for complex entry):

- Financial dashboard KPIs
- Journal approvals
- Notifications
- Audit review

Manual journal creation remains desktop-first.

#### User roles & permissions

| Role | Permissions |
| --- | --- |
| Super Admin | Full financial administration |
| Finance Manager | Approve postings, manage periods, view all reports |
| Accountant | Create and edit journals, post entries, run reports |
| Auditor | Read-only: journals, ledgers, reports, audit trail |
| Procurement Officer | Create purchase transactions only |
| Booking Officer | Create sales transactions only |
| Branch Manager | View branch-specific financial data and reports |

Role gates apply at **API middleware** and **navigation render** (hide unavailable routes).

---

## 4. Milestones (Backend + UI Paired)

Each milestone ends with a **demo-ready vertical slice**—not an API-only checkpoint.

### Milestone 1 — Financial Workspace & Master Data (Weeks 1–4)

| Track | Deliverables |
| --- | --- |
| Backend | CoA, Fiscal Period, Tax Code, Cost Center, Department, Reference Series models + APIs |
| UI | `FinancialLayout`, sidebar integration, CoA tree, master data CRUD screens, skeletons |
| Shared | `FinancialDataTable`, `StatusBadge`, `AccountTree` v1 |

**Demo:** Configure chart of accounts and open a fiscal period entirely through UI.

---

### Milestone 2 — Journal Workspace (Weeks 5–8)

| Track | Deliverables |
| --- | --- |
| Backend | Journal engine, line validation, reference numbering, status workflow |
| UI | Journal lists (all types), journal entry screen, workflow stepper, validation banners |
| Shared | `JournalLineGrid`, `WorkflowStepper`, `ValidationBanner`, keyboard shortcuts |

**Demo:** Create, validate, and approve a General Journal; see real-time balance indicator.

---

### Milestone 3 — Posting & Ledger (Weeks 9–12)

| Track | Deliverables |
| --- | --- |
| Backend | Posting engine, ledger materialization, subsidiary views, account inquiry API |
| UI | Pending Posting queue, GL/SL inquiry screens, drill-down to journals |
| Shared | `ApprovalActionBar`, `FinancialSlideOver` |

**Demo:** Post approved journals; trace account balance to source entries.

---

### Milestone 4 — Reporting (Weeks 13–16)

| Track | Deliverables |
| --- | --- |
| Backend | Trial Balance, Balance Sheet, Income Statement, Cash Flow engines + export |
| UI | Report screens with filter bar, balance indicators, drill-down, PDF/Excel export |
| Shared | `ReportFilterBar`, print layouts |

**Demo:** Generate Trial Balance for open period; drill from report to journal.

---

### Milestone 5 — Closing, Audit & Integrations (Weeks 17–20)

| Track | Deliverables |
| --- | --- |
| Backend | Period closing workflow, audit log, Booking/Procurement journal hooks, notifications |
| UI | Period closing wizard, audit timeline, notification center, integration status |
| Shared | `AuditTimeline`, notification event wiring |

**Demo:** Close a period with checklist; view full audit trail for a posted journal.

---

### Milestone 6 — AI-Assisted Finance & Mobile (Weeks 21–24)

| Track | Deliverables |
| --- | --- |
| Backend | Financial intent routing, explain-posting API, NL report queries |
| UI | Embedded Financial Assistant, mobile-responsive dashboard + approvals, command palette |
| Shared | `FinancialAssistantPanel`, `CommandPalette`, mobile layouts |

**Demo:** Ask "Show unposted journals" → receive linked results; approve journal from mobile.

---

## 5. Design Tokens Extension

Add financial-specific tokens to `DashboardLayout` global `:root` (consistent with `design.md`):

```css
/* Journal / workflow status */
--status-draft: #94a3b8;
--status-validated: #0ea5e9;
--status-approved: #8b5cf6;
--status-posted: #22c55e;
--status-locked: #64748b;

/* Financial indicators */
--fin-balanced: #22c55e;
--fin-unbalanced: #ef4444;
--fin-debit: #111111;
--fin-credit: #0a6ed1;

/* Data grid */
--grid-row-hover: #f8fafc;
--grid-row-focus: #eff6ff;
--grid-border: #e2e8f0;
```

---

## 6. Testing Strategy

| Layer | Approach |
| --- | --- |
| Backend | Unit tests for validation rules, posting engine, report calculations |
| API | Integration tests per financial endpoint with role matrix |
| UI | Component tests for `JournalLineGrid`, `WorkflowStepper`, `AccountTree` |
| E2E | Critical paths: create journal → approve → post → verify ledger → run TB |
| Accessibility | axe-core on all financial screens; keyboard-only journal entry test |
| Visual | Snapshot tests for dashboard KPI layout and report tables |

---

## 7. Success Criteria

1. **Usability:** Accountant completes daily journal entry with ≤3 clicks from dashboard to saved draft.
2. **Integrity:** Every posted entry has a visible audit trail reachable in ≤2 clicks.
3. **Parity:** All v1.0 backend capabilities remain; none are API-only.
4. **Consistency:** Financial screens pass design token audit against `design.md`.
5. **Accessibility:** WCAG 2.1 AA on journal entry, reports, and dashboard.
6. **Integration:** Booking and Procurement transactions auto-generate reviewable journal drafts.
7. **AI:** Financial Assistant resolves ≥80% of demo prompts with correct deep links.

---

## 8. v1.0 → v2.0 Migration Notes

- Existing procurement UI (`pages/admin/procurement/*`) remains; Purchase Journal integration added in Milestone 5.
- No breaking changes to Booking, CRM, or Inventory modules during Milestones 1–4.
- Financial nav appears only for roles with financial permissions (progressive rollout flag).
- Backend work from v1.0 (if already started) maps directly to Component 1–5 backend columns; add UI track per milestone rather than reordering schema work.

---

## 9. Document History

| Version | Date | Change |
| --- | --- | --- |
| v1.0 | — | Backend-first roadmap (~85/15) |
| v2.0 | 2026-08-06 | Added Component 6; paired backend/UI milestones; Financial workspace architecture |

---

*This plan ensures the GS2026-aligned Financial Domain is technically robust **and** provides an enterprise-grade experience for accountants, finance managers, auditors, and operational users.*
