# Lab 2 Test Plan and Results

## 1. Test Strategy
The testing strategy for Lab 2 follows Test-Driven Development (TDD) and Spec-Driven Development (Spec DD). Every Acceptance Criterion (AC-01 through AC-14) is mapped to one or more automated tests across multiple levels:
- **Unit & Helper Tests:** Ticket number formatting, file validation helpers, query builder functions.
- **API Integration Tests (Supertest + Vitest):** Backend endpoints for reference data, ticket creation, requester filtering/isolation, ticket detail ownership checks, and attachment operations.
- **UI Component Tests (Vitest + React Testing Library):** Form rendering, field validation errors, busy submit states, responsive tables, badge rendering, and modal dialogs.
- **End-to-End Tests (Playwright):** Full user journeys across Requester selection, ticket creation, list filtering, detail inspection, and attachment upload/soft-removal.

---

## 2. Planned Tests Table

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|---|
| API-01 | API | AC-01, FR-05, BR-01 | Create valid ticket with all required fields | 201 Created; saved Ticket returned with unique `TKT-YYYY-XXXXXX` and status `NEW` | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-02 | API | AC-05, BR-06, BR-07 | Create ticket with missing or whitespace-only summary / description | 400 Bad Request; field-level error messages returned | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-03 | API | AC-03, FR-08, BR-04 | Query `/api/tickets` with `x-requester-id` of Requester A | 200 OK; only tickets belonging to Requester A are returned; tickets of Requester B are omitted | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-04 | API | AC-11, FR-09, FR-10 | Query `/api/tickets` with search keyword, category filter, and sorting | 200 OK; filtered tickets matching criteria returned in requested sort order | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-05 | API | AC-12, FR-11 | Query `/api/tickets` with pagination (`page=1&limit=5`) | 200 OK; returns 5 items and pagination metadata (`page: 1, totalPages: 3, totalItems: 15`) | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-06 | API | AC-04, FR-16, BR-04 | Access `/api/tickets/:id` owned by Requester A while header is Requester B | 403 Forbidden or 404 Not Found; no ticket data leaked | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| API-07 | API | AC-06, BR-09 | Upload unsupported file type (e.g. `.exe`, `.txt`) | 400 Bad Request; message stating allowed types (JPG, PNG, WEBP, PDF) | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-08 | API | AC-07, BR-10 | Upload file exceeding 5 MB | 400 Bad Request; payload too large / size limit message | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-09 | API | AC-08, BR-11 | Upload 6th active attachment to a ticket | 400 Bad Request; max 5 active attachments limit message | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-10 | API | AC-09, FR-15, BR-12 | Soft-remove attachment with valid reason string | 200 OK; `isRemoved = true`, `removalReason` saved, `removedAt` set | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-11 | API | AC-10, FR-14, BR-12 | Attempt download of soft-removed attachment via `/api/attachments/:id/download` | 410 Gone / 404 Not Found; file stream not served | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-12 | API | AC-13, BR-05 | Query `/api/requesters` | 200 OK; returns only active requesters (`isActive: true`); inactive requesters excluded | `server/tests/lab-02/dev-requester.api.test.ts` | Pass |
| UI-01 | UI | AC-02, FR-01 | Dev Requester Selector rendering when no requester selected | Modal / Select screen displayed with active seeded requesters dropdown | `client/tests/lab-02/RequesterSelector.test.tsx` | Pass |
| UI-02 | UI | AC-05, BR-06, BR-07 | Submit Create Ticket form with empty inputs | Inline dark red error messages displayed below Summary & Description; API not called | `client/tests/lab-02/CreateTicket.test.tsx` | Pass |
| UI-03 | UI | AC-01, FR-05 | Submit valid Create Ticket form | Submit button displays busy state; success banner shows official Ticket Number | `client/tests/lab-02/CreateTicket.test.tsx` | Pass |
| UI-04 | UI | AC-14, BR-14 | Submit form when backend fails / network error | Error alert shown; entered field values remain preserved in form inputs | `client/tests/lab-02/CreateTicket.test.tsx` | Pass |
| UI-05 | UI | AC-03, FR-08 | My Tickets rendering and Requester switching | List displays owned tickets; switching requester triggers re-fetch and updates list | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| UI-06 | UI | AC-11, FR-09 | Search input and filter dropdown changes on My Tickets | Table updates with filtered results; "Clear Filters" button resets controls | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| UI-07 | UI | AC-09, AC-10 | Ticket Detail attachment list and soft-remove dialog | Removed attachment displays "Removed" badge and disabled download button | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Planned |
| E2E-01 | E2E | AC-01, AC-03, AC-09 | Full requester workflow: Select Requester $\rightarrow$ Create Ticket $\rightarrow$ Find in My Tickets $\rightarrow$ Inspect Detail $\rightarrow$ Soft-remove Attachment | End-to-end user flow completes successfully without error | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Unit / Helper | Supertest API Tests | UI Component Tests | E2E Tests |
|---|---|---|---|---|
| **AC-01** (Ticket Creation Success) | `formatTicketNumber` | `API-01` (Pass) | `UI-03` (Pass) | `E2E-01` |
| **AC-02** (Requester Context Guard) | - | - | `UI-01` (Pass) | `E2E-01` |
| **AC-03** (Multi-Requester Isolation)| - | `API-03` | `UI-05` | `E2E-01` |
| **AC-04** (Unauthorized Ticket Detail)| - | `API-06` | `UI-07` | - |
| **AC-05** (Field Validation Errors) | `validateTicketForm` | `API-02` (Pass) | `UI-02` (Pass) | - |
| **AC-06** (Attachment Type Restriction)| `isPermittedMimeType`| `API-07` | `UI-03` (Pass) | - |
| **AC-07** (Attachment Size Restriction)| `isFileSizePermitted`| `API-08` | `UI-03` (Pass) | - |
| **AC-08** (Attachment Max 5 Limit) | - | `API-09` | `UI-07` | - |
| **AC-09** (Soft Removal with Reason) | - | `API-10` | `UI-07` | `E2E-01` |
| **AC-10** (Blocked Removed Download)| - | `API-11` | `UI-07` | `E2E-01` |
| **AC-11** (Search & Filter Query) | `buildTicketQuery` | `API-04` | `UI-06` | `E2E-01` |
| **AC-12** (Pagination Controls) | `paginateArray` | `API-05` | `UI-06` | - |
| **AC-13** (Inactive Requester Filter)| - | `API-12` (Pass) | `UI-01` (Pass) | - |
| **AC-14** (Safe Failure & Retention)| - | - | `UI-04` (Pass) | - |

