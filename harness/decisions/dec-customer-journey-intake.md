---
id: dec-customer-journey-intake
type: decision
title: Customer journey — assessment and evaluation as one merged intake, with hybrid triage and a helper handoff
status: ready_for_review
evidence: supported
created_by: agent
created: 2026-06-11
updated: 2026-06-11
source: David session 2026-06-11; shared/evaluation-config.ts; server/routes/cases.ts; shared/schema.ts; docs/customer-journey-map.svg; dec-assessment-seeding; dec-pricing-model
links:
  chosen: []
  rejected: []
  supersedes: [dec-assessment-seeding]
  relates_to: [opp-guided-triage, sol-readiness-gate, sol-rule-flag-engine, dec-pricing-model, prob-when-solicitor-needed]
---

## Decision
The product is one customer journey with two distinct *jobs*, not two question sets. **Assessment = qualify** (decide what the user should do, pre-account, public). **Evaluation = produce** (gather everything needed to complete the forms, with branching). See `docs/customer-journey-map.svg`.

David's decisions, 2026-06-11:

1. **Three-outcome model at assessment.** `deriveLandingPageResult`'s loose return is replaced by one canonical `AssessmentOutcome { route: 'not_needed' | 'ineligible' | 'proceed'; reason; probateType?; specialistSuggested: boolean; specialistReasons: string[] }`. Renders as not needed (stop), proceed-clear (green), proceed-with-flag (amber).

2. **Hybrid specialist triage.** Complexity (foreign assets, trusts, adoptions, foreign wills, insolvency, dispute) raises a **soft, non-blocking** flag at assessment; the **firm, terminal** version is made at the readiness gate, reusing `specialistReasons`. Same logic, computed twice over a growing answer set, not written twice.

3. **Paywall: free to use, pay to generate the forms.** Account is free; evaluation and the readiness gate are free; payment gates form generation. Consistent with `dec-pricing-model` (£295 flat, charge at submission) — the generated forms are the thing submitted.

4. **One merged intake record (supersedes `dec-assessment-seeding`).** Collapse `assessment_results` + `evaluation_responses` into a single `intake` store: `{ browserSessionId?, userId?, caseId?, answers (one canonical vocabulary), derivedFlags, applicantRole }`. Seeding disappears — the anonymous assessment row IS the start of the evaluation; on signup it is claimed (userId/caseId attached), never copied. One `deriveFlags(answers)` replaces the two flag functions. Kills the `applicant_named_executor` vs `named_executor_in_will` drift by construction.

5. **Ineligible applicant becomes a handoff, not a dead end.** If the user is not the entitled applicant (not the named executor, or not top of intestacy priority), set `applicantRole: 'helper'`, let them gather and prepare a **partial application**, then invite the entitled person to take over. Shared access with roles: helper stays a contributor, the entitled person becomes `applicant`. **Only the verified entitled applicant can sign the statement of truth and submit** (hard rule — keeps clear of reserved-activity / false-statement risk). This is also a growth loop (the wrong person recruits the right one) and is more correct, since eligibility often can't be known at question one.

6. **Anonymous resume by email.** Match anonymous rows by `browserSessionId`; additionally offer an optional email capture at assessment to save/resume cross-device (and seed a lead).

## Alternatives considered
- Source of truth: `answers` JSON canonical, or structured columns authoritative, or full merge. **Chose full merge** (one table) despite the cost, because it makes the handoff trivial and removes seeding entirely.
- Ineligible handling: own stop outcome, or fold into not-needed, or proceed-and-resolve. **Chose gather-then-handoff**, a richer fourth path.
- Handoff access: shared-with-roles (chosen) vs full transfer vs transfer + read-only copy.

## Rationale & evidence
The dual-model drift `dec-assessment-seeding` warned about is already live (`deriveEvaluationFlags` accepts `named_executor_in_will || applicant_named_executor`). `isInsolvent`/`hasDispute` columns exist in `assessment_results` but nothing populates them — they become the specialist signals once the complexity screen (item 2) lands. Merging removes the bridge rather than maintaining it.

## Costs / risks to handle on build
- `userId`/`caseId` go nullable — needs a claim-once invariant (attached, never detached).
- Migration to fold the two existing tables into `intake`.
- Cross-device anonymous loss (mitigated by item 6).
- Milestone/progress code reads `evaluation_responses` — update to the merged shape.

## Reversal conditions
If the single nullable-ownership table proves error-prone in practice, split back into a pre-auth assessment store and a case-bound evaluation store, keeping the shared vocabulary so the bridge stays a copy.

## Issue 2 resolved (2026-06-11) — early complexity screen
Assessment-stage complexity screen, ~6 canonical keys (the test: strong specialist predictor, answerable upfront, changes the route): `estate_insolvent`, `estate_disputed`, `deceased_foreign_assets`, `deceased_domiciled_uk`, `trust_involvement`, `business_or_farm_assets`, `will_missing_or_invalid`. `estate_insolvent`/`estate_disputed` finally populate the orphan `isInsolvent`/`hasDispute` columns. `settled_land`, `family_adoptions`, `foreign_wills` specifics stay deep-only (affect form detail, not go/no-go). In the merged record these are answered earlier, never re-asked.

