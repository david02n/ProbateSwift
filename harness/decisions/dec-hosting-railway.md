---
id: dec-hosting-railway
type: decision
title: Hosting moved to Railway (from Replit)
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-11
source: git log (4688d9c "Prepare app for Railway deployment"; 3e1c07e "Set up Railway Postgres"; multiple Replit-fix commits); railway.json; docs/railway.md; 2026-06-11 prod incident (schema/code skew)
links:
  chosen: []
  rejected: []
  relates_to: [dec-customer-journey-intake]
---

## Decision
The app is deployed on Railway with Railway-managed Postgres. Pushes to `main`
auto-build and deploy (`npm run build` = `vite build && esbuild` — neither
type-checks). DB migrations use `drizzle-kit push` (`npm run db:push`): the whole
`shared/schema.ts` is pushed atomically, with **no versioned migration files**.

## Operational constraint (learned 2026-06-11)
Schema and code are decoupled in the workflow — `db:push` changes the DB
immediately, independently of any code deploy — so **they must be shipped together
or the API breaks app-wide**. On 2026-06-11 the prod DB had been pushed to the new
intake schema (dropped `assessment_results` + `probate_cases.assessment_id`) while
the matching code was never deployed; the live server kept querying the dropped
relations and **every authenticated route returned 500** (`relation/column does not
exist`). Resolved by deploying the code that matched the already-migrated DB.
Guardrails: gauge deployability with `npm run build` (not `tsc`); confirm a
migrated table exists in prod via a public read (`GET /api/intake/anon/<x>` → 200).

## Alternatives considered
Replit (the original environment — many early commits are Replit deployment fixes; `replit.md` and `replit-salvage/` remain as residue).

## Rationale & evidence
Commit history shows a deliberate migration from Replit to Railway, plus `railway.json` and `docs/railway.md`. Infrastructure decision; recorded for completeness.

## Reversal conditions
Revisit if Railway cost/scaling or UK data-residency requirements force a move to another host.
