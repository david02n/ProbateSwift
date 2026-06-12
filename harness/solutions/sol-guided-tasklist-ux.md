---
id: sol-guided-tasklist-ux
type: solution
title: Guided, generated task list — linear feel over a branchy, slow journey
status: draft
evidence: assumption
created_by: agent
created: 2026-06-11
updated: 2026-06-11
source: David session 2026-06-11; dec-lifecycle-scope; dec-customer-journey-intake; sol-personalised-task-list; sol-milestone-gamification; docs/guided-tasklist-mockup.html; docs/full-lifecycle-journey-map.svg
links:
  realizes: [opp-estate-dashboard, opp-guided-triage]
  relates_to: [sol-personalised-task-list, sol-milestone-gamification, sol-estate-dashboard, dec-lifecycle-scope]
---

## Solution
The 7-phase, 9–18 month journey is delivered as a single guided task list that *feels* linear to a first-timer even though it branches and stalls underneath. Mockup: `docs/guided-tasklist-mockup.html`.

## Design decisions (David, 2026-06-11)
- **Generated, not static.** Tasks derive from the `intake` answers/flags (one record), so branches (will/no-will, IHT400/excepted, executor/helper) resolve into one tailored path — it reads as one clean line.
- **Two task modes carry momentum:** `your move` (actionable now) vs `awaiting reply` (parked, timestamped, auto-chased). There is always exactly one elevated "your next step" and never a blank "wait" screen.
- **Phase-level list + sub-trackers.** Top level = the 7 phases (short, calm, whole-map visible with current phase open). Detail (e.g. the per-institution valuation tracker) lives one level down inside the open phase.
- **Whole map visible from the start**, current step expanded — orients a first-timer and sets expectations that it's ~a year.
- **Surface parallel prep during waits.** The "while you wait" area pulls forward later-phase tasks that have no dependency on outstanding values/grant (list beneficiaries, locate the will).
- **Phase gates + milestone celebration** mark "you're ready for X" so users never wonder if they've done enough.

## Two details to specify before/at build
1. **"Next step" priority rule:** when several tasks are doable, elevate critical-path-in-current-phase first, then pulled-forward prep. Never nudge phase-7 busywork while a phase-2 blocker sits idle.
2. **Parallel-prep whitelist:** an explicit list of later-phase tasks safe to start early (no dependency on values or the grant), or the list will surface things users can't finish.

## Evidence / status
`assumption` — not user-validated. Extends shipped work (`sol-personalised-task-list`, `sol-milestone-gamification`, estate dashboard, `intake`/`/api/intake/*`). Validate trust + that first-timers want guided generation over a static checklist.
