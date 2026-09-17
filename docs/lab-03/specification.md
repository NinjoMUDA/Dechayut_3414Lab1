# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
Evolve the TokTickIT platform from simulated development personas into a production-grade role-based system. Sprint 3 replaces the temporary Development Requester selector with secure authentication, mandatory first-login password changes, role-based authorization (Requester, IT Staff, Administrator), an operational IT Staff Ticket Queue and Detail workflow (with ownership, IT Priority, status transitions, Public Comments, and role-restricted Internal Notes), and a minimalist Administrator User Management console—while fully preserving existing Lab 2 Requester tickets, attachments, and Zen Green design conventions.

---

## 2. Stakeholder Request Interpretation
The stakeholder requires a transition from the Lab 2 prototyping simulator to an authentic multi-role enterprise IT support application:
1. **Authentication & Identity:** Replace the client-side Requester selector with secure email/password login, session invalidation on logout, and mandatory password reset on initial credential assignment.
2. **Role-Based Authorization:** Strictly partition functionality between three roles:
   - **Requester:** Creates, views, and manages only owned tickets and attachments; posts public comments; indicates problem resolution.
   - **IT Staff:** Operates the shared ticket queue; claims/reassigns ticket ownership; sets IT priority; drives ticket status transitions; posts public comments and private internal notes.
   - **Administrator:** Manages user accounts (list, search, filter, create, edit, activate/deactivate, set temporary password); enforces safety rules (preventing self-deactivation and eliminating the last administrator).
3. **Data & Workflow Integrity:** Evolve the Prisma schema and PostgreSQL database without data loss. Requesters cannot see internal notes or unauthorized tickets. Hiding UI buttons is insufficient; all permissions are strictly enforced on backend endpoints.

---

## 3. Scope

### Included
- **Authentication System:** Secure credential verification, password hashing with bcrypt, session token (JWT/cookie), current user endpoint (`GET /api/auth/me`), logout, and first-login password update gate (`POST /api/auth/change-password`).
- **Data Migration:** Migration of existing Requester identities into unified `User` accounts with hashed credentials and assigned roles without breaking foreign keys on existing Tickets and Attachments.
- **Requester Continuation:** Seamless authenticated ticket creation and "My Tickets" management with complete removal of the temporary selector.
- **Public Comments:** Append-only conversation thread visible to Requester, IT Staff, and Admin (`GET` / `POST /api/tickets/:id/comments`).
- **Internal Notes:** Append-only operational notes visible strictly to IT Staff and Admin (`GET` / `POST /api/tickets/:id/notes`). Forbidden (403) to Requesters.
- **Requester Resolution Indication:** Requester-accessible action to signal that an issue appears resolved without prematurely closing the ticket.
- **IT Staff Ticket Queue:** Server-side search, filtering (category, priority, status, ownership), sorting, and pagination for support triage (`GET /api/staff/tickets`).
- **IT Staff Ticket Detail Operations:** Ticket ownership claim/reassignment, IT Priority adjustment, and permitted status transitions (`PATCH /api/staff/tickets/:id`).
- **Administrator User Management:** Minimalist user list, search by name/email, role filtering, account creation, profile editing, activation/deactivation, and password reset.
- **Zen Green UI:** Consistent Zen Green application shell showing authenticated user, active role badge, role-appropriate navigation tabs, responsive layouts (Desktop, Tablet, Mobile), and accessible feedback states.
- **Automated Testing:** Unit, integration/API, UI component, and end-to-end (E2E) Playwright suites covering happy paths, edge cases, safety rules, and authorization boundaries.

### Excluded
- Email invitations, password-reset emails, MFA, social login, and SSO.
- Self-registration / public signup.
- Actions Taken by IT Staff (deferred to Lab 4).
- Formal SLA calculations, automated escalation rules, and notification dispatchers.
- Advanced analytics / KPI dashboards beyond simple queue counters.
- Multi-tenant organization hierarchies, customer departments, and user profile photos.
- User deletion, bulk import/export, and account audit history tables.
- Mandatory user list pagination or multi-column simultaneous sorting in Administrator screen.

---

## 4. Functional Requirements (FR)

