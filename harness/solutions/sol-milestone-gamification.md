---
id: sol-milestone-gamification
type: solution
title: Milestone progression system (game-like staging)
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: shared/milestone-config.ts (MILESTONES, TASK_CATEGORIES, getMilestoneProgress/getNextMilestone); client/src/components/milestones
links:
  realized_by: []
  relates_to: [opp-estate-dashboard]
---

## Solution
Four ordered milestones ("Initial Assessment Complete" → "People & Roles" → "Estate Scope" → "Comprehensive Assessment") that unlock task categories as the user completes evaluation sections, framed like game levels to give momentum through a daunting process.

## How it scores
Feasibility ✅ shipped. Value 🟡 medium — reduces overwhelm and gives a sense of progress, addressing the emotional-burden pain. Complexity 🟢 low. Time-to-learn ✅ instant.

## Trade-offs
Note: `getUnlockedTabs` currently returns *all* tabs regardless of milestone (gating is for progress display, not hard access) — so it's motivational scaffolding, not a forced funnel. Tone risk: "game levels" framing around bereavement must be handled sensitively. Complements [[sol-estate-dashboard]].
