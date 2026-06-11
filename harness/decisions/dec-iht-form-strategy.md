---
id: dec-iht-form-strategy
type: decision
title: How far to go on IHT/PA forms — signpost vs fully guided completion
status: ready_for_review
evidence: researched
created_by: agent
created: 2026-06-03
updated: 2026-06-11
decided_by: user
source: shared/evaluation-config.ts (iht flags, pa1p_sections); forms/ (bundled PDFs); opp-iht-form-assistant; HMRC/HMCTS submission research 2026-06-11; user decision 2026-06-11
links:
  chosen: sol-guided-iht400
  rejected: [sol-iht-flagging-bundled-forms]
  relates_to: [opp-iht-form-assistant, sol-pa1p-browser-autofill]
---

## Decision
**Resolved (David, 2026-06-11): "fill them for you."** v1 moves from signposting to guided completion — [[sol-guided-iht400]] prefills the forms from captured estate data and outputs completed documents, superseding the current signpost-and-bundle approach ([[sol-iht-flagging-bundled-forms]]).

## Submission reality (researched 2026-06-11) — defines what "fill for you" can mean
- **IHT400 is paper only.** HMRC requires it printed and posted with original wet signatures; there is no full online submission. So the product's output here is a completed PDF the user prints, signs, and posts — never in-app e-filing.
- **PA1P (probate application) is online-dominant but closed.** The GOV.UK / HMCTS online service handles ~80–92% of grants and is much faster (~under 4 weeks vs up to ~15 for paper), but it has **no public API** — the product cannot file into it on the user's behalf. Options: (a) prefill the **paper PA1P PDF**; (b) hand the user a structured packet to type into the GOV.UK service; or (c) a **browser-extension autofill** that fills the GOV.UK online form in the user's own session — [[sol-pa1p-browser-autofill]] (David's idea, 2026-06-11). The extension keeps the fast online route *and* user-in-the-loop submit (better for liability) at the cost of brittleness when GOV.UK changes its markup.
- **Net:** "fill for you" = **producing completed PDFs**, not browser e-filing. There is no API path to submit either form programmatically.

## Fulfilment options (on top of the filled PDFs)
Because output is paper-bound (certainly for IHT400), there's room for a service layer:
1. **Self-serve** — user downloads completed PDFs, prints and signs immediately.
2. **Print-and-post** — ProbateSwift prints the completed forms and mails them to the user to sign (and optionally return for onward posting). A potential paid upsell / differentiator.

## Alternatives considered
- **Stay as signposting** (`sol-iht-flagging-bundled-forms`) — rejected; weak differentiation vs the free GOV.UK route, doesn't remove the actual pain.

## Rationale & evidence
The flag engine and estate data model already exist, so the prefill path is feasible. Guided completion is the real wedge and justifies the paid price. Liability posture rises (we generate form content), so completed forms need clear "review before you sign" framing and accuracy safeguards.

## Open follow-ups
- Scope which forms v1 covers (IHT400 + which schedules; PA1P paper vs GOV.UK-handoff).
- For PA1P, choose the route: paper PDF prefill vs [[sol-pa1p-browser-autofill]] (Chrome extension) vs structured handoff packet — paper-first then extension as a fast-route upgrade is the likely sequencing.
- Decide whether print-and-post is in v1 or a later upsell.
- Legal/liability review of generating signable form content.

## Reversal conditions
If build/maintenance cost or liability proves too high for v1, fall back to signposting for the heaviest schedules while keeping guided completion for the core forms.