**Two-tier severity (David):** outcome gains `specialistSeverity: 'none' | 'amber' | 'red'`. Red = any of {insolvent, disputed} → stronger copy, specialist CTA shown first. Amber = any other flag → soft "continue if you like". Neither hard-blocks; route stays `proceed`.

**Binary flags first (David):** v1 ships simple yes/no flags, no clear-or-confirm deep follow-ups yet. Consequence for issue 3: the readiness gate must let a user acknowledge/dismiss a lingering **amber** flag (e.g. a tiny foreign account) so it doesn't force a needless referral; **red** flags stay sticky. Deep clear-or-confirm follow-ups (value/type questions that downgrade a coarse flag) are deferred post-v1.

Copy drafted (amber + red variants) in session 2026-06-11.

## Issue 3 resolved (2026-06-11) — readiness gate
The binary `application_ready` becomes a four-way router: `ready | handoff | specialist | fix_required`.

**Pay vs submit split (David: anyone pays, applicant submits).** Entitlement moves off the payment check onto submission:
- `canPay = !application_blocked && specialistSeverity !== 'red' && (specialistSeverity !== 'amber' || amberAcknowledged)` — not gated by role, any collaborator can pay.
- `canSubmit = canPay && applicantIsEntitled && statementOfTruthSigned && structuralRequirementsMet`.
Consequence: the **helper handoff is no longer a pre-paywall diversion** — a helper can gather, pay, and generate; only signing/submitting is reserved for the entitled applicant. One fewer branch before the paywall, and the helper can settle the fee.

**Only two things block payment:** jurisdiction (`application_blocked`, caught upstream) and a sticky red specialist flag. Amber flags, applicant-count rules and IHT sequencing become a dismissible prompt or a submission-time gate, not a refusal of money (free-until-forms model).

**`fix_required` splits:** structural problems that invalidate the form (>4 applicants; under-18 beneficiary with <2 applicants) block **generation** (a paid un-fileable form = refund); the IHT item is a **timing warning** (HMRC must process before filing), not a block. The IHT half must reconcile with `dec-iht-form-strategy` in issue 5 — do NOT tell users to go complete a form the product now fills for them.

**Warm handoff (David: opt-in).** On a red flag: explicit consent → structured case summary (with/without will, estate band, flags + reasons) to the partner so the family doesn't re-explain → logged referral event for attribution (the `opp-guided-triage` revenue path). External dependency: partner API or agreed email format + consent flow.

## Issue 5 resolved (2026-06-11) — "is a grant needed" logic (research-backed)
The current code conflates two independent axes via one value-band question. **Split them:** grant-needed is driven by how assets are *held* (ownership/institution), IHT by total *value*. The £325k in the grant logic is the IHT nil-rate band and does not belong there.

**Research (sources in chat 2026-06-11):** No statutory small-estates threshold; each institution sets its own (£5k–£50k). Property in sole name almost always needs a grant (Land Registry). Big banks (Barclays/Nationwide/Santander) sit at £50k per-institution, so ordinary bank cash rarely triggers alone. **Exception that broke David's hypothesis:** NS&I / Premium Bonds trigger at just **£5,000** across all NS&I holdings (~£30k if sole beneficiary), and directly-held shares trigger low too — both very common in the older demographic. ONS: property ~40% of UK wealth vs ~14% financial, confirming property-first.

**Resolved assessment tree (coarse — David):**
1. `owned_property` + `property_ownership` (sole / joint tenants / tenants in common / not sure). Sole or TIC → **grant needed**.
2. No grant-triggering property → ask the *specific low-threshold* assets, not a generic cash band: NS&I/Premium Bonds > £5k? directly-held shares? any single provider likely > £50k? Any yes → **likely needed**.
3. None → **probably not needed**, with "how to confirm with each provider" guidance (the honest lean for the narrow residual grey zone).
Replace `estate_value_estimate` (grant use) with the ownership keys; keep total value for the IHT axis only. Evaluation refines exact figures.

**IHT reconciliation (from issue 3):** product fills the IHT400 (`dec-iht-form-strategy`), so readiness no longer says "complete IHT400 first". The real gate is HMRC sequencing (IHT400 processed → probate code issued → application can be filed) = a submission-time timing warning; excepted estates skip it (values on the application).

## All five journey issues resolved (2026-06-11)
1 three-outcome model · 2 early complexity screen · 3 readiness-gate router · 4 merged intake · 5 grant-needed logic. Deferred build: clear-or-confirm deep follow-ups for complexity flags; partner integration for warm handoff; bank-threshold dataset (optional).
