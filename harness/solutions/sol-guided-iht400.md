---
id: sol-guided-iht400
type: solution
title: Guided in-app IHT400/PA1P completion with prefill (chosen, not built)
status: draft
evidence: researched
created_by: agent
created: 2026-06-03
updated: 2026-06-11
source: inferred from opp-iht-form-assistant; estate data already in shared/schema.ts (estate_assets, estate_liabilities, people); HMRC/HMCTS submission research 2026-06-11; chosen in dec-iht-form-strategy (user, 2026-06-11)
links:
  realized_by: []
  relates_to: [opp-iht-form-assistant]
---

## Solution
A field-by-field guided wizard that completes IHT400 (and its schedules) and PA1P/PA1A in plain language, prefilling from the assets, liabilities and people already captured in the estate dashboard, then generating a filled PDF ready to print/submit.

## How it scores
Feasibility 🟡 medium — the estate data model and `pa1p_sections` flags already exist; the work is form-field mapping + PDF generation. Value 🟢 high — turns "here's the form" into "we filled the form", the strongest differentiator vs the free GOV.UK route. Complexity 🔴 high — many fields, schedule branching, and accuracy stakes are legal. Time-to-learn ✅ high payoff for the user.

## Output is PDFs, not e-filing (researched 2026-06-11)
There is no API path to submit either form for the user, so this solution produces **completed PDFs**, not in-app submission:
- **IHT400** — paper only; HMRC needs it printed and posted with wet signatures. Output = filled PDF to print, sign, post.
- **PA1P** — GOV.UK online service is faster and dominant but has no public API. Either prefill the **paper PA1P PDF** or output a structured packet the user types into the GOV.UK service.

Optional fulfilment layer on top (see [[dec-iht-form-strategy]]): self-print, or ProbateSwift print-and-post for signature — a possible paid upsell.

## Trade-offs
Much higher build cost and ongoing maintenance as HMRC forms change, plus raised liability from generating signable content (needs "review before you sign" framing). But it's the version that actually removes the IHT400 pain rather than signposting it. **Chosen over [[sol-iht-flagging-bundled-forms]]** in [[dec-iht-form-strategy]].
