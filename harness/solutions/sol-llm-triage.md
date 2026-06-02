---
id: sol-llm-triage
type: solution
title: LLM-driven conversational triage (alternative, not built)
status: draft
evidence: assumption
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: inferred alternative to shared/evaluation-config.ts; Gemini already integrated via server/services/documentProcessor.ts
links:
  realized_by: []
  relates_to: [opp-guided-triage]
---

## Solution
Instead of a fixed question tree, let the user describe their situation in free text and have an LLM (Gemini is already wired in for document extraction) ask follow-ups and emit the same flag set. The deterministic engine would validate/guard the LLM's output.

## How it scores
Feasibility 🟡 medium — Gemini SDK already present, but reliability/hallucination control is hard. Value 🟢 potentially higher (handles messy real-world phrasing, fewer abandoned forms). Complexity 🔴 high — needs guardrails, eval harness, and a fallback to rules. Time-to-learn ✅ very low for the user.

## Trade-offs
More forgiving UX but legally risky if the model misclassifies a case (e.g. mis-routes PA1P/PA1A or misses an IHT400 trigger). For a regulated-adjacent product the auditability of [[sol-rule-flag-engine]] won — see [[dec-rule-engine-vs-llm-triage]]. Could return as an input layer on top of the rules.
