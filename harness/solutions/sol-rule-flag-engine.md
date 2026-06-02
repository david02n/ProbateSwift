---
id: sol-rule-flag-engine
type: solution
title: Deterministic eligibility & flag engine (rule-based)
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: shared/evaluation-config.ts (deriveLandingPageResult, deriveEvaluationFlags); server/routes/evaluation.ts
links:
  realized_by: []
  relates_to: [opp-guided-triage, opp-presubmission-validation]
---

## Solution
A pure-function rule engine that turns answers into a structured outcome. Two layers, both shipped:
- **Landing eligibility** (`deriveLandingPageResult`) — 6 questions → `eligible`, `probateRequired`, `nextSteps`, `warnings`.
- **In-app flags** (`deriveEvaluationFlags`) — 5 detailed sections → `probate_type` (PA1P vs PA1A), `iht400_required`, `estate_likely_excepted`, `needs_specialist_advice`, `pa1p_sections`, `application_blocked`, `application_ready`. Flags are always derived server-side in the POST handler, so the client can't spoof them.

## How it scores
Feasibility ✅ high (already in code). Value ✅ high — it's the spine of triage, IHT routing, and the readiness gate. Complexity 🟡 medium — branching logic lives in one ~170-line function; correctness depends on E&W probate rules staying current. Time-to-learn ✅ instant for the user.

## Trade-offs
Deterministic and auditable (good for a legal product) but rigid — every new edge case is a hand-coded branch. No natural-language input; the user must map their situation onto fixed boolean questions. Contrast with [[sol-llm-triage]].
