---
id: dec-pricing-model
type: decision
title: Flat-fee price point & when to charge
status: needs_user_input
evidence: assumption
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: client/src/components/sections/Pricing.tsx (£297 advertised); goals.md / opp-flat-fee-positioning (price flagged unconfirmed); no payment integration in package.json
links:
  chosen: []
  rejected: []
  relates_to: [opp-flat-fee-positioning]
---

## Decision
**Open / inconsistent.** The landing page already advertises a concrete **£297 one-time fee**, but `goals.md` and [[opp-flat-fee-positioning]] still record the price point as `needs_user_input`, and there is no payment integration in the codebase.

## Alternatives considered
- **Confirm £297** as the public flat fee and build checkout.
- **Benchmark-and-test** a price against the competitor set (Farewill, Co-op, Kings Court Trust) and the free £300 DIY route before committing.

## Open questions for the user
1. Is £297 the committed price, or a placeholder to be validated?
2. When is payment collected — "pay when ready to submit" (as the copy says), upfront, or at case creation?
3. Is there a free self-serve tier beneath the paid one (the vision mentions a low-cost self-serve tier)?

## Reversal conditions
Re-price after willingness-to-pay testing; align marketing copy, Terms, and the (not-yet-built) [[sol-flat-fee-checkout]].
