---
id: sol-flat-fee-checkout
type: solution
title: £297 one-time flat-fee tier + checkout (priced, not transactable)
status: needs_user_input
evidence: assumption
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: client/src/components/sections/Pricing.tsx (£297 one-time fee); client/src/pages/TermsPage.tsx (fees clause); no payment dependency in package.json
links:
  realized_by: []
  relates_to: [opp-flat-fee-positioning]
---

## Solution
A single low flat fee positioned against percentage-based estate-admin pricing. The landing page already advertises **£297 one-time, "pay when you're ready to submit"**, and the Terms reference paid plans — but there is **no payment integration** in the codebase (no Stripe/checkout dependency, no billing route).

## How it scores
Feasibility ✅ high to add (standard checkout). Value ✅ high — pricing is the core wedge vs % fees and the free DIY route. Complexity 🟢 low technically. Time-to-learn ✅ n/a.

## Trade-offs
Marketing and product pricing are currently out of sync: a concrete £297 is shown publicly, yet `goals.md`/[[opp-flat-fee-positioning]] still flag the price point as `needs_user_input`, and nothing collects payment. Needs a decision on (a) confirm £297 vs benchmark-and-test, and (b) when/how to gate behind payment — see [[dec-pricing-model]].
