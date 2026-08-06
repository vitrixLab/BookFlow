# Cursor Prompt – Milestone 1: Data Foundation

## Read the following files:
- `docs/implementation/prisma/10_PRISMA_SCHEMA_PLAN.md`
- `docs/implementation/prisma/11_DATABASE_MIGRATION_PLAN.md`
- `docs/implementation/prisma/12_SEEDING_PLAN.md`

## Tasks
1. **Add** all financial models to `prisma/schema.prisma` (currently they are missing – refer to the plan for exact fields and relations).
2. Run `npx prisma migrate dev --name add_financial_core` to create the migration.
3. Extend `prisma/seed.ts` with financial seed data (chart of accounts, fiscal periods, tax codes, reference sequences, one sample journal). Do **not** break the existing booking seed.
4. Verify with `npx prisma studio` that the new tables exist and contain seed data.
5. Do **not** modify any other files.
6. Do **not** create any service files or UI – only schema and seed.

## Acceptance
- All financial tables exist in the database.
- Seed data visible in Prisma Studio.