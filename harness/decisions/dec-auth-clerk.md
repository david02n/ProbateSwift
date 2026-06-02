---
id: dec-auth-clerk
type: decision
title: Authentication switched to Clerk (from Stytch / legacy Replit auth)
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: git log (ba45b73 "Switch auth flow from Stytch to Clerk"; 36b30e5 "remove legacy auth stack"); server/clerk.ts; package.json (@clerk/*)
links:
  chosen: []
  rejected: []
  relates_to: [opp-estate-dashboard]
---

## Decision
User authentication is handled by Clerk (`@clerk/express`, `@clerk/clerk-react`, `@clerk/backend`).

## Alternatives considered
Stytch (previous implementation, explicitly removed) and a legacy Replit-era auth stack (also removed).

## Rationale & evidence
Two commits record the migration path: Stytch → Clerk, then removal of the legacy stack. Infrastructure decision rather than a product-strategy one; recorded here because it's a clear, evidenced choice in the history.

## Reversal conditions
Unlikely to reverse short-term; revisit only if Clerk pricing/region/compliance (UK data residency) becomes a blocker.
