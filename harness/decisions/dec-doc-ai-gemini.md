---
id: dec-doc-ai-gemini
type: decision
title: Gemini 2.0 Flash chosen for document data extraction
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: server/services/documentProcessor.ts; package.json (@google/generative-ai)
links:
  chosen: sol-doc-ai-extraction
  rejected: []
  relates_to: [opp-estate-dashboard]
---

## Decision
Uploaded documents are sent to Google Gemini 2.0 Flash with a strict JSON-only prompt to extract people, assets and liabilities.

## Alternatives considered
Other vision/LLM providers (OpenAI, Anthropic, AWS Textract) — not present in the codebase. No record of a formal comparison; the choice is visible only as the implemented dependency.

## Rationale & evidence
`@google/generative-ai` is the only AI SDK in `package.json`; `documentProcessor.ts` pins `gemini-2.0-flash`. Likely chosen for low cost/latency on a high-volume, low-margin self-serve product.

## Reversal conditions
If extraction accuracy on UK probate documents proves unreliable, or cost/availability shifts, swap providers behind the `processDocument` interface. Confirm with the user whether the provider choice was deliberate or incidental.
