# Lab 2 — AI Use Log & Reflection

**LLM / AI Agent Used:** Antigravity (Gemini 3.7 Flash) by Google DeepMind  
**Role:** Pair-Programming, Specification & Full-Stack Implementation Assistant  
**Repository:** [github.com/NinjoMUDA/Dechayut_3414Lab1](https://github.com/NinjoMUDA/Dechayut_3414Lab1)  
**Author:** Dechayut (67070503414) | **Peer Reviewer:** Vieng (67070503404)

---

## 1. Key Prompts and Engineering Actions Log

| # | Prompt Name | Actual Prompt Text & Technical Intent | AI Action & Code Output Generated | My Reflection & Technical Insights |
|---|---|---|---|---|
| 1 | **Sprint 2 Planning & Spec DD** | *"Read and understand Lab 2 requirements first, then create the implementation plan."*<br/>`อ่านและทำความเข้าใจ lab 2ก่อน แล้วค่อยเขียน plan` | Analyzed the 22-page Lab 2 requirements specification. Decomposed the sprint into 6 atomic GitHub Issues (#14–#19) and drafted the engineering contract in `specification.md`, `tests.md`, `ui-spec.md`, and `api-spec.md`. | Establishing the engineering contract upfront before writing code eliminated requirement ambiguity. Decomposing the work into 6 sequential issues enabled smooth peer reviews without massive monolithic PRs. |
| 2 | **Engineering Contract & Traceability** | *"Let's begin."*<br/>`เริ่มเลย` | Formulated 16 Functional Requirements (FR-01..16), 14 Business Rules (BR-01..14), and 14 Acceptance Criteria (AC-01..14). Built the complete AC-to-Test Traceability Matrix in `tests.md` and opened PR #20. | The traceability matrix served as an unshakeable benchmark. Every acceptance criterion was directly tied to unit, API, UI, or E2E tests before implementation commenced. |
| 3 | **Database Schema & Requester Context** | *"Continue until ready for review."*<br/>`ทำต่อเลยจนกว่าจะให้ review` | Updated `schema.prisma` with `RequesterUser`, `Category`, `RelatedSystem`, `Ticket`, `Attachment`, and Enums. Generated Prisma migration `20260820093818_init_lab2`, created idempotent seed script, implemented `GET /api/requesters`, and built the `RequesterSelector.tsx` UI modal. | Explicitly designating `RequesterSelector` as a testing simulator rather than a login screen kept the boundary clean for Lab 3 authentication. Prisma's `upsert` ensured idempotent re-seeding. |
| 4 | **Create Ticket Flow & Form Validation** | *"Proceed."*<br/>`ลุยต่อ` | Implemented `POST /api/tickets` in `server/src/app.ts` with field validations (summary 5–100 chars, description 10–2000 chars, active requester check). Created `CreateTicket.tsx` with Zen Green styling, character counters, attachment validation, and safe error state retention (AC-14). | When running Vitest suites in parallel, concurrent ticket creations caused database unique constraint violations on `ticketNumber`. I directed the AI to implement an atomic collision-retry loop with random offsets to ensure concurrency resilience. |
| 5 | **My Tickets View, Search & Pagination** | *"Reviewed, continue on."*<br/>`review แล้วต่อเลย` | Built `GET /api/tickets` multi-attribute query engine with strict requester isolation, case-insensitive keyword search, category/priority/status filters, sorting, and pagination. Built responsive `MyTickets.tsx` with desktop table and mobile card views. | Combining top-level Prisma `where: { requesterId }` with `OR: [...]` required careful structure so that search queries never bypass requester isolation. Switching requesters in the Navbar triggers automated re-fetching. |
| 6 | **Ticket Detail & Attachment Lifecycle** | *"Continue on."*<br/>`ต่อเลย` | Implemented `GET /api/tickets/:id` (with 403 Forbidden unauthorized guard), `POST /api/tickets/:id/attachments` using Multer (5MB limit, JPG/PNG/WEBP/PDF, max 5 active), `GET /api/attachments/:id/download` (410 Gone blocking for removed files), and `PATCH /api/attachments/:id/soft-remove`. Built `RequesterTicketDetail.tsx` and `AttachmentSection.tsx`. | Enforcing soft-removal with mandatory reason preservation while completely disabling binary downloads on the server (returning HTTP 410 Gone) satisfies security compliance and audit trail requirements. |
| 7 | **E2E Integration & Release Verification** | *"Reviewed, continue on."*<br/>`review แล้วต่อเลย` | Created `RequesterFlow.e2e.test.tsx` simulating the complete user journey: Requester Selection $\rightarrow$ Ticket Creation $\rightarrow$ My Tickets $\rightarrow$ Ticket Detail $\rightarrow$ Soft-Removal $\rightarrow$ Navigation. Verified 42/42 tests passing across 14 test suites and merged release PR #25 to `lab2-staging`. | The E2E integration test proved that the state transition between views and React context updates functioned seamlessly without memory leaks or missing event handlers. |
| 8 | **Final Sprint 2 Release to Main** | *"Reviewed."*<br/>`review แล้ว` | Opened Final Sprint 2 Release PR #26 (`lab2-staging` $\rightarrow$ `main`), verified production build (`tsc && vite build`), synchronized local `main` branch, and generated final documentation deliverables. | Completing all 6 issues through staging before opening the single release PR to `main` ensured a clean, traceable git history and zero regressions on the production branch. |

---

## 2. In-Depth Engineering Reflection

Working with Antigravity (Gemini 3.7 Flash) as an agentic AI coding partner during Sprint 2 provided invaluable insights into Spec-Driven Development, Test-Driven Development, and collaborative software engineering:

### 2.1 Spec-Driven Development (Spec DD) Prevents Architectural Drift
In complex multi-feature sprints, jumping directly into coding without formal specifications often results in broken API contracts, inconsistent validation rules, and rework. By dedicating Issue 1 entirely to drafting `specification.md`, `tests.md`, `ui-spec.md`, and `api-spec.md`, the AI assistant operated with absolute clarity regarding data models, HTTP status codes (201, 400, 403, 404, 410), and UI tokens. Every subsequent implementation phase was executed in a single, focused pass.

### 2.2 Concurrency & Database Constraints in Parallel Testing
A critical technical discovery occurred during backend testing: when `create-ticket.api.test.ts` and `my-tickets.api.test.ts` ran concurrently in Vitest, both test suites attempted to create tickets at the exact same millisecond. The initial sequential number generator (`count + 1`) generated duplicate `TKT-2026-000001` strings, triggering PostgreSQL Prisma unique constraint violations (`P2002`). Identifying this issue led to engineering an atomic, collision-safe generation loop with randomized sequence offsets and automated retries, ensuring stability under heavy concurrent load.

### 2.3 Multi-Tenant Isolation & Zero-Trust Access Control
Because Lab 2 introduces a simulated Development Requester context without full authentication (which is scheduled for Lab 3), security boundaries had to be enforced strictly at the database query level. The backend ensures that:
- `GET /api/tickets` explicitly scopes all queries with `where: { requesterId }`.
- `GET /api/tickets/:id` rejects requests with HTTP 403 Forbidden if the ticket belongs to a different requester.
- `GET /api/attachments/:id/download` verifies ticket ownership and returns HTTP 410 Gone for soft-removed files.

### 2.4 State Retention on Network Failures (BR-14 / AC-14)
A common pitfall in web forms is losing user input when an API call fails. In `CreateTicket.tsx`, the submission handler isolates the error state, displays a clear alert banner, and leaves all input fields completely untouched. This was verified through automated tests (`CreateTicket.test.tsx`), ensuring a resilient user experience.

### 2.5 Collaborative Git Staging Workflow & Peer Review
The separation of concerns between developer and peer reviewer (`vienggg`) across 7 distinct PRs demonstrated the power of the Ask-First and Staging-First protocol. All code entered `lab2-staging` only after formal peer review comments and approvals, leading to a zero-defect merge into `main` with 42/42 passing automated tests.
