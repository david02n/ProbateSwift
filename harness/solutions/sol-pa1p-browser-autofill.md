---
id: sol-pa1p-browser-autofill
type: solution
title: Browser-extension autofill of the GOV.UK online probate service
status: draft
evidence: assumption
created_by: agent
created: 2026-06-11
source: user idea 2026-06-11; HMRC/HMCTS submission research (PA1P online service has no public API)
links:
  realized_by: []
  relates_to: [opp-iht-form-assistant]
---

## Solution
A Chrome (browser) extension that autofills the **GOV.UK / HMCTS online probate application** using the answers already captured in ProbateSwift. Because the online service has no public API, this fills it in the user's own browser session rather than e-filing via API — the user stays logged in, reviews, and clicks submit themselves.

Targets the PA1P/PA1A online route specifically (the fast path: ~under 4 weeks vs up to ~15 for paper, ~80–92% of grants). Does **not** apply to IHT400, which is paper-only with wet signatures.

## How it scores
Feasibility 🟡 medium — DOM-mapping the GOV.UK service fields and keeping the extension in sync as HMCTS changes the UI; needs a distribution/install step for users. Value 🟢 high — unlocks the fast online route without paper PA1P, and the user does the final submit so liability stays lower than us filing. Complexity 🟡 medium. Time-to-learn ✅ high payoff.

## Trade-offs vs the PDF route
- **vs prefill paper PA1P PDF** ([[sol-guided-iht400]] output): the extension gives the faster online grant and no printing for PA1P, but is more brittle (breaks when GOV.UK changes its form) and needs the user to install an extension.
- Keeps user-in-the-loop submit, which is good for liability and for staying clear of "providing a filing service."
- Maintenance risk: any GOV.UK markup change can break autofill silently — needs monitoring.

## Open questions
- Extension install friction acceptable for a one-time probate user?
- Build + maintain the extension, or ship the paper-PA1P PDF first and add the extension later as the "fast route" upgrade?
- Same idea could later assist other online gov forms in the flow.
