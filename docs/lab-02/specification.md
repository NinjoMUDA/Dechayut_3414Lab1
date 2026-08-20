# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
Deliver a responsive, user-friendly, and secure Requester-facing MVP for TokTickIT using the Zen Green theme. The increment enables end-user Requesters to select a temporary Development Requester identity, submit support tickets with valid metadata and attachments, query and filter their own ticket history with strict user isolation, inspect ticket details in read-only mode, and manage supporting attachments with soft-removal rules.

---

## 2. Stakeholder Request Interpretation
The IT department needs a professional Requester portal to receive real support tickets before full authentication is delivered in Lab 3. The solution must provide:
1. A temporary Development Requester selection mechanism to test multi-user isolation.
2. An intuitive ticket creation form capturing problem descriptions, category, related system, priority, and file attachments.
3. A robust "My Tickets" list supporting search, multi-attribute filtering, sorting, and pagination, strictly limited to the active Requester's tickets.
4. A read-only Ticket Detail view with attachment download and soft-removal capabilities.
5. Consistent Zen Green visual design and mobile-responsive layout across all views.

---

## 3. Scope

### Included
- **Development Requester Selector:** Simulated login dropdown for testing active seeded Requesters, active identity indicator, and switching capability.
- **Ticket Creation (Create Mode):** Validated submission with auto-generated unique Ticket Number (`TKT-YYYY-XXXXXX`), category/system selection, priority, description, and initial attachments.
- **My Tickets View:** Requester-isolated paginated ticket list, text search (Ticket Number & Summary), filtering (Category, Requested Priority, IT Priority, Status), and sorting.
- **Ticket Detail View (View Mode):** Read-only ticket metadata presentation and attachment list.
- **Attachment Lifecycle:** Upload (JPG, PNG, WEBP, PDF up to 5 MB, max 5 active), secure download of active attachments, and soft removal with mandatory reason retaining metadata.
- **UI & UX:** Zen Green design language, responsive layout (Desktop, Tablet, Mobile), loading/empty/error states.
- **Testing & Quality:** Automated unit, API, UI, and E2E tests covering happy paths, boundaries, and validation failures.

### Excluded
- Real user authentication (passwords, JWT/sessions, roles, OAuth) — deferred to Lab 3.
- IT Staff workflow (dashboard, queue management, claiming/reassigning tickets, setting IT Priority).
- Ticket lifecycle status changes beyond `New` (in-progress, resolved, closed, reopened, cancelled).
- Collaboration features (Public Comments, Internal Notes, Actions Taken).
- Administrative user/category management.

---

## 4. Functional Requirements (FR)

- **FR-01 (Requester Selection):** The application shall provide a Development Requester Selector allowing users to pick from active seeded Requesters before accessing ticketing features.
- **FR-02 (Requester Context Display):** The application header shall display the active Requester's name and provide a "Change Requester" action at all times.
- **FR-03 (Requester Switching):** When a different Requester is selected, all ticket queries, lists, and form contexts shall immediately update to reflect the new Requester.
- **FR-04 (Reference Data Retrieval):** The system shall fetch active Categories and Related Systems from the database to populate dropdown selectors.
- **FR-05 (Ticket Creation):** Requesters shall be able to create a ticket by specifying Category, Related System, Ticket Summary, Requested Priority, Description, and optional initial attachments.
- **FR-06 (Unique Ticket Number):** The backend shall generate a unique official Ticket Number upon creation in the format `TKT-YYYY-XXXXXX` (where `YYYY` is the current year and `XXXXXX` is a sequential zero-padded number).
- **FR-07 (Default Status & Priority):** Newly created tickets shall default to `currentStatus = "NEW"` and `itPriority = "UNASSIGNED"` (or match requested priority pending triage).
- **FR-08 (My Tickets List):** Requesters shall view a paginated table/card list of tickets owned exclusively by the active Requester.
- **FR-09 (Search & Filter):** Requesters shall be able to search tickets by Ticket Number or Summary, and filter by Category, Requested Priority, IT Priority, and Status.
- **FR-10 (Sorting):** Requesters shall be able to sort the ticket list by Ticket Number, Created Date, and Last Updated Date (ascending/descending).
- **FR-11 (Pagination):** The ticket list shall support configurable page sizes (e.g. 5, 10, 20 items) with `< Previous` and `Next >` navigation.
- **FR-12 (Ticket Detail View):** Requesters shall be able to open and inspect the full details of any ticket they own in read-only mode.
- **FR-13 (Attachment Upload):** Requesters shall be able to upload permitted attachments (JPG, PNG, WEBP, PDF $\le 5$MB) during creation or directly on the Ticket Detail screen.
- **FR-14 (Attachment Download):** Requesters shall be able to securely download active attachments belonging to their tickets.
- **FR-15 (Soft Removal):** Requesters shall be able to soft-remove their own attachments by supplying a removal reason. Soft-removed attachments remain listed in metadata but cannot be downloaded or previewed.
- **FR-16 (Access Guarding):** Direct API requests or URL access to tickets or attachments belonging to another Requester shall be rejected with 403 Forbidden or 404 Not Found.

---

