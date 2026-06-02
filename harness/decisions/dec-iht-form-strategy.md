---
id: dec-iht-form-strategy
type: decision
title: How far to go on IHT/PA forms — signpost vs fully guided completion
status: needs_user_input
evidence: assumption
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: shared/evaluation-config.ts (iht flags, pa1p_sections); forms/ (bundled PDFs); opp-iht-form-assistant
links:
  chosen: sol-iht-flagging-bundled-forms
  rejected: []
  relates_to: [opp-iht-form-assistant]
---

## Decision
**Open.** The product currently routes the user to the right IHT/PA forms and bundles the official PDFs ([[sol-iht-flagging-bundled-forms]]). It does not yet fill them in.

## Alternatives considered
- **Stay as signposting** — flag which forms are needed + bundled PDFs the user completes by hand. Low cost; weaker differentiation vs free GOV.UK route.
- **Build guided completion** — [[sol-guided-iht400]], a field-level wizard that prefills IHT400/PA1P from captured estate data and outputs a filled PDF. High build/maintenance cost; strongest differentiator and the version that actually removes the pain.

## Rationale & evidence
The flag engine and estate data model already exist, so the prefill path is feasible — but no completion engine is in the code today.

## Open question for the user
Is the v1 promise "we tell you exactly which forms and whether IHT400 applies", or "we fill the forms for you"? This sets scope, price justification, and legal-liability posture.
