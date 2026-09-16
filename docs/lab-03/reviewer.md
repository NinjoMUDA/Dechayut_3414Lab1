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
| [PR #36](https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/36) | [Issue #30](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/30) | `feature/30-ticket-operations` | Feature: IT Staff Ticket Operations & Notes | Merged | Approved | Approved and merged into `lab3-staging` by @vienggg. Review comments exchanged. |
| [PR #37](https://github.com/NinjoMUDA/Dechayut_3414Lab1/pull/37) | [Issue #31](https://github.com/NinjoMUDA/Dechayut_3414Lab1/issues/31) | `feature/31-admin-user-management` | Feature: Administrator User Management | Open | Ready for Review | User CRUD, bcrypt hashing, BR-10 self-deactivation block, BR-11 last-admin protection, and temporary password reset. |

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
