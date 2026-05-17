# Project Plan

## 1. Purpose of this plan

This plan turns the current Probate Navigator prototype into a more stable, reviewable, and productisable foundation.

The immediate goal is not to launch a full probate product. The immediate goal is to make the prototype coherent enough that collaborators can assess, improve, and decide what product direction is worth pursuing.

This means the first phase is mostly stabilisation:

- Fix auth and identity.
- Make case ownership reliable.
- Replace stub routes with real APIs.
- Align evaluation questions with derived logic.
- Remove obsolete probate/IHT assumptions.
- Make the app usable end-to-end for a simple draft case.

## 2. Working assumptions

- Repository: `david02n/ProbateNavigator`.
- Default branch: `main`.
- Current codebase is a prototype, not production-ready.
- Clerk should be the authentication source of truth unless deliberately changed.
- The first product focus is England and Wales probate.
- The first product path should support simple, low-complexity probate journeys.
- Complex estates should be detected and routed out, not handled end-to-end in v1.

## 3. Delivery principles

- Fix foundations before adding features.
- Prefer small pull requests.
- Keep product logic explicit and testable.
- Do not trust client-provided user IDs.
- Treat uploaded probate documents as sensitive.
- Avoid obsolete IHT205 references.
- Use plain English in user-facing probate guidance.
- When in doubt, route complex cases to professional advice rather than pretending certainty.

## 4. Phase overview

## Phase 0: Repo orientation and safety

Goal: make it easy for contributors to understand what exists and how to run it.

Deliverables:

- `README.md` with setup instructions.
- `.env.example` with required environment variables.
- Clear local dev instructions.
- Known issues section linking to `Technical Review.md`.
- Basic contribution guidelines.

Suggested issues:

1. Add README setup guide.
2. Add `.env.example`.
3. Document current app architecture.
4. Add contribution workflow and PR expectations.

Exit criteria:

- A new contributor can clone the repo, install dependencies, configure env, and run the app locally.

## Phase 1: Auth and identity stabilisation

Goal: remove the persistent auth confusion and make user ownership reliable.

Key decisions:

- Use Clerk as the only auth source of truth.
- Use Clerk user ID consistently across app-owned data, unless an internal numeric user ID model is deliberately introduced.

Work items:

1. Remove or neutralise unnecessary Express session usage.
2. Confirm Clerk middleware works in local and deployed environments.
3. Make `requireClerkAuth` the standard guard for protected APIs.
4. Fix schema user ID types.
5. Ensure all storage methods use the same user ID type.
6. Ensure all case/domain data is scoped to the authenticated user.
7. Remove any frontend reliance on fake user IDs or fake case IDs.

Deliverables:

- Auth architecture note.
- Updated schema.
- Migration or Drizzle push path.
- Protected route pattern.
- Auth smoke test route.

Suggested issues:

1. Standardise user ID model around Clerk IDs.
2. Remove legacy Express session dependency from auth flow.
3. Add `getAuthenticatedUser` helper for route handlers.
4. Add route ownership helper: `assertCaseBelongsToUser`.
5. Remove hardcoded fallback case in evaluation page.

Exit criteria:

- A signed-in user can call a protected endpoint.
- An unauthenticated request gets 401.
- A signed-in user can only access their own case data.
- No hardcoded user or case IDs remain.

## Phase 2: Case lifecycle API

Goal: create a real persisted probate case journey.

Work items:

1. Add current-case endpoint.
2. Add start-case endpoint.
3. Add case update endpoint.
4. Add status/progress fields handling.
5. Ensure new users can create a draft case.
6. Ensure returning users can resume a draft case.

Recommended API:

- `GET /api/probate-cases/current`
- `POST /api/probate-cases/start`
- `GET /api/probate-cases/:caseId`
- `PATCH /api/probate-cases/:caseId`

Deliverables:

- Working case creation/resume flow.
- Frontend dashboard connected to real current case.
- No fake empty responses for authenticated case data.

Suggested issues:

1. Implement current probate case API.
2. Implement start draft case API.
3. Connect dashboard to current case endpoint.
4. Add empty-state CTA for users without a case.
5. Add basic API tests for case ownership.

