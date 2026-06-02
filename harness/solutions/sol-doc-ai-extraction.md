---
id: sol-doc-ai-extraction
type: solution
title: AI document extraction — auto-populate people/assets/liabilities
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: server/services/documentProcessor.ts (Gemini 2.0 Flash); server/routes/documents.ts (fire-and-forget persist); server/s3.ts
links:
  realized_by: []
  relates_to: [opp-estate-dashboard]
---

## Solution
On document upload, the file is stored in S3 and sent to Gemini 2.0 Flash with a strict JSON-only extraction prompt that pulls out people (deceased, next of kin, executors), assets (property/bank/investment/pension/vehicle) and liabilities (mortgage/loan/tax). Results are persisted to the estate tables fire-and-forget, so a death certificate or bank statement auto-fills the dashboard.

## How it scores
Feasibility ✅ shipped. Value 🟢 high — this is the lever that turns the data-entry burden into "upload and review", the real differentiator on [[opp-estate-dashboard]]. Complexity 🟡 medium (LLM + S3 + persistence). Time-to-learn ✅ near-zero for the user.

## Trade-offs
Extraction can be wrong or partial; "do not guess, use null" mitigates but the user must still verify. Fire-and-forget means failures are silent to the request; depends on `GEMINI_API_KEY`. Same model could power [[sol-llm-triage]] later.
