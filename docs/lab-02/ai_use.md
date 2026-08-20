# Lab 2 — AI Use and Reflection

**LLM/agent used:** Antigravity (Gemini 3.7 Flash) by Google DeepMind  
**Role:** Pair-Programming, Specification & Full-Stack Implementation Assistant  
**Repository:** [github.com/NinjoMUDA/Dechayut_3414Lab1](https://github.com/NinjoMUDA/Dechayut_3414Lab1)  
**Author:** Dechayut (67070503414) | **Peer Reviewer:** Vieng (67070503404)

---

## 1. Key Prompts and Reflection Log

| Prompt Name | Actual Prompt Text & My Reflection |
|-------------|------------------------------------|
| **Sprint 2 Planning & Spec DD** | *Prompt:* Read and thoroughly analyze the Lab 2 requirements specification first, then generate the comprehensive implementation plan and agile issue breakdown.<br/>**My Reflection:** Establishing the engineering contract upfront before writing code eliminated requirement ambiguity. Decomposing the work into 6 sequential issues enabled smooth peer reviews without massive monolithic PRs. |
| **Engineering Contract & Traceability** | *Prompt:* Begin implementing the specifications and test traceability matrix.<br/>**My Reflection:** The traceability matrix in `tests.md` served as an unshakeable benchmark. Every acceptance criterion (AC-01..14) was directly tied to unit, API, UI, or E2E tests before implementation commenced. |
| **Database Schema & Requester Context** | *Prompt:* Continue with the database models, seed script, and development requester context until ready for peer review.<br/>**My Reflection:** Explicitly designating `RequesterSelector` as a testing simulator rather than a login screen kept the boundary clean for Lab 3 authentication. Prisma's `upsert` ensured idempotent re-seeding. |
| **Create Ticket Flow & Form Validation** | *Prompt:* Proceed with implementing the Create Ticket API endpoint and the Zen Green submission form.<br/>**My Reflection:** When running Vitest suites in parallel, concurrent ticket creations caused database unique constraint violations on `ticketNumber`. I directed the AI to implement an atomic collision-retry loop with random offsets to ensure concurrency resilience. |
| **My Tickets View, Search & Pagination** | *Prompt:* PR reviewed and merged. Proceed with implementing My Tickets list, multi-tenant isolation, search, filtering, and pagination.<br/>**My Reflection:** Combining top-level Prisma `where: { requesterId }` with `OR: [...]` required careful structure so that search queries never bypass requester isolation. Switching requesters in the Navbar triggers automated re-fetching. |
| **Ticket Detail & Attachment Lifecycle** | *Prompt:* Continue with implementing Ticket Detail view, Multer attachment uploads, download endpoints, and soft-removal modal.<br/>**My Reflection:** Enforcing soft-removal with mandatory reason preservation while completely disabling binary downloads on the server (returning HTTP 410 Gone) satisfies security compliance and audit trail requirements. |
| **E2E Integration & Release Verification** | *Prompt:* PR reviewed and merged. Implement the end-to-end integration test suite, conduct the visual responsive audit, and verify all automated tests.<br/>**My Reflection:** The E2E integration test (`RequesterFlow.e2e.test.tsx`) proved that the state transition between views and React context updates functioned seamlessly without memory leaks or missing event handlers. |
| **Final Sprint 2 Release to Main** | *Prompt:* Peer review complete. Open the final release PR to main and verify all production deliverables.<br/>**My Reflection:** Completing all 6 issues through staging before opening the single release PR #26 to `main` ensured a clean, traceable git history and zero regressions on the production branch. |

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