Exit criteria:

- New authenticated user can start a draft probate case.
- Existing authenticated user can resume their case.
- Dashboard displays real case state.

## Phase 3: Evaluation flow repair

Goal: make the detailed evaluation save, resume, and derive correct routing flags.

Current issue:

The question config and derived flag logic use different key systems. This must be fixed before the evaluation can be trusted.

Work items:

1. Define canonical question keys.
2. Rewrite `deriveEvaluationFlags()` using current keys.
3. Remove all obsolete `q1_`, `q2_`, etc. references unless deliberately retained.
4. Remove `IHT205` references.
5. Add modern IHT/excepted estate routing flags.
6. Implement evaluation response API.
7. Connect frontend auto-save to real backend.
8. Add completion logic.
9. Add out-of-scope blocker logic.

Recommended API:

- `GET /api/evaluation/:caseId`
- `POST /api/evaluation/:caseId`
- `PATCH /api/evaluation/:caseId`

Recommended derived flags:

- `jurisdiction_supported`
- `has_will`
- `probate_type`
- `eligible_to_apply`
- `application_blocked`
- `blocker_reason`
- `estate_likely_excepted`
- `iht400_required`
- `hmrc_iht_submission_required`
- `needs_estate_detail_capture`
- `needs_will_upload`
- `needs_death_certificate`
- `needs_non_applying_executor_info`
- `needs_two_applicants`
- `needs_specialist_advice`
- `application_ready`
- `missing_requirements`

Suggested issues:

1. Rewrite evaluation flags using canonical keys.
2. Remove obsolete IHT205 logic.
3. Implement evaluation GET/POST/PATCH API.
4. Connect EvaluationFlow autosave to API.
5. Add tests for evaluation routing scenarios.
6. Add user-facing blocker states for out-of-scope cases.

Exit criteria:

- User can start evaluation.
- Answers auto-save.
- User can refresh and resume where they left off.
- Derived flags reflect actual answers.
- Out-of-scope cases are clearly blocked/routed.

## Phase 4: People and deceased details

Goal: support the people data needed for a simple probate application.

Work items:

1. Rename confusing `executors` code references where practical, because the table represents people.
2. Implement people CRUD endpoints.
3. Support deceased person record.
4. Support applicant/executor roles.
5. Implement deceased-specific questionnaire storage.
6. Implement completion status logic.
7. Connect frontend people/deceased pages to API.

Recommended API:

- `GET /api/cases/:caseId/people`
- `POST /api/cases/:caseId/people`
- `PATCH /api/cases/:caseId/people/:personId`
- `DELETE /api/cases/:caseId/people/:personId`
- `GET /api/people/:personId/deceased-form-fields`
- `PUT /api/people/:personId/deceased-form-fields`
- `GET /api/people/:personId/deceased-form-fields/completion`

Suggested issues:

1. Implement people CRUD API.
2. Connect people page to current case.
3. Implement deceased form fields API.
4. Add completion logic for deceased details.
5. Replace `/api/executors` frontend naming with people-oriented naming where feasible.

Exit criteria:

- User can add deceased.
- User can add applicant/executor.
- Deceased details can be completed and resumed.
- Dashboard reflects completion state.

## Phase 5: Estate capture

Goal: support basic assets/liabilities and estate summary.

Work items:

1. Implement asset CRUD.
2. Implement liability CRUD.
3. Calculate gross estate value.
4. Calculate net estate value.
5. Flag missing estate information where required by evaluation.
6. Connect estate page to real APIs.

Recommended API:

- `GET /api/cases/:caseId/assets`
- `POST /api/cases/:caseId/assets`
- `PATCH /api/cases/:caseId/assets/:assetId`
- `DELETE /api/cases/:caseId/assets/:assetId`
- `GET /api/cases/:caseId/liabilities`
- `POST /api/cases/:caseId/liabilities`
- `PATCH /api/cases/:caseId/liabilities/:liabilityId`
- `DELETE /api/cases/:caseId/liabilities/:liabilityId`

Suggested issues:

1. Implement assets API.
2. Implement liabilities API.
3. Add estate totals service.
4. Connect estate page to current case data.
5. Add basic estate validation.

