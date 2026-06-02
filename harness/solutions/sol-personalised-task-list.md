---
id: sol-personalised-task-list
type: solution
title: Personalised task list generated from derived flags
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: shared/milestone-config.ts (generatePersonalisedTasks)
links:
  realized_by: []
  relates_to: [opp-guided-triage, opp-presubmission-validation]
---

## Solution
`generatePersonalisedTasks(flags)` converts the derived flags into a prioritised, deduplicated checklist of the *specific* legal steps this user must take — e.g. PA1P vs PA1A, "upload the original will", IHT400 vs excepted-estate declaration, renunciation (PA15), certified translations, alias evidence, death certificate, swear oath, submit. If `application_blocked` it returns a single "consult a specialist" task and stops.

## How it scores
Feasibility ✅ shipped. Value ✅ high — this is the bridge from "what's my situation" to "what do I do next", the core self-serve promise. Complexity 🟢 low (priority-sorted list). Time-to-learn ✅ trivial.

## Trade-offs
Tasks are static descriptions with a target dashboard tab, not yet interactive form-filling. It tells the user *what* to do, not yet *does* it for them — the richer version is [[sol-guided-iht400]]. Quality is only as good as the flags from [[sol-rule-flag-engine]].