### Authentication & Authorization
- **FR-01 (Authentication):** Active users shall authenticate using email and password. Unauthenticated requests to protected endpoints return `401 Unauthorized`.
- **FR-02 (Session Verification):** The application shall verify the active session on reload via `GET /api/auth/me` and restore user identity and permissions.
- **FR-03 (Mandatory First-Login Password Change):** When a user with `mustChangePassword = true` logs in, they are blocked from standard views and presented exclusively with the mandatory Change Password screen until a valid new password is confirmed.
- **FR-04 (Logout):** Authenticated users shall be able to log out, terminating their session and redirecting to the login screen.
- **FR-05 (Server-Side Authorization):** All protected endpoints shall strictly validate the caller's role and resource ownership server-side. Forbidden operations return `403 Forbidden`.

### Requester Capabilities
- **FR-06 (Authenticated Ticket Management):** Requesters shall create and view tickets tied automatically to their authenticated user ID without passing or spoofing client-supplied IDs.
- **FR-07 (Public Comments):** Requesters shall view all public comments on their tickets and submit new comments.
- **FR-08 (Mark Problem Resolved):** Requesters shall be able to flag their ticket as "Problem Appears Resolved", providing prompt feedback to IT Staff.

### IT Staff Operations
- **FR-09 (Staff Ticket Queue):** IT Staff shall access a shared queue with text search (summary, ticket number), filters (category, status, priority, ownership), column sorting, and pagination.
- **FR-10 (Ticket Claim & Reassignment):** IT Staff shall be able to claim unassigned tickets or reassign tickets to other active IT Staff / Admin members.
- **FR-11 (IT Priority Management):** IT Staff shall adjust the IT Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) independently of the Requester's requested priority.
- **FR-12 (Ticket Status Workflow):** IT Staff shall transition ticket status across permitted states: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
- **FR-13 (Internal Notes):** IT Staff shall record private internal notes on tickets. Internal notes must never be accessible or leaked to Requesters.

### Administrator User Management
- **FR-14 (User Listing & Search):** Administrators shall view all system users with search by name/email and optional role filtering.
- **FR-15 (User Creation):** Administrators shall create user accounts with full name, unique email, a single role (`REQUESTER`, `IT_STAFF`, `ADMIN`), activation flag, and initial password.
- **FR-16 (User Editing):** Administrators shall update existing users' names, emails, roles, and active status.
- **FR-17 (Password Reset):** Administrators shall reset a user's password, automatically setting `mustChangePassword = true`.
- **FR-18 (Admin Protection Rules):** The system shall prohibit an Administrator from deactivating their own account, and prohibit deactivating or reassigning the role of the system's last active Administrator.

---

## 5. Business Rules (BR)

