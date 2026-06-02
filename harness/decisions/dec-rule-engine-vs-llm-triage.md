---
id: dec-rule-engine-vs-llm-triage
type: decision
title: Triage built as a deterministic rule engine, not an LLM
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: shared/evaluation-config.ts (pure-function flag derivation); server/routes/evaluation.ts (server-side derivation)
links:
  chosen: sol-rule-flag-engine
  rejected: [sol-llm-triage]
  relates_to: [opp-guided-triage]
---

## Decision
Eligibility and case routing are implemented as deterministic pure functions, with flags always derived server-side.

## Alternatives considered
[[sol-llm-triage]] — a conversational LLM front end (Gemini is already integrated for documents). Not used for triage.

## Rationale & evidence
For a legal-adjacent product, mis-routing PA1P/PA1A or missing an IHT400 trigger is high-stakes; rule-based logic is auditable, testable and reproducible. The code shows zero LLM involvement in `deriveEvaluationFlags`/`deriveLandingPageResult`.

## Reversal conditions
If abandonment on the fixed question tree is high, revisit adding an LLM *input* layer that maps free text onto the same flags, with the rule engine validating output.
