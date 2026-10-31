# AI Assistance Log & Reflection — Lab 4

## 1. LLM Model Information
* **Primary LLM:** Gemini 3.8 Flash (Medium) / Google Antigravity Agentic Assistant
* **Role:** Specification Agent & Pair Programming Coding Agent
* **Context Scope:** KMUTT CPE 334 Software Engineering Lab 4 (TokTickIT Sprint 4)

---

## 2. Selected Prompts & Tool Interactions

### Prompt 1: Lab 4 Handout Analysis & Requirement Decomposition
* **User Input:** `อ่านข้อมูลทั้งหมดใน LAB4 เพื่อเตรียมทำ LAB4`
* **AI Action:** Read and analyzed `LAB4/SE+Lab+4.pdf` cover-to-cover, extracted stakeholder request, learning outcomes, business rules (BR-01, BR-02), database increment, REST API requirements, Zen Green UI constraints, 9 report sections, and decomposed Sprint 4 into 6 distinct GitHub issues.

### Prompt 2: Branch Setup & Remote Staging Initialization
* **User Input:** `ok`
* **AI Action:** Verified `main` branch status, pulled latest changes, created and pushed `lab4-staging` to remote repository as the base branch for Sprint 4 PRs.

### Prompt 3: Issue Creation & Sprint 4 Specification Drafting
* **User Input:** `ok`
* **AI Action:** Created GitHub Issues #41 to #46 via `gh issue create`, branched `docs/lab4-contract` from `lab4-staging`, drafted comprehensive engineering contract (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `reviewer.md`).

### Prompt 4: Issue #42 Actions Taken Foundation & REST APIs
* **User Input:** `ต่อเลย`
* **AI Action:** Applied Prisma migration `add_actions_taken` for `ActionTaken` model with cascades and indexes. Updated `seed.ts` with idempotent realistic Actions Taken data. Implemented `GET /api/tickets/:id/actions`, `POST /api/tickets/:id/actions`, and `PATCH /api/tickets/:id/actions/:actionId` in `server/src/app.ts`. Created and ran Supertest suite `server/tests/lab-04/actions-taken.api.test.ts` (7/7 tests passing). Verified zero regression across all 61 server tests.

### Prompt 5: Issue #43 Actions Taken UI & Ticket Detail Integration
* **User Input:** `link แล้วต่อเลย`
* **AI Action:** Defined `ActionTaken` client types and API services (`apiGetActionsTaken`, `apiCreateActionTaken`, `apiUpdateActionTaken`). Built `ActionsTakenPanel.tsx` in Zen Green theme featuring action chronological timelines, auto-populated performer, follow-up flags, conditional validation, and edit modals. Embedded panel into `StaffTicketDetail.tsx` (full record/edit) and `RequesterTicketDetail.tsx` (read-only mode). Implemented Vitest component suite `client/tests/lab-04/ActionsTaken.test.tsx` (3/3 tests passing). Verified all 56 client tests pass.

### Prompt 6: Issue #44 Ticket Workflow, Resolution Gate & State Transitions
* **User Input:** `ok`
* **AI Action:** Implemented backend state transition enforcement (`PATCH /api/tickets/:id/status`) with strict Sprint 4 transition matrix, terminal state restrictions (`CLOSED` / `CANCELLED`), resolution summary validation (min 5 chars), and stale-update conflict detection (`clientUpdatedAt`, HTTP 409). Added inactive assignee validation (`PATCH /api/tickets/:id/assign`). Integrated client workflow controls in `StaffTicketDetail.tsx` and `RequesterTicketDetail.tsx`, including quick Reopen button, cyan badge styling, terminal state locking, and conflict reload handling. Developed automated test suites `server/tests/lab-04/ticket-workflow.api.test.ts` (6/6 pass) and `client/tests/lab-04/TicketWorkflow.test.tsx` (3/3 pass). Verified zero regression across all 67 server tests and 59 client tests.

### Prompt 7: Issue #45 Role-Based Dashboards
* **User Input:** `ต่อเลย`
* **AI Action:** Implemented backend endpoints `GET /api/dashboards/requester` and `GET /api/dashboards/staff` with scoped counts, priority breakdowns, zero-data handling (AC-12), and admin stats. Built Zen Green responsive UI components `RequesterDashboard.tsx` and `StaffDashboard.tsx` with metric counters, empty state banners, and drill-down links. Developed Supertest test suites `requester-dashboard.api.test.ts` (4/4 pass) and `staff-dashboard.api.test.ts` (4/4 pass), and Vitest suites `RequesterDashboard.test.tsx` (2/2 pass) and `StaffDashboard.test.tsx` (3/3 pass). Full regression suite passed 100% across 75 server and 64 client tests.

### Prompt 8: Issue #46 Release Verification & End-to-End Testing
* **User Input:** `ต่อเลย`
* **AI Action:** Implemented 3 comprehensive E2E integration test suites: `actions-taken-flow.spec.tsx` (E2E-01), `ticket-resolution.spec.tsx` (E2E-02), and `dashboards.spec.tsx` (E2E-03). Updated Vite configuration to include `.spec.tsx` patterns. Verified 100% pass across all 142 automated tests (74 server tests, 68 client tests). Hardened documentation, traceability matrix, and prepared comprehensive release report artifacts.

---

## 3. My Reflection on Specification & Coding Agents
Using an AI Specification Agent at the inception of Sprint 4 ensures that requirements are crystallized into verifiable Acceptance Criteria (ACs) and numbered Business Rules (BRs) before any database migration or UI code is written. This Spec-DD approach prevents architectural drift, guarantees backward compatibility with earlier lab sprints, and provides a clear traceability chain from user requirements directly into automated test assertions.
During Issue #42 through Issue #46, the pair programming workflow ensured that conditional validation rules (such as mandatory `followUpNote` when `followUpRequired` is true), role authorization guards (preventing requesters from writing or viewing other users' actions), resolution gating, and role-based dashboard scoping were strictly implemented and verified by automated Supertest and React Testing Library component suites before opening PRs.
