---
id: dec-assessment-seeding
type: decision
title: Landing-page assessment seeds the in-app evaluation on case start
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: server/routes/cases.ts (case-start seeds from latest assessmentResults); git log a05d961 "assessment transfer"; shared/schema.ts (assessment_results + evaluation_responses)
links:
  chosen: []
  rejected: []
  relates_to: [opp-guided-triage]
---

## Decision
Two assessment models are kept — a lightweight landing-page `assessment_results` and the detailed in-app `evaluation_responses` — and when a case is created the most recent assessment is used to pre-seed the evaluation answers (fire-and-forget, never blocking the request).

## Alternatives considered
A single unified assessment model (one schema for both landing and in-app). Rejected in favour of two, bridged by seeding — lets the public funnel stay simple while the in-app flow goes deep.

## Rationale & evidence
`cases.ts` reads the latest `assessmentResults` for the user and maps both the raw `assessmentData` JSON and structured columns into seed answers. Avoids making the user re-enter what they answered before signing up.

## Reversal conditions
If the dual model causes drift/confusion between the two question sets, consolidate to one canonical schema.
