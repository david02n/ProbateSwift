---
id: sol-readiness-gate
type: solution
title: Pre-submission readiness gate (blockers & missing requirements)
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: shared/evaluation-config.ts (application_blocked, missing_requirements, application_ready, pa1p_sections)
links:
  realized_by: []
  relates_to: [opp-presubmission-validation]
---

## Solution
The flag engine emits a readiness verdict before anything is submitted: `application_blocked` (+`blocker_reason`) for unsupported jurisdiction; `missing_requirements[]` for things like "IHT400 must be submitted to HMRC first", ">4 applicants", or "≥2 applicants required when under-18 beneficiaries"; and `application_ready` only when nothing is outstanding. `pa1p_sections` flags which PA1P sections (D/E/F/G) this case must complete.

## How it scores
Feasibility ✅ shipped. Value ✅ high — directly targets the "stopped application" pain that doubles HMCTS delays. Complexity 🟢 low. Time-to-learn ✅ instant.

## Trade-offs
Catches structural/eligibility errors but not data-quality errors (typos, mismatched names, missing valuations) that also stop applications. A document- or content-level validator would extend coverage. Depends on [[sol-rule-flag-engine]].