---

## 4. Responsive and Visual Checklist

- [ ] **Desktop ($\ge 992$px):** Multi-column ticket form, tabular list with column headers, sticky header navigation with user badge.
- [ ] **Tablet (768–991px):** Two-column form layout, responsive table container without layout clipping.
- [ ] **Mobile ($< 768$px):** Vertically stacked form controls, card-based ticket list, full-width touch buttons ($\ge 44$px height), no horizontal window scroll.
- [ ] **Zen Green Palette Compliance:** Primary `#006B3C`, Secondary `#0B7A46`, Pale `#EAF6EF`, Background `#F5F7F6`.
- [ ] **Accessibility:** Visible keyboard focus outlines on all controls, `aria-required` and red asterisks on required inputs, screen-reader accessible error messages.

---

## 5. Test Commands
```bash
# Run server API test suite
npm --prefix server test

# Run client component test suite
npm --prefix client test

# Run E2E Playwright test suite
npm run test:e2e
```

---

## 6. Final Results
```
Server tests:
 ✓ tests/lab-01/health.test.ts (1 test) 23ms
 ✓ tests/lab-01/categories.test.ts (1 test) 102ms
 ✓ tests/lab-02/dev-requester.api.test.ts (3 tests) 121ms
 ✓ tests/lab-02/create-ticket.api.test.ts (3 tests) 607ms
 Test Files  4 passed (4)
      Tests  8 passed (8)

Client tests:
 ✓ tests/lab-01/App.test.tsx (3 tests) 139ms
 ✓ tests/lab-02/RequesterSelector.test.tsx (3 tests) 140ms
 ✓ tests/lab-02/CreateTicket.test.tsx (4 tests) 204ms
 Test Files  3 passed (3)
      Tests  10 passed (10)
```

---

## 7. Known Limitations or Deferred Tests
- Full authentication tests (passwords, JWT, RBAC) are deferred to Lab 3.
- IT Staff assignment and comment workflows are deferred to subsequent sprints.
