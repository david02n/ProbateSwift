---
id: dec-pricing-model
type: decision
title: Flat-fee price point & when to charge
status: ready_for_review
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-11
decided_by: user
source: client/src/components/sections/Pricing.tsx (£297 advertised); goals.md / opp-flat-fee-positioning (price flagged unconfirmed); no payment integration in package.json; user decision 2026-06-11
links:
  chosen: [sol-flat-fee-checkout]
  rejected: []
  relates_to: [opp-flat-fee-positioning]
---

## Decision
**Resolved (David, 2026-06-11). Price committed at £295.** Three parts:

1. **£295 flat fee, committed — acquisition-first.** Updated 2026-06-11: David chose to commit to £295 (not run a price test first) to maximise getting users in and proving value. The £1,290 Octopus IHT anchor makes £295 a strong wedge. Earlier benchmark-and-test stance is superseded by the deliberate acquisition play. Re-pricing is a *later* move once there's a user base and proven value.
2. **Charge at the point of submission** — "free to use, pay when ready to submit." Rationale: low barrier to start, and by the time the user reaches submission they've built the whole case in-app, so the investment / sunk-cost bias works in favour of conversion. The free assessment carries acquisition, so price doesn't gate top-of-funnel.
3. **One paid SKU, no separate free tier.** The product is free to use up to the paywall at form generation / submission; there is no permanently feature-limited free plan to maintain. This is freemium by funnel, not by tier. (Reconciles with `vision.md`'s "low-cost self-serve tier": the self-serve product *is* that tier; "free" is the trial portion of the funnel, not a distinct plan.)

## Alternatives considered
- **Benchmark-and-test the price before committing** — considered and set aside 2026-06-11; David prioritised speed and acquisition over price optimisation at this stage.
- **Test a higher number (£399–£499)** — the free assessment decouples acquisition from price so a higher test wouldn't hurt signups, but rejected for now in favour of the simplest, most generous entry point to get users in.
- **Separate free tier** alongside paid — rejected; charge-at-submission already gives a free-to-start funnel.

## Rationale & evidence
Acquisition and proof-of-value beat price optimisation at this stage. £295 is far below every paid competitor (Octopus £1,290 for IHT forms; Farewill/KCT/banks higher), making the value obvious. Charge-at-submission maximises commitment at the moment of value. Single SKU keeps build and ops simple.

## Reversal conditions
Revisit price after there's a base of users and value is proven (a future WTP test). On any price change, align marketing copy, Terms, and [[sol-flat-fee-checkout]].