- **BR-01 (Active Credentials):** Only an active user (`isActive = true`) with valid credentials may authenticate. Inactive accounts receive generic credentials rejection or account disabled error without leaking account state.
- **BR-02 (Password Change Gate):** A user flagged with `mustChangePassword = true` cannot access tickets, queues, or admin settings until a new password satisfying complexity rules is saved.
- **BR-03 (Requester Identity Binding):** The authenticated JWT/session determines ticket ownership. Any client-provided `requesterId` in payload or query is ignored or validated against the authenticated user.
- **BR-04 (Public Comments Visibility):** Public Comments are visible to the ticket's Requester, IT Staff, and Administrators.
- **BR-05 (Internal Notes Restriction):** Internal Notes are strictly restricted to IT Staff and Administrators. Requesters querying notes or receiving ticket payloads must receive `403 Forbidden` or sanitized responses with notes omitted.
- **BR-06 (Resolution Delegation):** Requesters may indicate that the problem appears resolved, but only IT Staff (or Admin) can formally transition the ticket to `RESOLVED` or `CLOSED`.
- **BR-07 (Password Complexity):** Passwords must be at least 8 characters in length, containing at least one uppercase letter, one lowercase letter, and one number.
- **BR-08 (Unique Email):** User email addresses must be unique across the system (case-insensitive).
- **BR-09 (Single Role Assignment):** Each user possesses exactly one primary role: `REQUESTER`, `IT_STAFF`, or `ADMIN`.
- **BR-10 (No Self-Deactivation):** An Administrator cannot deactivate their own active account.
- **BR-11 (Last Administrator Guarantee):** The system must guarantee at least one active Administrator exists at all times. Attempts to deactivate or demote the sole active Administrator are rejected with `400 Bad Request`.
- **BR-12 (Ticket Ownership):** A ticket may have zero or one primary `ticketOwnerId` belonging to an active user with role `IT_STAFF` or `ADMIN`.
- **BR-13 (Initial IT Priority):** Upon ticket creation, `itPriority` is initialized to match the Requester's `requestedPriority`.
- **BR-14 (Valid Ticket Status Transitions):**
  - `NEW` $\rightarrow$ `OPEN`, `IN_PROGRESS`, `CANCELLED`
  - `OPEN` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `IN_PROGRESS` $\rightarrow$ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `WAITING_FOR_REQUESTER` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
  - `RESOLVED` $\rightarrow$ `CLOSED`, `REOPENED`
  - `CLOSED` $\rightarrow$ `REOPENED`
  - `REOPENED` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`
  - `CANCELLED` $\rightarrow$ Terminal (or `REOPENED` by IT Staff)
- **BR-15 (Non-Empty Comments/Notes):** Public comments and internal notes must contain between 1 and 2000 non-whitespace characters. Both are append-only; editing and deletion are prohibited.
- **BR-16 (Soft Deactivation over Deletion):** User records are deactivated (`isActive = false`) rather than physically deleted to maintain relational integrity with tickets, comments, and attachments.

---

## 6. UI Specification Summary
*(Refer to [ui-spec.md](ui-spec.md) for full wireframes and responsive behavior)*

- **Brand Tokens:** Zen Green theme (`#006B3C` Primary Header/CTA, `#0B7A46` Hover/Accent, `#EAF6EF` Soft Background, `#F5F7F6` App Canvas).
- **Navigation Shell:** Responsive navbar displaying Brand Logo, Role-specific nav links (Requester: *My Tickets*, *Create Ticket*; IT Staff: *Ticket Queue*; Admin: *User Management*), Current User Name + Role Badge, and *Logout* button.
- **Login & Password Change:** Standalone clean card container. Dynamic error alerts for invalid credentials or inactive accounts. Modal/screen barrier for mandatory password update.
- **IT Staff Queue:** Search input, category filter, status filter, priority filter, assigned/unassigned filter, sorting dropdown/headers, paginated table on desktop and responsive cards on mobile.
- **IT Staff Ticket Detail:** Two-column desktop / stacked mobile layout. Left: read-only ticket metadata and attachments. Right: operational controls (assignee selector, IT priority selector, status transition dropdown), tabbed or separate sections for Public Comments and private Zen-tinted Internal Notes.
- **Administrator Console:** Zen Green table showing users, search and role filter bar, "+ Create User" modal, and slide-over/modal "Edit User" form with activation toggle and "Reset Password" action.

---

## 7. Data Changes (Prisma Schema)

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMIN
}

