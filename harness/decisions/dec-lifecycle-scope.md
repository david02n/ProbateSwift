---
id: dec-lifecycle-scope
type: decision
title: Product scope spans the full estate lifecycle to distribution; IHT400 is the primary happy path
status: ready_for_review
evidence: researched
created_by: agent
created: 2026-06-11
updated: 2026-06-11
source: David session 2026-06-11; web research (GOV.UK, Gazette, Co-op Legal, AfterLoss); docs/full-lifecycle-journey-map.svg; opp-estate-dashboard; dec-iht-form-strategy; dec-pricing-model
links:
  chosen: []
  rejected: []
  relates_to: [opp-estate-dashboard, sol-estate-dashboard, sol-milestone-gamification, dec-iht-form-strategy, dec-pricing-model, dec-customer-journey-intake]
---

## Decision
The realistic customer journey is ~9–18 months and has seven phases, not the qualify→evaluate→forms slice. **David's calls (2026-06-11):**

1. **Scope = full lifecycle to distribution.** The product is a companion from estate valuation, through the grant, and on through asset collection, the Gazette creditor notice, estate accounts and distribution — not "done at the grant." This maps onto the existing `opp-estate-dashboard` / milestones / doc-AI work. Form generation is the **paid milestone in the middle (phase 4)**, not the endpoint.
2. **IHT400 return is the primary happy path to design around** (full return with tax due), with the excepted-estate path as the shorter branch.

## The seven phases (happy path, IHT400 estate)
1. **Qualify (assessment)** — day 0, free. Grant needed, executor route.
2. **Value the estate (evaluation)** — weeks 1–8, free. Write to banks/NS&I/registrar, value the house, list debts. **The real long pole** — institutions reply over days/weeks. Product = notification letters, reply tracker, doc-AI on statements.
3. **Prepare the IHT return** — once values in. Tax due → not excepted → IHT400 + schedules (405/406/435–436).
4. **Pay £295, then the strict IHT sequence.** IHT must be paid **before** the grant: Direct Payment Scheme (IHT423) pays HMRC from the deceased's accounts (house tax by instalments); post the paper IHT400; wait ~15–20 working days for HMRC's **unique code** (replaced the IHT421 stamp since Jan 2024). IHT due within 6 months of death to avoid interest.
5. **Apply for probate** — after the code. Online (PA1P autofill route), enter the code, pay the separate **£300** HMCTS fee, post original will + death certificate, sign statement of truth.
6. **Grant issued** — ~4–12 weeks. Order sealed office copies (~£1.50 each), one per holder.
7. **Administer & distribute** — months 4–12. Collect funds, sell/transfer house, settle debts + IHT instalments; **Gazette + local Trustee Act notice** (2-month creditor window) to cap executor liability; estate accounts; distribute, holding final distribution ~6 months post-grant (1975 Act safety). Estate closed.

## Excepted-estate branch (the common, shorter path)
Post-2022 most estates are excepted (gross < £3M, no tax): **no IHT400**, values reported directly on the probate application, **no HMRC-code wait** — phase 5 follows phase 2 directly. Designed as the branch, not the default, per David.

## Rationale & evidence
Sources: GOV.UK (apply for probate, £300 fee, 4–16wk grant), Gazette (timescales), excepted-estate reform to £3M (Timms/Gazette), IHT400 code process from Jan 2024 (Clark Willis/Wansbroughs), Direct Payment Scheme + 20-working-day code (Roche Legal), administration steps + 9–18mo + executor's year (GN Law, Premier). The paid deliverable (phases 3–5) is a fraction of a year-long relationship; retention and differentiation live in phases 2 and 6–7, which the dashboard/milestones already target.

## Implications / open
- Build implication: the estate-dashboard, valuation-letter generation, Gazette-notice prompt, estate accounts and distribution tracking become first-class, not adjacent.
- Reconcile readiness IHT timing (PS-5) with this strict sequence.
- Open: whether the Gazette notice and conveyancing hand-off are in-product or signposted; whether interim vs final distribution is tracked.