Exit criteria:

- User can add/edit/delete assets and liabilities.
- Dashboard can display estate totals.
- Evaluation flags can trigger estate capture requirements.

## Phase 6: Documents

Goal: support basic document upload and document status tracking.

Prototype approach:

- Local upload may be acceptable for local development only.

Productisation approach:

- Private object storage.
- Metadata in database.
- Access scoped to authenticated user and case.
- File validation.
- Document status lifecycle.

Work items:

1. Implement document list endpoint.
2. Implement document upload endpoint.
3. Validate file size and type.
4. Store document metadata.
5. Associate documents with case and user.
6. Track document type and status.
7. Connect documents page to real API.
8. Define future document processing pipeline separately.

Recommended API:

- `GET /api/cases/:caseId/documents`
- `POST /api/cases/:caseId/documents/upload`
- `PATCH /api/cases/:caseId/documents/:documentId`
- `DELETE /api/cases/:caseId/documents/:documentId`

Suggested issues:

1. Implement document metadata model usage.
2. Implement authenticated document upload.
3. Connect documents page to case documents.
4. Add document type selection.
5. Add required-document checklist from evaluation flags.
6. Document future secure storage requirements.

Exit criteria:

- User can upload a document to their case.
- User can see uploaded documents.
- Required documents are visible based on case state.

## Phase 7: Tasks and milestones

Goal: turn evaluation state into actionable next steps.

Work items:

1. Define task generation rules.
2. Generate default tasks for simple probate case.
3. Regenerate/update tasks when evaluation changes.
4. Show next recommended action.
5. Track task completion.
6. Connect milestone UI to real task/case data.

Suggested base tasks:

- Complete detailed evaluation.
- Add deceased details.
- Add applicant details.
- Upload death certificate.
- Upload will.
- Confirm IHT/excepted estate status.
- Add estate assets/liabilities if required.
- Review application readiness.

Recommended API:

- `GET /api/cases/:caseId/tasks`
- `POST /api/cases/:caseId/tasks/generate`
- `PATCH /api/cases/:caseId/tasks/:taskId`

Suggested issues:

1. Define milestone/task config.
2. Implement task generation service.
3. Implement tasks API.
4. Connect dashboard milestone progress to tasks.
5. Add next-action card.

Exit criteria:

- User sees a meaningful task list.
- Tasks reflect evaluation state.
- Completing required data updates progress.

## Phase 8: Productisation decision point

Goal: decide what this becomes commercially.

Potential directions:

### Option A: Consumer self-service probate preparation

User pays for guided preparation and document/application readiness.

Pros:

- Direct user value.
- Clear emotional pain.
- Good fit for simple estates.

Cons:

- Trust burden is high.
- Support burden may be high.
- Legal/compliance wording needs care.

### Option B: Probate provider intake/automation tool

Partner with probate businesses and improve intake, document collection, triage, and case preparation.

Pros:

- Lower direct legal risk.
- Existing businesses have demand and distribution.
- Can automate operational work.

Cons:

- B2B sales cycle.
- Product must fit existing workflows.
- Integration/customisation risk.

### Option C: Free assessment plus paid assisted review

User gets free assessment, then pays for review/preparation support.

Pros:

- Good acquisition wedge.
- Trust can build gradually.
- Human review can handle edge cases.

Cons:

- Requires operations layer.
- Margins depend on support cost.

Decision questions:

- Who trusts this product fastest?
- Who will pay first?
- What is the narrowest useful workflow?
- Which workflow has the fewest legal/compliance risks?
- Is AI a frontstage feature or backstage automation?

Exit criteria:

- Chosen target customer.
- Chosen v1 paid workflow.
- Clear scope boundaries.
- Pricing hypothesis.
- Launch experiment plan.

## 5. Suggested first GitHub issues

These are the first issues worth creating.

### Issue 1: Add README and local setup guide

Outcome:

A contributor can run the app locally.

Acceptance criteria:

- README includes install command.
- README includes dev command.
- README lists required env vars.
- README explains current prototype limitations.

### Issue 2: Standardise user ID model

Outcome:

