---
id: opp-presubmission-validation
type: opportunity
title: Pre-submission validation to prevent "stopped" applications
status: ready_for_review
evidence: supported
delivery: partial
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: prob-stopped-applications; Inside HMCTS / ICAEW stop-reason data; shared/evaluation-config.ts (readiness flags)
links:
  addresses: [prob-stopped-applications, prob-iht-forms-complexity]
  realized_by: [sol-readiness-gate, sol-rule-flag-engine, sol-personalised-task-list]
  relates_to: [vision, goals]
---

## Opportunity
A checklist/validation layer that catches the documented stop causes before the user submits: missing
certified death certificate, missing/unsigned original will, name discrepancies, executor evidence
(renunciation/death), and submitting before HMCTS has IHT421 (~21-day lag).

## Desired outcome
First-time-right submissions — users avoid the ~21-week stopped-queue and clear in ~5 weeks. Fewer
stops is a measurable, marketable proof point ("X% fewer stops than DIY").

## Why it's worth it
Hits goal 3 (reduce time/cost) head-on with a quantifiable outcome; turns a known systemic failure
(stops doubling admin time) into ProbateSwift's signature value.

## Open assumptions & risks
- Need to validate that ProbateSwift can actually access/verify these items pre-submission.
- Stop-reason mix may shift as HMCTS digitises further.
