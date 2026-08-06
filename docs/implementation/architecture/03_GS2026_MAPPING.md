# GS2026 Mapping

BookFlow aligns with the **GS2026 financial data standard** to ensure interoperability. Below is the mapping of GS2026 entities to our Prisma models and domains.

| GS2026 Concept | BookFlow Model / Module | Notes |
|----------------|--------------------------|-------|
| Chart of Accounts | `ChartOfAccount` | Supports up to 5 segments (Nature, Category, Subcategory, etc.) |
| Journal Entry | `JournalHeader` + `JournalDetail` | Header carries period, date, reference; details carry debit/credit. |
| General Ledger | `GeneralLedgerEntry` | Immutable, derived from posted journals. |
| Fiscal Period | `FiscalPeriod` | Open/close status enforced by Period Closing Engine. |
| Tax Code | `TaxCode` | Linked to journal lines for VAT/tax calculation. |
| Reference Sequence | `ReferenceSequence` | Per document type (Invoice, Journal, PO). |
| Audit Trail | `FinancialAuditTrail` | Tracks create, update, post, void events. |
| Financial Statements | Reporting Engine | Trial Balance, P&L, Balance Sheet generated from GL. |

## Compliance Requirements
- **Segregation of duties**: Role‑based permissions for posting, viewing reports, administration.
- **No data deletion**: Void instead of delete (soft‑void flag).
- **Full auditability**: Every financial change must be traceable to a user and timestamp.
- **Period integrity**: No posting to a closed period without re‑opening (which must also be audited).

Our implementation will pass a GS2026 certification check for small/medium businesses.