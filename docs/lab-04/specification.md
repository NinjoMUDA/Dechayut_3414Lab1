# Sprint 4 Engineering Contract & Specification

## 1. Sprint Goal
Deliver the final operational increments of TokTickIT: a reliable, role-enforced parent-child "Actions Taken" work-tracking subsystem under each Ticket, authoritative role-appropriate dashboards for Requesters and IT Staff/Administrators, rigorous Ticket lifecycle state-transition and resolution-gate enforcement, while guaranteeing complete regression stability across all Labs 1–3 functionality under the Zen Green design system.

## 2. Stakeholder Request
"The service desk can now receive Tickets and IT Staff can communicate with Requesters, but we still need a reliable way to plan and track the actual work. Add Actions Taken under each Ticket. Each action should contain Action Date/Time, Action Description, Result, Performed by (auto), Follow-Up Required?, Follow-up Note (required when follow-up is needed), Attachment Notes (what file to look for images etc.). The primary Ticket Owner remains responsible for coordinating the Ticket as a whole. Requesters may continue to indicate that the problem appears resolved, but IT Staff must review the work and formally update the Ticket. Add useful dashboards for Requesters and IT Staff, but keep them concise and connected to the detailed screens. Finally, polish and harden the complete application so that all earlier features continue to work consistently under the Zen Green design language."

