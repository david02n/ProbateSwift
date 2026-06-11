---
id: sol-flat-fee-checkout
type: solution
title: Single flat-fee checkout, gated at submission (priced, not yet transactable)
status: draft
evidence: assumption
created_by: agent
created: 2026-06-03
updated: 2026-06-11
source: client/src/components/sections/Pricing.tsx (£297 one-time fee); client/src/pages/TermsPage.tsx (fees clause); no payment dependency in package.json; dec-pricing-model (user decision 2026-06-11)
links:
  realized_by: []
  relates_to: [opp-flat-fee-positioning]
---

## Solution
A single low flat fee positioned against percentage-based estate-admin pricing. Per [[dec-pricing-model]] (David, 2026-06-11): **one paid SKU, free to use up to the paywall, charge at the point of submission** ("pay when ready to submit"). The exact price is **benchmark-and-test, not committed** — £297 on the landing page is provisional pending willingness-to-pay testing. No payment integration exists in the codebase yet (no Stripe/checkout dependency, no billing route).

## How it scores
Feasibility ✅ high to add (standard checkout, e.g. Stripe). Value ✅ high — pricing is the core wedge vs % fees and the free DIY route. Complexity 🟢 low technically. Time-to-learn ✅ n/a.

## Build shape (decided model)
- Free to use through triage, dashboard, and case build.
- Paywall gates **form generation / submission** — the point where [[sol-guided-iht400]] outputs the completed PDFs.
- Single price, one-time. Number set after WTP test, then aligned across Pricing copy, Terms, and checkout.

## Trade-offs / open
Charge-at-submission means the checkout must sit at the form-output step, not at signup — coordinate with the guided-completion build. Price number is still `assumption`-level until tested.