All user-owned domain records use the same ID type as the authenticated user.

Acceptance criteria:

- Chosen identity model documented.
- Schema updated.
- Storage methods compile.
- No integer FK references to Clerk string IDs remain.

### Issue 3: Remove fake case fallback

Outcome:

Frontend no longer pretends a case exists.

Acceptance criteria:

- Hardcoded case ID removed.
- Evaluation page requires real current case.
- User without case sees create/start case state.

### Issue 4: Implement current case API

Outcome:

Authenticated users can create and resume a draft case.

Acceptance criteria:

- `GET /api/probate-cases/current` works.
- `POST /api/probate-cases/start` works.
- User cannot access another user's case.

### Issue 5: Implement evaluation API

Outcome:

Evaluation answers save and reload.

Acceptance criteria:

- `GET /api/evaluation/:caseId` works.
- `POST/PATCH /api/evaluation/:caseId` works.
- Answers stored as JSONB.
- Derived flags stored as JSONB.
- Case ownership enforced.

### Issue 6: Rewrite evaluation flags

Outcome:

Derived logic reflects current question keys.

Acceptance criteria:

- No stale `q1_` style keys unless part of canonical config.
- No IHT205 reference.
- Unit tests cover at least five scenarios.

### Issue 7: Implement people API

Outcome:

Users can add deceased/applicants/executors.

Acceptance criteria:

- People are tied to case and authenticated owner.
- Basic CRUD works.
- Frontend people page uses real data.

### Issue 8: Add API ownership tests

Outcome:

Core data protection is tested.

Acceptance criteria:

- Unauthenticated request returns 401.
- User A cannot read User B case.
- User A cannot write to User B case.

## 6. Suggested contributor roles

### Product owner

Owns:

- Scope decisions.
- Probate logic boundaries.
- User journey clarity.
- Acceptance criteria.

### Technical lead

Owns:

- Architecture decisions.
- Auth/data model cleanup.
- API patterns.
- Review quality.

### Frontend contributor

Owns:

- Dashboard polish.
- Evaluation UX.
- People/estate/document pages.
- Empty states and loading states.

### Backend contributor

Owns:

- Routes.
- Storage/services.
- Validation.
- Tests.
- Data ownership.

### Probate/domain reviewer

Owns:

- Accuracy of probate guidance.
- Out-of-scope rules.
- Plain-English explanations.
- Risk wording.

## 7. Definition of done

For any feature PR:

- Works locally.
- TypeScript passes.
- Uses authenticated user from server context.
- Does not trust client user IDs.
- Has clear empty/loading/error states where user-facing.
- Updates docs if product/domain logic changes.
- Adds or updates tests for domain logic.
- Avoids obsolete probate/IHT references.

## 8. Near-term milestone: stable demo

The first meaningful milestone is a stable demo where a collaborator can:

1. Sign in.
2. Start a probate case.
3. Complete evaluation.
4. Resume evaluation after refresh.
5. Add deceased details.
6. Add one applicant/executor.
7. Upload a placeholder document.
8. See a task list and next recommended action.

This demo does not need to produce a completed probate application. It needs to prove the end-to-end skeleton.

## 9. Risks

### Product risk

Users may not trust a digital probate assistant with sensitive estate information.

Mitigation:

- Be transparent.
- Start with guided preparation, not legal advice.
- Use clear routing to professional help.

### Legal/compliance risk

Probate and IHT guidance can become legal/tax advice if worded carelessly.

Mitigation:

- Use guidance language.
- Avoid guarantees.
- Get domain/legal review before public launch.

### Technical risk

The prototype has foundational inconsistencies.

Mitigation:

- Stabilisation first.
- No feature sprint until auth/case lifecycle works.

### Security risk

Documents and estate information are sensitive.

Mitigation:

- Treat uploads as private and sensitive from the beginning.
- Do not ship public document handling without storage/access review.

## 10. Immediate next action

Create GitHub issues from the suggested first issues, then assign contributors to Phase 0 and Phase 1 only.

Do not start major new product features until:

- Auth is stable.
- User ID model is fixed.
- Current case API works.
- Evaluation save/resume works.
