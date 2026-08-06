# BookFlow Financial Module – Implementation Workspace

This workspace breaks the financial domain into bite‑sized, Cursor‑friendly implementation guides.  
**ChatGPT** provides the architecture and detailed specs; **Cursor** implements them one file at a time.

## How to use
1. Read the high‑level overview: `00_PROJECT_OVERVIEW.md`
2. Follow the roadmap: `01_IMPLEMENTATION_ROADMAP.md`
3. For each milestone, open the corresponding `prompts/cursor/milestone-N.md` and feed it to Cursor.
4. Cursor will read the referenced specs and generate production‑ready TypeScript.

## Structure
- `architecture/` – *Why* we build this way (human reference)
- `prisma/` – Database schema, migrations, seeding
- `backend/` – Service engines (posting, validation, audit, etc.)
- `frontend/` – UI layouts and component specifications
- `integrations/` – Mapping to booking, procurement, AI assistant
- `testing/` – Test plans and cases
- `prompts/cursor/` – Ready‑to‑use prompts for each milestone