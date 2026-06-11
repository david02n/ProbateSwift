# ProbateSwift — Customer Journey Build Tickets

Five coarse tickets, one per resolved issue. Full rationale in [`harness/decisions/dec-customer-journey-intake.md`](../harness/decisions/dec-customer-journey-intake.md). Visual: [`docs/customer-journey-map.svg`](./customer-journey-map.svg).

**Build order:** PS-1 (foundation) → PS-2, PS-3 → PS-4 → PS-5.

---

## PS-1 — Merge assessment + evaluation into one `intake` record

**Why:** The dual-model is already drifting (`named_executor_in_will` vs `applicant_named_executor`, papered over with `||` in `deriveEvaluationFlags`). Merging removes the seeding bridge entirely and makes the helper handoff a one-record reassignment.

**Scope**

- New `intake` table: `{ id, browserSessionId?, userId?, caseId?, answers (jsonb), derivedFlags (jsonb), applicantRole: 'applicant' | 'helper' }`. Replaces `assessment_results` + `evaluation_responses`.
- One canonical key dictionary in `shared/evaluation-config.ts`; both `landingPageQuestions` and `detailedEvaluationSections` draw keys from it.
- Collapse `deriveLandingPageResult` + `deriveEvaluationFlags` into one `deriveFlags(answers)` that computes whatever the present keys allow.
- Drop the duplicate `applicant_named_executor` key (landing emits `named_executor_in_will`); keep a one-line shim for legacy rows.
- Claim flow: anonymous row (by `browserSessionId`) gets `userId`/`caseId` attached on signup; never detached (claim-once invariant). Remove the seeding logic in `server/routes/cases.ts`.
- Optional email capture at assessment to save/resume cross-device.
- Migration from the two existing tables into `intake`.

**Acceptance criteria**

- A test asserts every landing key is a member of the canonical dictionary (drift guard).
- Assessment answers appear in the evaluation with no copy step and no re-asking.
- `userId`/`caseId` nullable until claimed; once set, immutable.
- Milestone/progress code (`server/routes/cases.ts`, `shared/milestone-config.ts`) reads the merged shape.

**Key files:** `shared/schema.ts`, `shared/evaluation-config.ts`, `server/routes/cases.ts`, `server/routes/evaluation.ts`, `server/storage.ts`, `shared/milestone-config.ts`

**Supersedes:** `dec-assessment-seeding`

---

## PS-2 — Three-outcome assessment contract

**Why:** `deriveLandingPageResult` returns loose `eligible`/`probateRequired`/`warnings`; the journey needs an explicit three-state outcome, and "see a specialist" can't be produced at the public stage today.

**Scope**

- Replace the loose return with:
  ```ts
  type AssessmentOutcome = {
    route: 'not_needed' | 'ineligible' | 'proceed';
    reason: string;
    probateType?: 'grant_of_probate' | 'letters_of_administration';
    specialistSuggested: boolean;
    specialistSeverity: 'none' | 'amber' | 'red';
    specialistReasons: string[];
  };
  ```
- Render the three displayed outcomes: `not_needed` (stop + explain), `proceed` clear (green), `proceed` + flag (amber/red panel — copy from PS-4).
- Ineligible case = the helper/handoff path: set `applicantRole: 'helper'`, gather + prepare a partial application, invite the entitled person to take over. Shared access with roles; only the entitled applicant signs/submits (hard rule). (Handoff UI is shared with PS-5.)

**Acceptance criteria**

- Every assessment resolves to exactly one `route`.
- A "wrong applicant" user is not dead-ended; they continue as `helper`.
- `specialistSuggested` is advisory at this stage and never blocks `proceed`.

**Key files:** `shared/evaluation-config.ts`, `client/src/components/sections/AssessmentPreview.tsx`, assessment UI

**Depends on:** PS-1

---

## PS-3 — Rebuild "is a grant needed" on asset holding, not value band

**Why:** The current logic answers two unrelated questions with one value band, and uses £325k (the IHT nil-rate band) in grant logic where it doesn't belong. Research confirmed property is the near-certain trigger; ordinary bank cash rarely triggers alone, but NS&I/Premium Bonds (£5k) and direct shares do.

**Scope**

