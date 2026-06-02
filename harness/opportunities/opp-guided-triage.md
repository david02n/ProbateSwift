---
id: opp-guided-triage
type: opportunity
title: Personalised "do I need probate & which route?" triage
status: ready_for_review
evidence: supported
delivery: built
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: prob-dont-know-if-needed; prob-when-solicitor-needed; PRD three-outcome model; shared/evaluation-config.ts; shared/milestone-config.ts
links:
  addresses: [prob-dont-know-if-needed, prob-when-solicitor-needed]
  realized_by: [sol-rule-flag-engine, sol-personalised-task-list, sol-llm-triage]
  relates_to: [vision, goals]
---

## Opportunity
A guided intake that answers the three threshold questions for this specific estate: is probate
required, is the user eligible, and is the case safe to self-serve — producing one of the PRD's three
outcomes (not needed / proceed / see a specialist).

## Desired outcome
Every user reaches a confident, correct next step within minutes, instead of paralysis or a wrong-
route start. Complex cases are triaged out *before* they waste effort or risk liability.

## Why it's worth it
Removes the first and highest drop-off point; de-risks downstream stops; the triage-out is also a
referral/partnership revenue path (to firms like KCT/Co-op) and a trust signal ("honest about limits").

## Open assumptions & risks
- Frequency/severity of the "don't know if needed" pain is researched, not yet user-validated.
- Triage that touches eligibility/route must stay clear of reserved legal activity (positioning/regulatory risk).
