---
id: dec-hosting-railway
type: decision
title: Hosting moved to Railway (from Replit)
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: git log (4688d9c "Prepare app for Railway deployment"; 3e1c07e "Set up Railway Postgres"; multiple Replit-fix commits); railway.json; docs/railway.md
links:
  chosen: []
  rejected: []
  relates_to: []
---

## Decision
The app is deployed on Railway with Railway-managed Postgres.

## Alternatives considered
Replit (the original environment — many early commits are Replit deployment fixes; `replit.md` and `replit-salvage/` remain as residue).

## Rationale & evidence
Commit history shows a deliberate migration from Replit to Railway, plus `railway.json` and `docs/railway.md`. Infrastructure decision; recorded for completeness.

## Reversal conditions
Revisit if Railway cost/scaling or UK data-residency requirements force a move to another host.
