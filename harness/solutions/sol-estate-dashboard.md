---
id: sol-estate-dashboard
type: solution
title: Estate dashboard — cases, people, assets, liabilities, documents, tasks
status: draft
evidence: supported
created_by: agent
created: 2026-06-03
updated: 2026-06-03
source: shared/schema.ts (probate_cases, people, estate_assets, estate_liabilities, documents, tasks); client/src/pages (dashboard, estate, people, documents, deceased); server/routes/*
links:
  realized_by: []
  relates_to: [opp-estate-dashboard]
---

## Solution
A single place to hold an estate while it's being administered: a `probate_cases` record with tabs for people/executors, assets, liabilities, documents and tasks, each backed by its own table and CRUD API route (`cases`, `people`, `estate`, `documents`, `deceased`, `evaluation`). React Query + Zustand on the client; Drizzle/Postgres on the server.

## How it scores
Feasibility ✅ shipped (full stack wired end-to-end per latest commit). Value ✅ high — directly addresses the fragmented, emotionally-draining admin burden. Complexity 🟡 medium (broad surface, but conventional CRUD). Time-to-learn 🟡 amber — a multi-tab data-entry app still asks a grieving user to do real work.

## Trade-offs
Comprehensive but data-entry heavy on its own; the burden is only lifted when paired with [[sol-doc-ai-extraction]] (auto-populate) and [[sol-milestone-gamification]] (motivation/sequencing).