## 3. Scope
### 3.1 Included Scope
* **Actions Taken Subsystem:** Parent-child work items under Tickets. Fields: Action Date/Time, Description, Result, Performed by (auto-populated with authenticated IT Staff / Admin), Follow-up Required (boolean), Follow-up Note (mandatory if follow-up required is true), Attachment Notes.
* **Role Permissions:** Requesters have read-only view of Actions Taken on their owned tickets. IT Staff and Administrators have create, view, and update permissions on accessible tickets.
* **Ticket Lifecycle & Resolution Gate:** Full status lifecycle (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`). Backend-enforced state transitions. Requester `requesterResolved` toggle is advisory; formal transition to `RESOLVED` requires IT Staff/Admin action with resolution summary.
* **Role-Appropriate Dashboards:**
  * Requester Dashboard: Total open tickets, tickets waiting for requester, recently updated tickets, recently resolved tickets, quick actions (Create Ticket, View My Tickets), drill-down links.
  * IT Staff / Admin Dashboard: Unassigned tickets, tickets owned by current user, tickets by status/priority, recently updated tickets, quick actions, drill-down links. Admin view adds concise user account summary.
* **Concurrency & Stale Update Handling:** Detect stale updates on Ticket status transitions via `updatedAt` checking to prevent overwriting concurrent modifications.
* **Zero Regression & Hardening:** All previous authentication, ticket creation, queues, comments, internal notes, file attachments, and user management verified and passing.

### 3.2 Explicit Exclusions
* Automatic SLA clocks, breach notifications, and automated escalation timers.
* Outgoing email, SMS, LINE, or push notifications.
* Inventory tracking, spare parts billing, labor-hour rate calculations, and payroll.
* Multi-level management approval workflows or cryptographic signatures.
* Business intelligence / custom report builders / data export warehouses.
* Multi-tenant data segregation.

---

## 4. Functional Requirements (FR)

* **FR-01 (Actions Taken Creation):** IT Staff and Admins can create an Action Taken record under any accessible Ticket. The `performedById` is automatically populated from the authenticated user's session token and cannot be spoofed.
* **FR-02 (Actions Taken Fields Validation):** The backend validates that Action Date/Time and Description are present and non-empty. If `followUpRequired` is true, `followUpNote` must not be empty.
* **FR-03 (Actions Taken Update):** Permitted IT Staff and Admins can update an existing Action Taken record. The update preserves creation audit data while recording `updatedAt`.
* **FR-04 (Actions Taken Read Visibility):** Requesters can view all Actions Taken records associated with Tickets they own. Requesters are blocked (HTTP 403) from creating or updating Actions Taken.
* **FR-05 (Ticket Status Transition Matrix):** The system enforces valid state transitions according to the defined lifecycle matrix. Invalid transitions return HTTP 400 with a descriptive error.
* **FR-06 (Resolution Gate Enforcement):** Changing a Ticket status to `RESOLVED` requires an IT Staff or Admin role and a non-empty `resolutionSummary`. Requester advisory toggle (`requesterResolved`) does not automatically alter `currentStatus`.
* **FR-07 (Stale Update Detection):** Ticket status update requests must supply the client's current `clientUpdatedAt` timestamp. If the database record's `updatedAt` does not match `clientUpdatedAt`, the request is rejected with HTTP 409 Conflict.
* **FR-08 (Requester Dashboard API):** The backend provides an endpoint returning authorized operational metrics (total open, waiting for requester, recently updated, recently resolved) scoped strictly to tickets owned by the authenticated Requester.
* **FR-09 (IT Staff Dashboard API):** The backend provides an endpoint returning operational metrics (unassigned count, assigned-to-me count, counts by status and priority, recent tickets) for IT Staff and Admins.
* **FR-10 (Dashboard Drill-Down Navigation):** All metric cards on Requester and IT Staff dashboards must support accessible navigation to filtered ticket lists.
* **FR-11 (Inactive Assignee Handling):** If an assigned user is deactivated, existing assignments and historical action records remain linked, but new action assignments to inactive users are rejected.
* **FR-12 (Zen Green Shell & Consistency):** All views maintain Zen Green color palette, responsive grid layouts, accessible focus states, and zero horizontal scrolling.
* **FR-13 (Regression Stability):** All existing APIs and features from Labs 1–3 maintain 100% test coverage and behavioral integrity.

---

## 5. Business Rules (BR)

* **BR-01 (Ticket Ownership of Actions):** Every Action Taken record belongs to exactly one parent Ticket. Deleting or cascading a Ticket cascades its Actions Taken.
* **BR-02 (Independent Performer Coordination):** While a Ticket has one primary Ticket Owner (`ticketOwnerId`), Actions Taken under that Ticket may be executed and logged by any active IT Staff or Administrator.
* **BR-03 (Immutability of Performer Identity):** The `performedBy` field in an Action Taken record is immutable once created, representing the verified identity of the staff member who performed the action.
* **BR-04 (Conditional Follow-Up Constraint):** If `followUpRequired` is `true`, `followUpNote` is strictly required (minimum 3 characters). If `followUpRequired` is `false`, `followUpNote` is optional or null.
* **BR-05 (Requester Advisory Separation):** When a Requester flags `requesterResolved: true`, the Ticket's `currentStatus` remains unchanged (e.g., `IN_PROGRESS` or `WAITING_FOR_REQUESTER`). Only IT Staff/Admin can formally transition the status to `RESOLVED`.
* **BR-06 (Resolution Preconditions):** A transition to `RESOLVED` must contain a non-empty `resolutionSummary`. A Ticket cannot be resolved if it is already `CLOSED` or `CANCELLED`.
* **BR-07 (Reopen Transition Preconditions & Terminal States):** Only Tickets in `RESOLVED` status may be transitioned to `REOPENED`. When reopened, the Ticket enters `REOPENED` status. From `REOPENED`, permitted transitions are `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, and `CANCELLED`. Tickets in `CLOSED` and `CANCELLED` statuses are strictly terminal and cannot be transitioned to any other status.
* **BR-08 (Requester Dashboard Isolation):** Requester metrics are calculated solely against Tickets where `requesterId == currentUserId`. No cross-requester data is exposed.
* **BR-09 (Dashboard Calculation Rules):**
  * Requester Open Tickets: Count of owned tickets where `currentStatus IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED')`.
  * Requester Waiting Tickets: Count of owned tickets where `currentStatus == 'WAITING_FOR_REQUESTER'`.
  * IT Staff Unassigned: Count of tickets where `ticketOwnerId IS NULL` and `currentStatus NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')`.
  * IT Staff Assigned-to-Me: Count of tickets where `ticketOwnerId == currentUserId` and `currentStatus NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')`.
* **BR-10 (Chronological Action Ordering):** Actions Taken on a Ticket Detail page are displayed in chronological order of `actionDateTime` (oldest first or newest first with stable secondary sort on `id`).
* **BR-11 (Concurrency Protection):** If the Ticket was updated by another session since the client loaded the view, status transition is rejected with HTTP 409 Conflict.
* **BR-12 (Empty State Guarantees):** Dashboards and Actions Taken lists must render dedicated, accessible empty states with actionable guidance when zero records exist.

---

## 6. UI Specification Summary
* **Requester Dashboard:** Summary metric cards (My Open Tickets, In Progress, Resolved, Closed), Quick Action buttons (Create Ticket, View My Tickets), Recent Tickets list with status pills and drill-down links.
* **IT Staff Dashboard:** Operational metrics cards (New, Open, In Progress, Waiting for Requester, My Assigned), Quick Action buttons (Create Ticket, Search Tickets, My Queue), Recent Queue Tickets with live status badges.
* **Actions Taken Panel on Ticket Detail:** Embedded tab or dedicated card section displaying list of actions taken, including Date/Time, Performer, Description, Result, Follow-up badge, and Attachment notes. Contains "Record Action Taken" button opening a clean modal/inline form with form validation.
* **Ticket Workflow Controls:** Action bar with dropdown/buttons containing only legally permitted transitions based on current status.
* Full details in [ui-spec.md](ui-spec.md).

---

## 7. Data Changes (Database Increment)

### 7.1 ActionTaken Model (Prisma Schema Increment)
```prisma
model ActionTaken {
  id               Int      @id @default(autoincrement())
  ticketId         Int
  ticket           Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actionDateTime   DateTime @default(now())
  description      String
  result           String
  performedById    Int
  performedBy      User     @relation(fields: [performedById], references: [id])
  followUpRequired Boolean  @default(false)
  followUpNote     String?
  attachmentNotes  String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([ticketId])
  @@index([performedById])
  @@index([actionDateTime])
}
```

### 7.2 Database Design Decisions Justification (Minimum 2 Required)
1. **Decision 1 — Parent-Child Foreign Key Cascade with Indexed Foreign Keys:**
   * *Rationale:* `ActionTaken` records are intrinsically bound to their parent `Ticket`. An `onDelete: Cascade` ensures that orphaned actions do not exist if a test ticket is deleted. Explicit indexes on `ticketId` and `actionDateTime` ensure high-throughput query performance when rendering ticket detail screens and chronological audit timelines.
2. **Decision 2 — Denormalized Attachment Reference via `attachmentNotes` Text Field:**
   * *Rationale:* Rather than enforcing a complex m:n join table between `ActionTaken` and `Attachment` in this sprint, `attachmentNotes` stores structured descriptive pointers to relevant files (e.g. file names or image locations) as requested by stakeholder. This cleanly isolates action reporting while allowing full traceability without mutating the existing Lab 2 file storage lifecycle.

### 7.3 Migration & Backfill
* Migration strategy preserves all existing User, Ticket, Attachment, Comment, and Note records.
* Legacy tickets have 0 actions taken initially without breaking queries.
* Idempotent seed script (`server/prisma/seed.ts`) updated to generate realistic Tickets with 0, 1, and multiple Actions Taken across diverse statuses.

---

## 8. API Contract Summary
* `GET /api/tickets/:id/actions`: Returns list of Actions Taken for a ticket (Requester owned, IT Staff / Admin all).
* `POST /api/tickets/:id/actions`: Creates Action Taken. Authenticated IT Staff / Admin only.
* `PATCH /api/tickets/:id/actions/:actionId`: Updates Action Taken. Authenticated IT Staff / Admin only.
* `GET /api/dashboards/requester`: Returns Requester metric counts and recent tickets.
* `GET /api/dashboards/staff`: Returns IT Staff metric counts, priority breakdown, and recent tickets.
* `PATCH /api/tickets/:id/status`: Transitions status with transition validation, `updatedAt` conflict check, and required resolution summary.
* Full schema and payload details in [api-spec.md](api-spec.md).

---

## 9. Acceptance Criteria (AC)

* **AC-01:** Given an authenticated IT Staff user, when submitting valid data to create an Action Taken, then the record is saved with `performedById` matching the authenticated user.
* **AC-02:** Given an authenticated Requester, when attempting to create or update an Action Taken, the server responds with HTTP 403 Forbidden.
* **AC-03:** Given a create/update Action Taken request with `followUpRequired: true` and an empty `followUpNote`, then the server returns HTTP 400 Bad Request with validation message.
* **AC-04:** Given an authenticated Requester viewing their own Ticket, all existing Actions Taken for that Ticket are returned and rendered.
* **AC-05:** Given an authenticated Requester viewing another user's Ticket, the request is rejected with HTTP 403 Forbidden.
* **AC-06:** Given an authenticated Requester requesting `/api/dashboards/requester`, the returned metrics count only Tickets where `requesterId` matches the requester's ID.
* **AC-07:** Given an authenticated IT Staff requesting `/api/dashboards/staff`, metrics accurately reflect unassigned tickets, tickets assigned to current user, and status breakdowns.
* **AC-08:** Given a Ticket in `NEW` status, permitted transitions are `OPEN`, `IN_PROGRESS`, and `CANCELLED`. Direct transitions from `NEW` to `RESOLVED`, `CLOSED`, or `REOPENED` are rejected with HTTP 400.
* **AC-09:** Given a request to set status to `RESOLVED`, if `resolutionSummary` is missing or blank, the transition is rejected with HTTP 400.
* **AC-10:** Given a status update with an outdated `updatedAt` timestamp, the server responds with HTTP 409 Conflict.
* **AC-11:** Given an inactive IT Staff user ID, assigning an Action Taken or Ticket Owner to that user is rejected with HTTP 400.
* **AC-12:** Given empty database tables or zero matching tickets for a dashboard metric, the dashboard renders clean zero counts and accessible empty states without crashing.

---

## 10. Definition of Done (DoD)
- [ ] Database schema updated via Prisma migration without data loss.
- [ ] Idempotent seed generates Tickets with 0, 1, and multiple Actions Taken.
- [ ] REST APIs implemented and tested for Actions Taken, Dashboards, and Status Transitions.
- [ ] UI components created and styled in Zen Green: IT Staff Dashboard, Requester Dashboard, Actions Taken Panel, Workflow Controls.
- [ ] Responsive behavior verified across Desktop (1280px), Tablet (768px), and Mobile (375px).
- [ ] Accessibility verified: keyboard focus, semantic labels, non-color cues, no overflow.
- [ ] 100% of unit, API, UI, and E2E test suites pass on `lab4-staging` and `main`.
- [ ] Visual evidence screenshots collected in `artifacts/lab-04/screenshots/`.
- [ ] All PRs peer-reviewed and approved by @vienggg.

---

## 11. Assumptions and Decisions
* **Advisory Requester Resolve:** The `requesterResolved` boolean remains on Ticket to record requester confirmation, while `currentStatus` transition to `RESOLVED` remains strictly an IT Staff / Admin action.
* **Dashboard Data Payload:** Dashboards return calculated aggregates and a trimmed list of the 5 most recent tickets to optimize payload size and response time.
