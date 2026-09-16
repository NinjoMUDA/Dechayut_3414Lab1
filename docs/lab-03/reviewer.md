# Lab 3 Peer Review Record

## Reviewer Details
- **Reviewer Name:** Vieng (67070503404)
- **Reviewer GitHub Username:** [vienggg](https://github.com/vienggg)
- **PR Author:** Dechayut ([NinjoMUDA](https://github.com/NinjoMUDA))
- **Repository:** [github.com/NinjoMUDA/Dechayut_3414Lab1](https://github.com/NinjoMUDA/Dechayut_3414Lab1)

---

## Pull Request & Issue Linkage Tracking

| PR # | Linked Issue | Branch | Title | Status | Review Decision | Key Feedback & Resolution |
|---|---|---|---|---|---|---|
| [PR #33](https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/33) | [Issue #27](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/27) | `docs/lab3-specs` | Docs: Sprint 3 Engineering Contract & Specifications | Merged | Approved | Approved and merged into `lab3-staging` by @vienggg. |
| [PR #34](https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/34) | [Issue #28](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/28) | `feature/28-auth-foundation` | Feature: Authentication Foundation & Requester Migration | Merged | Approved | Approved and merged into `lab3-staging` by @vienggg. Review comments exchanged. |
| [PR #35](https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/35) | [Issue #29](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/29) | `feature/29-staff-queue` | Feature: IT Staff Ticket Queue | Merged | Approved | Approved and merged into `lab3-staging` by @vienggg. Review comments exchanged. |
| [PR #37](https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/37) | [Issue #31](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/31) | `feature/31-admin-user-management` | Feature: Administrator User Management | Merged | Approved | Approved and merged into `lab3-staging` by @vienggg. Review comments exchanged and resolved. |
| [PR #38](https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/38) | [Issue #32](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/32) | `feature/32-integration-verification` | Release: Lab 3 E2E Tests, Visual Evidence & Final Integration | Superseded | Changes Requested | Prematurely merged by author; staging reset to restore clean history; superseded by PR #39. |
| [PR #39](https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/39) | [Issue #32](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/32) | `feature/32-release-final` | Release: Lab 3 E2E Tests, Visual Evidence & Final Integration | Open | Ready for Review | 107/107 tests pass across client and server. All 5 review items addressed. Ready for @vienggg to approve and merge. |

---

## Review Conversations & Resolutions

### PR #33 (Docs: Sprint 3 Engineering Contract & Specifications)
- **Linked Issue:** Resolves [Issue #27](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/27)
- **Reviewer:** `vienggg`
- **Status:** Approved and Merged into `lab3-staging`.

### PR #34 (Feature: Authentication Foundation & Requester Migration)
- **Linked Issue:** Resolves [Issue #28](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/28)
- **Reviewer:** `vienggg`
- **Status:** Approved and Merged into `lab3-staging`.
- **Reviewer Comment:** "sud jod brother!!"
- **Author Reply:** "Jeng Mark Brother!!"

### PR #35 (Feature: IT Staff Ticket Queue)
- **Linked Issue:** Resolves [Issue #29](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/29)
- **Reviewer:** `vienggg`
- **Status:** Approved and Merged into `lab3-staging`.
- **Reviewer Comment:** "Hatrick, you did good jobs!"
- **Author Reply:** "HAhAHa Thx"

### PR #36 (Feature: IT Staff Ticket Operations & Notes)
- **Linked Issue:** Resolves [Issue #30](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/30)
- **Reviewer:** `vienggg`
- **Status:** Approved and Merged into `lab3-staging`.

### PR #37 (Feature: Administrator User Management)
- **Linked Issue:** Resolves [Issue #31](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/31)
- **Reviewer:** `vienggg`
- **Status:** Review Requested Changes Resolved & Ready for Re-Review
- **Reviewer Comment:**
  1. Block Self-Demotion (FR-25 & BR-27) in backend and disable role dropdown on self-editing.
  2. Fix Last-Admin Client Detection in UserManagement.tsx (avoid deriving global count from filtered array).
  3. Enforce Password Complexity (BR-09) on creation and password reset (8+ chars, upper, lower, number).
  4. HTTP Status Code Alignment: Return 409 Conflict on duplicate email creation/update.
  5. Traceability Table Fix in tests.md: update requirement mappings to AC-11..14 and FR-20..26.
- **Author Reply & Resolution:**
  - Added self-demotion block (`req.user.id === targetId && role !== Role.ADMIN` -> 400) and disabled role selector when editing self in `UserManagement.tsx`.
  - Replaced local filtered count with independent server query for global active admin count (`fetchGlobalAdminCount`).
  - Enforced password complexity regex on `POST /api/admin/users` and `POST /api/admin/users/:id/reset-password`.
  - Updated duplicate email status codes to `409 Conflict` across backend and tests.
  - Updated `tests.md` traceability matrix and test table to map correctly to `AC-11..14` and `FR-20..26`. All 98 tests pass.
- **Merge Commit:** `72aa4b2` merged into `lab3-staging` by `@vienggg`.

### PR #38 (Release: Lab 3 E2E Tests, Visual Evidence & Final Integration)
- **Linked Issue:** Resolves [Issue #32](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/32)
- **Reviewer:** `vienggg`
- **Status:** Superseded by PR #39
- **Reviewer Feedback:**
  1. TypeScript Build Errors (`npm run build`): `StaffQueuePagination` import path, mock return types (`apiLogout` -> `void`, `apiChangePassword` -> `{ mustChangePassword: false }`), complete User mock properties, and extraneous note/comment fields.
  2. Test Isolation: Add `fileParallelism: false` to `client/vite.config.ts`.
  3. E2E Test Depth: Add session persistence and role redirect assertions; full ticket lifecycle to `RESOLVED` (with summary) and `CLOSED` + illegal transition rejection; search/role/status filters and BR-11 last active admin protection.
  4. Visual Evidence & Git Hygiene: Remove dummy uploads from `server/uploads/`, keep only `.gitkeep`, and link actual UI screenshots in `tests.md`.
  5. Login Overlay: Fix `isSelectorOpen` initial state so unauthenticated users see the login page cleanly without the dev modal.
- **Incident Note:** PR #38 was accidentally merged prematurely by author while CHANGES_REQUESTED was open. To strictly adhere to CPE 334 peer review protocol (PRs must be approved and merged by peer reviewer @vienggg), `lab3-staging` was force-reset to `4455fd0` (PR #37), the review fixes were incorporated on `feature/32-release-final`, and PR #39 was opened for formal review, approval, and merge by `@vienggg`.

### PR #39 (Release: Lab 3 E2E Tests, Visual Evidence & Final Integration)
- **Linked Issue:** Resolves [Issue #32](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/32)
- **Reviewer:** `vienggg`
- **Status:** Ready for Peer Review & Merge into `lab3-staging`.
- **Author Reply & Resolution:**
  - Fixed TypeScript typing and imports across client components and tests; `npm run build` succeeds cleanly (`tsc && vite build`).
  - Added `fileParallelism: false` in `client/vite.config.ts`.
  - Expanded `Authentication.e2e.test.tsx`, `StaffTicketFlow.e2e.test.tsx`, and `UserAdministration.e2e.test.tsx` with all requested flows and safety assertions.
  - Purged dummy uploads with `git rm`, added `.gitkeep` with `.gitignore` rule, and placed real screenshots in `docs/lab-03/screenshots/` and linked them in `tests.md`.
  - Adjusted dev selector modal default condition in `App.tsx` so unauthenticated users are never blocked by the overlay.
  - All 107 automated tests pass (54 server + 53 client).
