---
id: sol-iht-flagging-bundled-forms
type: solution
title: IHT routing + bundled GOV.UK PDF forms (current approach)
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: shared/evaluation-config.ts (iht400_required, estate_likely_excepted); forms/ (IHT400, IHT406, IHT409, IHT421, IHT422, PA1P, PA1A, GOV.UK guide)
links:
  realized_by: []
  relates_to: [opp-iht-form-assistant]
---

## Solution
The flag engine works out the IHT path — `estate_likely_excepted` (no IHT400 needed) vs `iht400_required` — using estate value band, gifts in last 7 years, trusts, and foreign assets. The product then points the user at the right official PDFs, which are bundled in `forms/` (IHT400 + schedules IHT406/409/421/422, PA1P, PA1A, and the GOV.UK "apply by post" guide).

## How it scores
Feasibility ✅ shipped (routing logic + PDFs in repo). Value 🟡 medium — tells the user *which* forms and *whether* IHT400 applies, the hardest part of the decision. Complexity 🟢 low. Time-to-learn 🟡 amber — user still fills the PDFs by hand.

## Trade-offs
Solves "do I need IHT400 / which forms" but not "help me actually complete IHT400" — no field-level prefill from the estate data already captured. That richer step is the competing [[sol-guided-iht400]]; which to build is open in [[dec-iht-form-strategy]].