- Split the axes: grant-needed = how assets are *held*; IHT = total *value*. Remove value bands from grant logic.
- Replace `estate_value_estimate` (for grant use) with ownership keys: `owned_property`, `property_ownership` (`sole | joint_tenants | tenants_in_common | not_sure`).
- No-property branch asks the specific low-threshold assets, not a generic cash band: NS&I/Premium Bonds > £5k, directly-held shares, any single provider likely > £50k.
- Three-valued grant outcome: needed / probably needed / probably not needed (+ "how to confirm with each provider" guidance for the residual grey zone).
- Keep total estate value on the IHT axis only (already covered in evaluation Sections 2 & 5).

**Acceptance criteria**

- Sole/TIC property → grant needed.
- No-property estate with only small/spread cash and no NS&I/shares → "probably not needed".
- A no-property estate with > £5k Premium Bonds → "likely needed" (the case the old logic missed).

**Key files:** `shared/evaluation-config.ts`, assessment UI, `docs/customer-journey-map.svg` (Not-needed exit copy)

**Depends on:** PS-1

---

## PS-4 — Early complexity screen + two-tier specialist flags

**Why:** `needs_specialist_advice` only fires deep in the evaluation today, so complex cases do a lot of data entry before being told to see a solicitor. Move a lightweight screen up front (soft, non-blocking).

**Scope**

- Assessment complexity screen (~6 canonical keys): `estate_insolvent`, `estate_disputed`, `deceased_foreign_assets`, `deceased_domiciled_uk`, `trust_involvement`, `business_or_farm_assets`, `will_missing_or_invalid`. (`estate_insolvent`/`estate_disputed` populate the currently-orphan `isInsolvent`/`hasDispute` columns.)
- Two-tier severity: **red** = any of {insolvent, disputed} (stronger copy, specialist CTA first); **amber** = any other flag (soft "continue if you like"). Neither hard-blocks.
- Copy: amber and red panel variants (drafted in `dec-customer-journey-intake`).
- Binary flags for v1 — no clear-or-confirm follow-ups yet (deferred).
- `settled_land`, `family_adoptions`, `foreign_wills` specifics stay deep-only.

**Acceptance criteria**

- Any complexity answer sets `specialistSuggested` + correct `specialistSeverity` without blocking `proceed`.
- Red vs amber render the correct copy and CTA order.

**Key files:** `shared/evaluation-config.ts`, assessment UI, `shared/schema.ts` (populate insolvent/dispute)

**Depends on:** PS-1, PS-2

**Deferred:** clear-or-confirm deep follow-ups that downgrade a coarse flag.

---

## PS-5 — Readiness gate router + pay/submit split + warm handoff

**Why:** Binary `application_ready` can't express the four different meanings of "not ready", and payment must be decoupled from role (anyone pays, only the entitled applicant submits).

**Scope**

- Turn the gate into a router: `ready | handoff | specialist | fix_required`.
- Predicates:
  ```ts
  canPay = !application_blocked
    && specialistSeverity !== 'red'
    && (specialistSeverity !== 'amber' || amberAcknowledged);
  canSubmit = canPay && applicantIsEntitled && statementOfTruthSigned && structuralRequirementsMet;
  ```
- Amber-dismiss: per-flag acknowledge ("this is minor, continue") + "dismiss all minor"; record who/which/when. Red is non-dismissible.
- `fix_required` split: structural problems (>4 applicants; under-18 beneficiary with <2 applicants) block **generation**; IHT is a **timing warning** (HMRC must process before filing), not a block. Do not tell users to complete an IHT400 the product now fills (reconcile with `dec-iht-form-strategy`).
- Warm handoff on red flag: explicit opt-in consent → structured case summary to partner → logged referral event for attribution.
- Helper handoff completion: helper can gather/pay/generate; signing + submitting reserved to the entitled applicant.

**Acceptance criteria**

- Only jurisdiction block and a sticky red flag stop payment.
- A helper can pay; submission is blocked until the entitled applicant signs.
- No paid-but-unfileable forms (structural blockers gate generation).
- Referral sends a case summary only after explicit consent and logs the event.

**Key files:** `shared/evaluation-config.ts`, `server/routes/evaluation.ts`, `server/routes/cases.ts`, `client/src/components/evaluation/EvaluationResults.tsx`, checkout + referral UI

**Depends on:** PS-1, PS-2, PS-4 · **Touches:** `dec-iht-form-strategy`, `dec-pricing-model`

**Deferred:** partner API integration (email-format handoff acceptable for v1).
