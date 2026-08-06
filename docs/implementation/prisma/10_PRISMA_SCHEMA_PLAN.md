# Prisma Schema Plan

## Current State (from branch `AntiGravity`)
The `schema.prisma` currently contains only the booking‑related models:
- `User`, `Service`, `BookedAppointment`, `SmsLog`, `LoginTrace`

No financial models exist yet. **All financial tables must be created in the implementation phase.**

## Models to Add
The following models need to be defined in `schema.prisma`:

- `ChartOfAccount`
  - Fields: `id`, `code` (unique), `name`, `type` (enum: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE), `parentId?` (self‑relation), `isActive`, `createdAt`, `updatedAt`
- `FiscalPeriod`
  - Fields: `id`, `name`, `startDate`, `endDate`, `isClosed`, `createdAt`
- `TaxCode`
  - Fields: `id`, `code`, `name`, `rate`, `isActive`, `createdAt`
- `ReferenceSequence`
  - Fields: `id`, `modelName` (unique), `prefix`, `nextValue` (Int, starts at 1)
- `JournalHeader`
  - Fields: `id`, `reference` (generated from sequence), `entryDate`, `description?`, `isPosted`, `isVoided`, `periodId` (FK to FiscalPeriod), `createdAt`, `updatedAt`
- `JournalDetail`
  - Fields: `id`, `journalHeaderId` (FK), `accountId` (FK), `debit`, `credit`, `description?`, `taxCodeId?` (FK)
- `GeneralLedgerEntry`
  - Fields: `id`, `accountId`, `date`, `debit`, `credit`, `description?`, `journalDetailId` (FK, nullable), `createdAt`
- `FinancialAuditTrail`
  - Fields: `id`, `userId`, `action`, `entityType`, `entityId`, `changes` (Json?), `createdAt`

## Relationships
- `JournalHeader` 1→N `JournalDetail`
- `JournalDetail` N→1 `ChartOfAccount` (account)
- `JournalDetail` N→1 `TaxCode` (optional)
- `FiscalPeriod` 1→N `JournalHeader`
- `JournalDetail` 1→N `GeneralLedgerEntry` (optional link)
- All FKs must be defined with appropriate `@relation` attributes.

## Actions for Implementation
1. Add the above models to `prisma/schema.prisma` **after the existing booking models**.
2. Ensure enums for `AccountType` and any other required enums are included.
3. Add necessary indexes (e.g., `@@index([accountId, date])` on `GeneralLedgerEntry`).
4. Run `npx prisma migrate dev --name add_financial_models` to generate the migration.