# Sprint 4 Peer Review Log

**Peer Reviewer:** @vienggg  
**Author:** @NinjoMUDA (67070503414)  
**Target Branch:** `lab4-staging`

## 1. Pull Request Summary

| PR # | Linked Issue | Title | Author | Reviewer | Review Decision | Merge Date |
|---|---|---|---|---|---|---|
| #47 | #41 | Docs: Sprint 4 Engineering Contract & Specifications | @NinjoMUDA | @vienggg | Approved & Merged | 2026-10-31 |
| #48 | #42 | Feature: Actions Taken Foundation & REST APIs | @NinjoMUDA | @vienggg | Changes Requested -> Pushed for Re-review | - |
| TBD | #43 | Feature: Actions Taken UI & Ticket Detail Integration | @NinjoMUDA | @vienggg | Not Started | - |
| TBD | #44 | Feature: Ticket Workflow, Resolution Gate & State Transitions | @NinjoMUDA | @vienggg | Not Started | - |
| TBD | #45 | Feature: Role-Based Dashboards | @NinjoMUDA | @vienggg | Not Started | - |
| TBD | #46 | Release: Lab 4 Final Regression, Hardening, Visual Evidence & Integration | @NinjoMUDA | @vienggg | Not Started | - |

---

## 2. Review Comments & Resolutions Thread

### Issue #41 — Docs: Sprint 4 Engineering Contract & Specifications (PR #47)
* **Reviewer (@vienggg) Comment:**
  > Thanks for the thorough contract. I found a few spec inconsistencies that should be fixed before merge, because Issues #42–#46 (API, UI, tests) will all be built from these docs.
  > 
  > **Blocking: the REOPEN rules contradict each other**
  > - `specification.md` BR-07 says tickets in `RESOLVED` **or `CLOSED`** can be reopened, and that reopening moves the ticket to **`OPEN`**.
  > - `api-spec.md` §3.1 only allows `RESOLVED -> CLOSED, REOPENED`. `CLOSED` has no outgoing transitions, and there is no `REOPENED -> OPEN` transition (`REOPENED` is a real status there).
  > - `ui-spec.md` §5.1 says `CLOSED` is terminal ("or reopen only if permitted") and also treats `REOPENED` as a status.
  > 
  > Please pick one model and align BR-07, the API transition matrix, the UI dropdown rules and AC-08. Also say whether `CLOSED` is terminal.
  > 
  > **Should fix**
  > 1. Stale-update rule: FR-07 says reject if the DB `updatedAt` is *newer*. `api-spec.md` says reject if it *does not match* (or is older). Use one exact rule.
  > 2. `ui-spec.md` §1 has no badge colour for `REOPENED`, but it is a status users will see.
  > 3. AC-11 and FR-11 (inactive assignee, 400) are not in `api-spec.md`. Document which endpoint enforces them and the error response.
  > 4. `tests.md` has no test for AC-11, AC-12 (empty dashboard) or the reopen flow in BR-07. Add rows for them.
  > 5. `reviewer.md` still has "TBD" for this PR's number. Set it to #47.
  > 
  > Once the BR-07 / transition matrix mismatch is fixed, I'm happy to approve.

* **Author (@NinjoMUDA) Reply:**
  > Thank you @vienggg for the careful and constructive review! All points have been resolved directly on `docs/lab4-contract`:
  > 1. **REOPEN & Terminal States Alignment:** Formally harmonized across `specification.md` (BR-07, AC-08), `api-spec.md` (§3.1), and `ui-spec.md` (§5.1). `REOPENED` is modeled as a first-class status reachable from `RESOLVED`. From `REOPENED`, valid transitions are `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, and `CANCELLED`. `CLOSED` and `CANCELLED` are defined as strictly terminal states with zero outgoing transitions.
  > 2. **Stale-Update Rule Unified:** FR-07 and `api-spec.md` §3.1 now use the exact same strict match rule: if `new Date(clientUpdatedAt).getTime() !== ticket.updatedAt.getTime()`, reject with `409 Conflict`.
  > 3. **REOPENED Badge Styling:** Added Cyan/Teal badge (`#0891b2`, light `#cffafe`) under `ui-spec.md` §1.
  > 4. **Inactive Assignee Enforcement:** Documented `PATCH /api/tickets/:id/assign` under `api-spec.md` §3.2 returning `400 Bad Request` when `isActive === false`.
  > 5. **Traceability Matrix Additions:** Added test cases API-11 (inactive assignee rejection), API-12 (empty dashboard zero counts), API-13 (reopen lifecycle transition), and UI-07 (reopen button visibility) in `tests.md`.
  > 6. **Reviewer Tracking:** Updated PR table with PR #47 and logged all review resolutions.
* **Resolution Status:** Approved and merged into `lab4-staging` by @vienggg.

---

### Issue #42 — Feature: Actions Taken Foundation & REST APIs (PR #48)
* **Reviewer (@vienggg) Comment:**
  > Not ready to merge yet. This PR only changes `docs/session_state.md` (one commit: "start feature branch and update session state"). The description promises a Prisma migration, the `ActionTaken` model, seed, REST APIs, authorization and tests, but none of that is in the diff, and the checklist in `session_state.md` still has those items unchecked.
  > 
  > Please push the actual Issue #42 work:
  > - `ActionTaken` model in `schema.prisma` and the `add_actions_taken` migration
  > - Idempotent seed with tickets that have 0, 1 and several actions
  > - `GET` / `POST` / `PATCH` endpoints from `docs/lab-04/api-spec.md`, with the Requester ownership check and the follow-up note validation
  > - `server/tests/lab-04/actions-taken.api.test.ts` covering API-01 to API-05, with all suites passing
  > 
  > Also update `tests.md`, `reviewer.md` and `ai-use.md`. Ping me when it's pushed and I'll re-review.

* **Author (@NinjoMUDA) Reply:**
  > Thanks for the quick heads up @vienggg! All the actual implementation for Issue #42 is now committed and pushed to `feature/42-actions-foundation`:
  > 1. **Model & Migration:** Added `ActionTaken` model with CASCADE delete and indexed foreign keys (`ticketId`, `performedById`, `actionDateTime`), generated migration `20261031153232_add_actions_taken`.
  > 2. **Idempotent Seed:** Seeded realistic Actions Taken across tickets with 0, 1, and multiple actions, diverse IT Staff performers, and follow-up notes.
  > 3. **REST APIs:** Implemented `GET /api/tickets/:id/actions`, `POST /api/tickets/:id/actions`, and `PATCH /api/tickets/:id/actions/:actionId` with strict requester ownership checks (403), performer auto-fill, and follow-up note validation (400).
  > 4. **Test Suites Passing:** Created `server/tests/lab-04/actions-taken.api.test.ts` covering API-01 through API-05 (7/7 tests passing). Full server regression suite passes 61/61 tests.
  > 5. **Documentation Updated:** `tests.md` updated with passing statuses, `ai-use.md`, `reviewer.md`, and `session_state.md` updated.
* **Resolution Status:** Code and tests pushed, ready for re-review and merge.