## 5. Business Rules (BR)

- **BR-01 (Ticket Number Uniqueness):** The official Ticket Number is generated by the backend and must be globally unique across all tickets.
- **BR-02 (Initial Ticket Status):** A new Ticket always begins with `Current Status = NEW`.
- **BR-03 (Dev Selector Limitation):** The Development Requester selector is strictly a testing simulation and does not constitute secure authentication.
- **BR-04 (Multi-Tenant Isolation):** Requesters can only view, search, open, and modify tickets and attachments that they own (`requesterId` matches).
- **BR-05 (Inactive Requesters):** Requesters flagged as `isActive = false` must not appear in the Development Requester Selector and cannot create tickets.
- **BR-06 (Summary Validation):** Ticket Summary is required, must be between 5 and 100 characters after trimming, and must not consist solely of whitespace.
- **BR-07 (Description Validation):** Ticket Description is required, must be between 10 and 2000 characters after trimming.
- **BR-08 (Priority Options):** `requestedPriority` must be one of `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- **BR-09 (Attachment Types):** Allowed attachment MIME types are strictly `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`. All other types are rejected with 400 Bad Request.
- **BR-10 (Attachment Size Limit):** Individual attachment file size must not exceed 5 MB (5,242,880 bytes).
- **BR-11 (Attachment Count Limit):** A single Ticket may have at most 5 active (non-removed) attachments at any time.
- **BR-12 (Attachment Soft Removal):** Removed files must have `isRemoved = true`, record `removalReason`, `removedAt` timestamp, and `removedByRequesterId`. The physical file reference is deactivated from download/preview endpoints.
- **BR-13 (Idempotent Reference Data):** Database seed must ensure reference categories, related systems, and test requesters can be re-seeded safely without duplicate key violations.
- **BR-14 (Form Error Preservation):** When ticket creation or attachment upload fails due to validation or server errors, all entered form values must remain preserved so the user does not lose input.

---

## 6. UI Specification Summary
*(Full specifications documented in [ui-spec.md](ui-spec.md))*

- **Color Tokens:**
  - Primary Green: `#006B3C` (Header, primary CTA, solid badges)
  - Secondary Green: `#0B7A46` (Active links, focus rings, hover states)
  - Pale Green: `#EAF6EF` (Selected rows, success alerts, subtle surfaces)
  - Background: `#F5F7F6` (Main background)
  - Surface: `#FFFFFF` (Cards, modals, tables with soft 1px border and subtle shadow)
- **Responsive Layout:**
  - **Desktop ($\ge 992$px):** Multi-column form layout, full tabular ticket list with sorting headers, side-by-side detail cards.
  - **Tablet (768–991px):** 2-column forms, compact table layout with horizontal scrolling wrapper.
  - **Mobile ($< 768$px):** Stacked vertical inputs, responsive ticket card list, full-width touch-friendly buttons.
- **Component States:** Explicit initial, loading spinner, field-level validation errors in dark red (`#DC3545`), busy submission indicators, and empty/no-results placeholders.

---

## 7. Data Changes (Prisma Schema)

```prisma
enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketStatus {
  NEW
  OPEN
  IN_PROGRESS
  PENDING
  RESOLVED
  CLOSED
  CANCELLED
}

model RequesterUser {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tickets   Ticket[]
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model RelatedSystem {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model Ticket {
  id                Int           @id @default(autoincrement())
  ticketNumber      String        @unique
  requesterId       Int
  requester         RequesterUser @relation(fields: [requesterId], references: [id])
  categoryId        Int
  category          Category      @relation(fields: [categoryId], references: [id])
  relatedSystemId   Int
  relatedSystem     RelatedSystem @relation(fields: [relatedSystemId], references: [id])
  summary           String
  description       String
  requestedPriority Priority      @default(MEDIUM)
  itPriority        Priority?
  currentStatus     TicketStatus  @default(NEW)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  attachments       Attachment[]

  @@index([requesterId])
  @@index([ticketNumber])
  @@index([categoryId])
  @@index([currentStatus])
}

model Attachment {
  id                 Int       @id @default(autoincrement())
  ticketId           Int
  ticket             Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  originalFilename   String
  storedFilename     String
  filePath           String
  fileSize           Int
  mimeType           String
  isRemoved          Boolean   @default(false)
  removalReason      String?
  removedAt          DateTime?
  removedByRequester Int?
  createdAt          DateTime  @default(now())

  @@index([ticketId])
  @@index([isRemoved])
}
```

---

