# Sprint 4 Peer Review Log

**Peer Reviewer:** @vienggg  
**Author:** @NinjoMUDA (67070503414)  
**Target Branch:** `lab4-staging`

## 1. Pull Request Summary

| PR # | Linked Issue | Title | Author | Reviewer | Review Decision | Merge Date |
|---|---|---|---|---|---|---|
| #47 | #41 | Docs: Sprint 4 Engineering Contract & Specifications | @NinjoMUDA | @vienggg | Approved & Merged | 2026-10-31 |
| #48 | #42 | Feature: Actions Taken Foundation & REST APIs | @NinjoMUDA | @vienggg | Approved & Merged | 2026-10-31 |
| #49 | #43 | Feature: Actions Taken UI & Ticket Detail Integration | @NinjoMUDA | @vienggg | Approved & Merged | 2026-10-31 |
| #50 | #44 | Feature: Ticket Workflow, Resolution Gate & State Transitions | @NinjoMUDA | @vienggg | Approved & Merged | 2026-11-01 |
| #51 | #45 | Feature: Role-Based Dashboards | @NinjoMUDA | @vienggg | Pending Review | - |
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
* **Resolution Status:** Approved and merged into `lab4-staging` by @vienggg.

---

### Issue #43 — Feature: Actions Taken UI & Ticket Detail Integration (PR #49)
* **Reviewer (@vienggg) Comment:** Reviewed and approved. Actions feed, responsive Zen Green styling, role badges, and performer population verified.
* **Author (@NinjoMUDA) Reply:** Merged via PR #49.
* **Resolution Status:** Approved and merged into `lab4-staging` by @vienggg.

---

### Issue #44 — Feature: Ticket Workflow, Resolution Gate & State Transitions (PR #50)
* **Status:** Approved and Merged into lab4-staging
* **Pull Request:** https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/50
* **Automated Test Results:**
  - `server/tests/lab-04/ticket-workflow.api.test.ts`: 6/6 tests passing (API-08, API-09, API-10, API-11, API-13). Full server suite 67/67 passing.
  - `client/tests/lab-04/TicketWorkflow.test.tsx`: 3/3 tests passing (UI-06, UI-07). Full client suite 59/59 passing.
* **Key Implementations:**
  - Strict Sprint 4 state transition matrix enforced on both backend and frontend.
  - `CLOSED` and `CANCELLED` are strictly terminal states (controls disabled in UI, rejected with 400 on backend).
  - Stale-update concurrency check using `clientUpdatedAt` returns 409 Conflict with Reload button.
  - Mandatory `resolutionSummary` (min 5 characters) when transitioning to `RESOLVED`.
  - Inactive assignee protection returns 400 Bad Request on `PATCH /api/tickets/:id/assign` and disables inactive users in UI dropdown.
  - Quick Reopen button visible on `RESOLVED` tickets with `.badge-status-reopened` cyan styling.


---

### Issue #45 — Feature: Role-Based Dashboards (PR #51)
* **Status:** Ready for Peer Review (Changes Addressed)
* **Pull Request:** https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/51
* **Reviewer (@vienggg) Comment:**
  > Good progress on the dashboards (UI, drill-downs, empty states and the staff endpoint look right), but there is one security issue and two spec/cleanup issues to fix before merge.
  > 
  > **Blocking: the requester dashboard can be read without logging in**
  > `GET /api/dashboards/requester` uses optionalAuthenticate and, when there is no login, takes the requester from ?requesterId= or x-requester-id. Anyone who knows or guesses an id can read that person's ticket counts and recent tickets. Fix: use authenticateToken and always use req.user.id. Remove header/query fallback and replace test with 401 unauthenticated check.
  > 
  > **Blocking (cleanup): the dashboard block is in server/src/app.ts twice**
  > Please delete the duplicate.
  > 
  > **Should fix: counts don't match BR-09**
  > BR-09 says staff Unassigned and Assigned-to-Me counts exclude RESOLVED, CLOSED and CANCELLED. The code only excludes CLOSED and CANCELLED. Exclude RESOLVED too.
* **Author (@NinjoMUDA) Reply:**
  > Thank you @vienggg for the rigorous code review! All three issues have been resolved directly on `feature/45-dashboards`:
  > 1. **Authentication Enforcement:** Changed `GET /api/dashboards/requester` to use `authenticateToken` and bound requester context strictly to `req.user.id`. Removed all unauthenticated header/query fallbacks. Updated API test to verify 401 Unauthorized for unauthenticated requests.
  > 2. **Duplicate Route Cleanup:** Removed the duplicate ~220 line dashboard route registration block from `server/src/app.ts`.
  > 3. **BR-09 State Filter Alignment:** Excluded `RESOLVED` tickets (along with `CLOSED` and `CANCELLED`) from `myAssigned`, `unassigned`, and priority breakdown counts in `GET /api/dashboards/staff`.
  > Full regression passed: 74/74 server tests, 64/64 client tests. Ready for re-review!
* **Automated Test Results:**
  - `server/tests/lab-04/requester-dashboard.api.test.ts`: 3/3 tests passing (API-06, API-12, 401 Unauthorized check)
  - `server/tests/lab-04/staff-dashboard.api.test.ts`: 4/4 tests passing (API-07)
  - `client/tests/lab-04/RequesterDashboard.test.tsx`: 2/2 tests passing (UI-04)
  - `client/tests/lab-04/StaffDashboard.test.tsx`: 3/3 tests passing (UI-05)
  - Full Regression Suite: 74/74 server tests passing, 64/64 client tests passing (138 total tests passing).