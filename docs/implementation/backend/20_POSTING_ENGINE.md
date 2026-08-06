# Posting Engine Specification

## Objective
Transform a `JournalHeader` (and its `JournalDetail` lines) into `GeneralLedgerEntry` rows in a single atomic transaction.

## Dependencies
- Prisma models: `JournalHeader`, `JournalDetail`, `GeneralLedgerEntry`, `FiscalPeriod`, `ChartOfAccount`
- Validation Engine (must pass before posting)
- Reference Sequence (for entry numbering)

## Files to Create