## 8. API Contract Summary
*(Full specifications documented in [api-spec.md](api-spec.md))*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/requesters` | Fetch list of active Development Requesters |
| `GET` | `/api/categories` | Fetch all active ticket categories |
| `GET` | `/api/related-systems` | Fetch all active related IT systems |
| `POST` | `/api/tickets` | Create a new ticket (with initial attachments) |
| `GET` | `/api/tickets` | Paginated, filtered, sorted tickets for active Requester |
| `GET` | `/api/tickets/:id` | Fetch single ticket details (enforces requester ownership) |
| `POST` | `/api/tickets/:id/attachments` | Upload attachment to an owned ticket |
| `GET` | `/api/tickets/:id/attachments` | Retrieve attachment metadata list for a ticket |
| `GET` | `/api/attachments/:id/download` | Download active attachment file |
| `PATCH` | `/api/attachments/:id/soft-remove` | Soft-remove attachment with mandatory reason |

---

## 9. Acceptance Criteria (Given-When-Then)

- **AC-01 (Ticket Creation Success):** Given a selected active Requester and valid form inputs (Category, Related System, Summary "VPN disconnects on wake", Priority "HIGH", Description "Every morning VPN fails to reconnect"), when the user clicks "Submit Ticket", then a new Ticket is saved in the database with status `NEW`, a unique Ticket Number is generated, and a success banner displaying the Ticket Number appears.
- **AC-02 (Requester Context Guard):** Given no Development Requester is selected, when the user visits any ticket route (`/tickets`, `/create-ticket`), then the user is redirected to the Development Requester Selection modal/screen.
- **AC-03 (Multi-Requester Data Isolation):** Given Requester A ("Jennifer Anderson") owns Ticket `TKT-2026-000001` and Requester B ("David Lee") is selected, when Requester B opens "My Tickets" or queries `/api/tickets`, then `TKT-2026-000001` is not visible or returned.
- **AC-04 (Unauthorized Ticket Detail Access):** Given Requester B is selected and attempts to access `/api/tickets/:id` for a ticket owned by Requester A, then the server responds with 403 Forbidden (or 404 Not Found) and the UI displays an access denied message.
- **AC-05 (Field Validation Errors):** Given the Create Ticket form, when submitted with an empty Summary or Description under 10 characters, then submission is blocked and field-level error messages are displayed directly under the affected inputs.
- **AC-06 (Attachment File Type Restriction):** Given an attachment file of type `.exe` or `.txt`, when selected for upload, then the frontend and backend reject the file with an error message stating only JPG, PNG, WEBP, and PDF files are allowed.
- **AC-07 (Attachment Size Restriction):** Given an attachment file exceeding 5 MB in size, when selected for upload, then the system rejects the file with a clear file-size error message.
- **AC-08 (Attachment Max Limit):** Given a ticket that already contains 5 active attachments, when an attempt to upload a 6th attachment is made, then the upload is blocked with an error indicating the 5-attachment limit.
- **AC-09 (Soft Removal with Reason):** Given an active attachment on an owned ticket, when the user requests removal and enters a valid reason ("Replaced with updated screenshot"), then `isRemoved` is set to `true`, `removalReason` is stored, and the attachment status updates to "Removed".
- **AC-10 (Blocked Download for Removed File):** Given a soft-removed attachment, when a user requests download via `/api/attachments/:id/download`, then the server returns 410 Gone / 404 Not Found and does not serve the file binary.
- **AC-11 (Search & Filter Query):** Given a list of tickets, when the user types a search term or selects Category "Hardware" and Priority "HIGH", then the list immediately updates to display only matching tickets matching all criteria.
- **AC-12 (Pagination Controls):** Given 15 tickets owned by the Requester and a page size of 10, when viewing page 1, 10 tickets are shown and page 2 navigation is enabled; clicking "Next" displays the remaining 5 tickets.
- **AC-13 (Inactive Requester Filter):** Given a seeded requester with `isActive = false`, when the Development Requester Selector loads, then the inactive requester does not appear in the dropdown list.
- **AC-14 (Safe API Failure & Value Retention):** Given the backend is unavailable or returns 500 during ticket submission, when the user clicks submit, then a friendly alert message is displayed and all previously typed form values remain intact in the input fields.

---

## 10. Definition of Done (DoD)

### Product Completion
- [ ] All Functional Requirements (FR-01 through FR-16) implemented and verified.
- [ ] All Business Rules (BR-01 through BR-14) enforced in frontend and backend.
- [ ] All Acceptance Criteria (AC-01 through AC-14) covered by passing automated tests.
- [ ] Zen Green UI specification implemented and responsive across Desktop, Tablet, and Mobile viewports.
- [ ] Zero skipped, flaky, or commented-out test cases.

### Course Delivery
- [ ] GitHub Issues created, tracked on 6-column Kanban board, and moved to Done upon PR merge.
- [ ] Feature branches used for all work and merged into `lab2-staging` via peer review.
- [ ] Peer reviewer approvals and conversational resolution documented in `reviewer.md`.
- [ ] AI prompt logs and reflections documented in `ai_use.md`.
- [ ] Release PR opened and merged from `lab2-staging` into `main`.
- [ ] Submission PDF generated adhering strictly to `Answer Part 1` through `Answer Part 9`.

---

## 11. Assumptions and Decisions
1. **Ticket Number Format:** Use `TKT-YYYY-XXXXXX` generated via a PostgreSQL sequence / transaction counter to guarantee uniqueness.
2. **Requester Identity Storage:** Client persists `activeRequesterId` in `localStorage` and supplies it via `x-requester-id` HTTP header for all API requests to simulate authentication context cleanly.
3. **Storage Strategy:** Attachments are stored in `server/uploads/` with UUID-prefixed safe filenames, with database records referencing the metadata and relative storage path.
