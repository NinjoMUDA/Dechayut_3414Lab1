# Lab 3 Test Plan and Traceability Matrix

## 1. Test Strategy
The testing strategy for Lab 3 rigorously follows Test-Driven Development (TDD) and Spec-Driven Development (Spec DD). Every Acceptance Criterion (AC-01 through AC-10) and Functional Requirement is mapped to automated tests spanning backend unit/API tests, frontend React component tests, and end-to-end user journey tests:
- **Server API Tests (`server/tests/lab-03/`):** Supertest + Vitest tests covering authentication endpoints, role-based authorization guards, IT Staff queue queries, ticket operational updates, public comments vs restricted internal notes, and administrator user management safety rules.
- **Client Component Tests (`client/tests/lab-03/`):** React Testing Library + Vitest tests covering Login screen, mandatory Change Password screen, Staff Ticket Queue, Staff Ticket Detail, and Admin User Management.
- **End-to-End Tests (`e2e/lab-03/`):** Full end-to-end integration workflows covering login & initial password reset gates, IT staff ticket triage & resolution, and admin account lifecycle.

---

## 2. Planned Tests Table

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|---|
| API-01 | API | AC-01, FR-01 | Valid user login | 200 OK; returns JWT token & safe user profile (without password hash) | `server/tests/lab-03/auth.api.test.ts` | Pass |
| API-02 | API | AC-01, BR-01 | Login with incorrect password | 401 Unauthorized; safe failure message; no account details leaked | `server/tests/lab-03/auth.api.test.ts` | Pass |
| API-03 | API | AC-10, BR-01 | Login with inactive user account (`isActive: false`) | 401 Unauthorized; login blocked | `server/tests/lab-03/auth.api.test.ts` | Pass |
| API-04 | API | FR-02 | Current user profile query `/api/auth/me` with valid token | 200 OK; returns active user details and role | `server/tests/lab-03/auth.api.test.ts` | Pass |
| API-05 | API | AC-02, FR-03, BR-02 | Password change via `/api/auth/change-password` | 200 OK; password updated in DB; `mustChangePassword` cleared | `server/tests/lab-03/auth.api.test.ts` | Pass |
| API-06 | API | FR-01, FR-05 | Unauthenticated request to protected endpoints | 401 Unauthorized; operation rejected | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| API-07 | API | FR-05, BR-04 | Requester accessing Admin endpoint `/api/admin/users` | 403 Forbidden; access denied | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| API-08 | API | AC-04, FR-13, BR-05 | Requester querying `/api/tickets/:id/notes` | 403 Forbidden; no note data leaked | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| API-09 | API | AC-03, FR-06, BR-03 | Requester accessing ticket belonging to another user | 403 Forbidden or 404 Not Found; strict user isolation | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| API-10 | API | AC-05, FR-09 | IT Staff queue retrieval with search, filters, and pagination | 200 OK; filtered tickets returned with correct pagination metadata | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| API-11 | API | AC-06, FR-10, BR-12 | IT Staff claim and reassign ticket ownership | 200 OK; `ticketOwnerId` updated to specified staff user | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| API-12 | API | AC-06, FR-11, BR-13 | IT Staff updates IT Priority | 200 OK; `itPriority` updated; requestedPriority unchanged | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| API-13 | API | AC-06, FR-12, BR-14 | Permitted and invalid ticket status transitions | 200 OK for valid transitions; 400 Bad Request for invalid transitions | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| API-14 | API | AC-07, FR-07, BR-04 | Create and retrieve Public Comments | 201 Created & 200 OK; visible to Requester, Staff, and Admin | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| API-15 | API | FR-13, BR-05 | IT Staff posts and retrieves Internal Notes | 201 Created & 200 OK; persisted and visible to Staff/Admin | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| API-16 | API | AC-08, FR-14 | Admin queries user list with search and role filter | 200 OK; matching user records returned | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| API-17 | API | AC-08, FR-15, BR-08 | Admin creates new user with initial password | 201 Created; duplicate email rejected with 400 Bad Request | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| API-18 | API | AC-08, FR-16 | Admin updates user name, email, role, and active status | 200 OK; database updated | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| API-19 | API | AC-09, FR-18, BR-10 | Admin attempts self-deactivation | 400 Bad Request; self-deactivation blocked | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| API-20 | API | AC-09, FR-18, BR-11 | Admin attempts to deactivate or demote last active Admin | 400 Bad Request; last admin removal blocked | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| API-21 | API | FR-17 | Admin resets user initial password | 200 OK; `mustChangePassword` reset to true | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| UI-01 | UI | AC-01, FR-01 | Login screen rendering, input validation, and busy state | Inline validation errors on empty submission; spinner while calling API | `client/tests/lab-03/Login.test.tsx` | Pass |
| UI-02 | UI | AC-02, FR-03, BR-07 | ChangePassword screen validation & password rules | Real-time complexity checklist; prevents submit if rules unmet | `client/tests/lab-03/ChangePassword.test.tsx` | Pass |
| UI-03 | UI | AC-05, FR-09 | StaffTicketQueue table, search bar, filters, pagination | Table renders correctly; filter updates trigger fetch; pagination works | `client/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| UI-04 | UI | AC-06, FR-10-13 | StaffTicketDetail controls, notes and comments tabs | Claim button, priority selector, status dropdown, distinct note styling | `client/tests/lab-03/StaffTicketDetail.test.tsx` | Pass |
| UI-05 | UI | AC-08, AC-09 | UserManagement user table, create/edit modals, safety warnings | User listing, create form, edit form, self-deactivation warning disabled | `client/tests/lab-03/UserManagement.test.tsx` | Planned |
| E2E-01 | E2E | AC-01, FR-04 | Authentication and logout flow | User logs in, dashboard loads, logs out, session terminated | `e2e/lab-03/authentication.spec.ts` | Planned |
| E2E-02 | E2E | AC-02, FR-03 | First login with temporary password $\rightarrow$ change password gate | User redirected to Change Password screen; normal app opens only after valid change | `e2e/lab-03/authentication.spec.ts` | Planned |
| E2E-03 | E2E | AC-05, AC-06 | IT Staff triage workflow: queue $\rightarrow$ claim $\rightarrow$ set priority $\rightarrow$ transition status $\rightarrow$ note | Staff user triage flow completes successfully | `e2e/lab-03/staff-ticket-flow.spec.ts` | Planned |
| E2E-04 | E2E | AC-08, AC-09 | Administrator user management: create $\rightarrow$ edit $\rightarrow$ reset password $\rightarrow$ safety guards | Admin lifecycle operations succeed with safety guards enforced | `e2e/lab-03/user-administration.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Covered Test IDs |
|---|---|---|
| **AC-01** | Active user valid login & session establishment | `API-01`, `API-02`, `UI-01`, `E2E-01` |
| **AC-02** | Mandatory password change barrier for initial passwords | `API-05`, `UI-02`, `E2E-02` |
| **AC-03** | Authenticated Requester resource isolation | `API-09` |
| **AC-04** | Requester forbidden from accessing Internal Notes | `API-08` |
| **AC-05** | IT Staff queue search, filter, sort, and pagination | `API-10`, `UI-03`, `E2E-03` |
| **AC-06** | IT Staff ticket ownership claim, priority & status updates | `API-11`, `API-12`, `API-13`, `UI-04`, `E2E-03` |
| **AC-07** | Public Comments visible to Requester, IT Staff, Admin | `API-14`, `UI-04` |
| **AC-08** | Administrator User Management CRUD operations | `API-16`, `API-17`, `API-18`, `API-21`, `UI-05`, `E2E-04` |
| **AC-09** | Administrator safety rules (self & last admin deactivation) | `API-19`, `API-20`, `UI-05`, `E2E-04` |
| **AC-10** | Inactive user account authentication rejection | `API-03` |

---

## 4. Visual & Responsive Checklist
- [ ] **Desktop ($\ge 992$px):** Full navbar with role navigation, IT Staff table with sortable columns, 2-column ticket detail layout, admin user table.
- [ ] **Tablet (768–991px):** Responsive navigation, horizontally scrollable data tables, stacked form panels.
- [ ] **Mobile ($< 768$px):** Card-based ticket queue items, full-width inputs, touch-friendly buttons ($\ge 44$px), no horizontal viewport overflow.
- [ ] **Zen Green Aesthetics:** Strict adherence to `#006B3C` primary palette and clean modern Bootstrap presentation.
- [ ] **Accessibility & ARIA:** Valid labels, color contrast compliant, explicit focus rings, and screen-reader accessible error messages.

---

## 5. Test Execution Commands
```bash
# Run server test suite
npm --prefix server test

# Run client test suite
npm --prefix client test

# Run Playwright E2E test suite
npx playwright test
```