enum TicketStatus {
  NEW
  OPEN
  IN_PROGRESS
  WAITING_FOR_REQUESTER
  RESOLVED
  CLOSED
  REOPENED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model User {
  id                 String          @id @default(uuid())
  email              String          @unique
  passwordHash       String
  name               String
  role               Role            @default(REQUESTER)
  isActive           Boolean         @default(true)
  mustChangePassword Boolean         @default(false)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  ticketsCreated     Ticket[]        @relation("RequesterTickets")
  ticketsAssigned    Ticket[]        @relation("AssignedTickets")
  comments           PublicComment[]
  notes              InternalNote[]
}

model Ticket {
  id                 String          @id @default(uuid())
  ticketNumber       String          @unique
  summary            String
  description        String
  requestedPriority  Priority        @default(MEDIUM)
  itPriority         Priority        @default(MEDIUM)
  currentStatus      TicketStatus    @default(NEW)
  requesterResolved  Boolean         @default(false)

  categoryId         String
  category           Category        @relation(fields: [categoryId], references: [id])
  relatedSystemId    String?
  relatedSystem      RelatedSystem?  @relation(fields: [relatedSystemId], references: [id])

  requesterId        String
  requester          User            @relation("RequesterTickets", fields: [requesterId], references: [id])

  ticketOwnerId      String?
  ticketOwner        User?           @relation("AssignedTickets", fields: [ticketOwnerId], references: [id])

  attachments        Attachment[]
  comments           PublicComment[]
  notes              InternalNote[]

  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
}

model PublicComment {
  id        String   @id @default(uuid())
  content   String
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}

model InternalNote {
  id        String   @id @default(uuid())
  content   String
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
```

---

## 8. API Contract Summary
*(Refer to [api-spec.md](api-spec.md) for complete payload schemas)*

- `POST /api/auth/login` — Authenticate email/password; returns user info & session token.
- `GET /api/auth/me` — Return current authenticated user profile & role.
- `POST /api/auth/change-password` — Change password; clears `mustChangePassword`.
- `POST /api/auth/logout` — Invalidate session.
- `GET /api/staff/tickets` — Paginated, filtered, searchable ticket queue for IT Staff / Admin.
- `GET /api/staff/tickets/:id` — Retrieve full ticket details including operational fields and internal notes.
- `PATCH /api/staff/tickets/:id` — Update ticket owner, IT priority, or status.
- `GET /api/tickets/:id/comments` — Fetch public comments for a ticket.
- `POST /api/tickets/:id/comments` — Add public comment (Requester, IT Staff, Admin).
- `GET /api/tickets/:id/notes` — Fetch internal notes (IT Staff, Admin only; 403 for Requester).
- `POST /api/tickets/:id/notes` — Add internal note (IT Staff, Admin only; 403 for Requester).
- `PATCH /api/tickets/:id/resolve-indicator` — Requester flags `requesterResolved = true`.
- `GET /api/admin/users` — Admin user list with search & role filter.
- `POST /api/admin/users` — Admin creates user with initial credentials.
- `PATCH /api/admin/users/:id` — Admin edits user name, email, role, or active status.
- `POST /api/admin/users/:id/reset-password` — Admin assigns a temporary password.

---

## 9. Acceptance Criteria (AC)

- **AC-01:** Given an active user with valid credentials, when logging in, the backend establishes authenticated session and returns identity & role.
- **AC-02:** Given a user with `mustChangePassword = true`, when login succeeds, normal application routes are blocked until a new valid password is saved.
- **AC-03:** Given an authenticated Requester, when client queries tickets or attachments, only resources owned by the user are returned.
- **AC-04:** Given an authenticated Requester, when requesting internal notes endpoint, the request is rejected with `403 Forbidden` without leaking notes.
- **AC-05:** Given an IT Staff user, when viewing the Ticket Queue, tickets can be searched by summary/number and filtered by status, priority, and category with pagination.
- **AC-06:** Given an IT Staff user, when updating a ticket, they can claim ownership, reassign owner, set IT priority, and execute valid status transitions.
- **AC-07:** Given an authenticated user, when posting a public comment, it appears chronologically for Requester, IT Staff, and Admin.
- **AC-08:** Given an Administrator, when viewing User Management, they can search, filter by role, create users, update profiles, and reset passwords.
- **AC-09:** Given an Administrator, when attempting to deactivate their own account or the sole remaining active Admin, the operation is blocked with a 400 error.
- **AC-10:** Given an inactive account (`isActive = false`), authentication attempts are rejected.

---

## 10. Product Definition of Done (DoD)
- [ ] Prisma schema updated, migrated, and seeded with idempotent test accounts (4 active Requesters, 1 inactive Requester, 3 active IT Staff, 1 inactive IT Staff, 1 active Admin).
- [ ] All Lab 2 ticket/attachment data preserved and seamlessly associated with migrated user accounts.
- [ ] All authentication and authorization endpoints implemented with comprehensive server-side checks.
- [ ] IT Staff Ticket Queue and Ticket Detail operational screens implemented in Zen Green theme.
- [ ] Public Comments and role-restricted Internal Notes operational.
- [ ] Administrator User Management console implemented with safety guards.
- [ ] 100% passing automated unit, API, UI, and E2E tests.
- [ ] All documentation files (`specification.md`, `tests.md`, `ui-spec.md`, `api-spec.md`, `reviewer.md`, `ai-use.md`) complete.
- [ ] Peer reviewed, approved, and merged into `lab3-staging` and subsequently into `main`.

---

## 11. Assumptions and Implementation Decisions
1. **JWT in HTTP-only Cookie / Authorization Header:** Supports both cookie and Bearer tokens for seamless web UI and automated API test execution.
2. **Password Hashing:** Implemented with `bcrypt` using 10 salt rounds.
3. **Seeded Passwords:** All seeded test accounts receive standard predictable passwords for testing (e.g., `Password123!`), with selected accounts flagged with `mustChangePassword = true` to verify the first-login gate.
