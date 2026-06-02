---
id: sol-guided-iht400
type: solution
title: Guided in-app IHT400/PA1P completion with prefill (not built)
status: draft
evidence: assumption
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: inferred from opp-iht-form-assistant; estate data already in shared/schema.ts (estate_assets, estate_liabilities, people)
links:
  realized_by: []
  relates_to: [opp-iht-form-assistant]
---

## Solution
A field-by-field guided wizard that completes IHT400 (and its schedules) and PA1P/PA1A in plain language, prefilling from the assets, liabilities and people already captured in the estate dashboard, then generating a filled PDF ready to print/submit.

## How it scores
Feasibility 🟡 medium — the estate data model and `pa1p_sections` flags already exist; the work is form-field mapping + PDF generation. Value 🟢 high — turns "here's the form" into "we filled the form", the strongest differentiator vs the free GOV.UK route. Complexity 🔴 high — many fields, schedule branching, and accuracy stakes are legal. Time-to-learn ✅ high payoff for the user.

## Trade-offs
Much higher build cost and ongoing maintenance as HMRC forms change, but it's the version of the product that actually removes the IHT400 pain rather than signposting it. Competes with [[sol-iht-flagging-bundled-forms]]; decision pending in [[dec-iht-form-strategy]].
