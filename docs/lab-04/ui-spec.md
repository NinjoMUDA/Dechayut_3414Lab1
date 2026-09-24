# Sprint 4 UI Specification: Dashboards & Actions Taken

## 1. Visual Design Language (Zen Green Theme)
All Lab 4 additions strictly extend the **Zen Green** design language:
* **Primary Color (Forest Zen):** `#1b4332` (Navbar, primary headers, active tabs)
* **Secondary Brand (Sage Zen):** `#2d6a4f` (Buttons, action icons, focus rings)
* **Accent / Highlight (Mint Zen):** `#40916c` / `#52b788` (Status badges, cards)
* **Backgrounds:** `#f8f9fa` (Page background), `#ffffff` (Card background)
* **Borders & Dividers:** `#d8f3dc` / `#e9ecef`
* **Status Colors (with non-color cues & text labels):**
  * `NEW`: Indigo badge (`#4f46e5`, light `#e0e7ff`)
  * `OPEN`: Sky blue badge (`#0284c7`, light `#e0f2fe`)
  * `IN_PROGRESS`: Amber badge (`#d97706`, light `#fef3c7`)
  * `WAITING_FOR_REQUESTER`: Purple badge (`#7c3aed`, light `#ede9fe`)
  * `RESOLVED`: Emerald badge (`#059669`, light `#d1fae5`)
  * `CLOSED`: Gray badge (`#4b5563`, light `#f3f4f6`)
  * `CANCELLED`: Rose badge (`#e11d48`, light `#ffe4e6`)

---

## 2. IT Staff Dashboard UI (`/staff/dashboard`)

### 2.1 Layout Structure
1. **Welcome Banner:** Greeting with logged-in staff member's name and quick summary subtitle.
2. **Top Metric Summary Cards (5-column responsive grid):**
   * **New:** Count of unhandled new tickets (Drill-down: `/staff/queue?status=NEW`)
   * **Open:** Count of triaged open tickets (Drill-down: `/staff/queue?status=OPEN`)
   * **In Progress:** Count of active work items (Drill-down: `/staff/queue?status=IN_PROGRESS`)
   * **Waiting for Requester:** Count awaiting customer response (Drill-down: `/staff/queue?status=WAITING_FOR_REQUESTER`)
   * **My Assigned:** Count of active tickets where `ticketOwnerId == currentUserId` (Drill-down: `/staff/queue?assigned=me`)
3. **Operational Content Area (Split 8:4 Grid on Desktop):**
   * **Left (8 cols) — Recent Queue Tickets:**
     * Table/card list showing Ticket Number, Summary, Status Badge, Priority Badge, Requester Name, Updated Timestamp.
     * Accessible link on each row to navigate directly to Ticket Detail (`/staff/tickets/:id`).
     * "View All in Queue" button linking to `/staff/queue`.
   * **Right (4 cols) — Quick Actions & Priority Overview:**
     * Quick Actions: "Create Ticket" (+), "Search Tickets" (🔍), "My Assigned Queue" (📋).
     * Priority Breakdown Card: Count of Urgent, High, Medium, Low tickets.

### 2.2 States & Edge Cases
* **Loading:** Animated skeleton cards in place of metric counters and table rows.
* **Empty State:** If 0 tickets exist in queue, display clean empty illustration with text *"All caught up! No active tickets in the queue."*
* **Forbidden (HTTP 403):** If accessed by Requester, show forbidden alert banner and auto-redirect to `/requester/dashboard`.
* **Safe Error State:** Retry button displayed if API call fails.

---

## 3. Requester Dashboard UI (`/requester/dashboard`)

### 3.1 Layout Structure
1. **Welcome Banner:** Greeting with authenticated Requester's name.
2. **Key Metric Summary Cards (4-column responsive grid):**
   * **My Open Tickets:** Total active tickets submitted by requester (Drill-down: `/requester/my-tickets?status=open`)
   * **In Progress:** Tickets currently being worked on by IT Staff (Drill-down: `/requester/my-tickets?status=in_progress`)
   * **Resolved:** Tickets marked resolved waiting for closing or review (Drill-down: `/requester/my-tickets?status=resolved`)
   * **Closed:** Historically archived tickets (Drill-down: `/requester/my-tickets?status=closed`)
3. **Operational Content Area (Split 8:4 Grid on Desktop):**
   * **Left (8 cols) — My Recent Tickets:**
     * Concise list showing Ticket Number, Summary, Status Pill, Created/Updated Date.
     * Direct click navigates to Requester Ticket Detail (`/requester/tickets/:id`).
     * "View All My Tickets" link button.
   * **Right (4 cols) — Requester Quick Actions & Help Card:**
     * "Create Ticket" button (Prominent green primary button with icon).
     * "View My Tickets" button (Secondary outline button).
     * Service Desk contact info card.

### 3.2 States & Edge Cases
* **Empty State:** If requester has 0 tickets, display friendly prompt: *"You have not submitted any tickets yet."* with large "Submit Your First Ticket" button.

---

## 4. Actions Taken Panel on Ticket Detail (`/staff/tickets/:id` & `/requester/tickets/:id`)

### 4.1 Panel Layout
* Embedded directly under Ticket Description and above/alongside Comments & Notes.
* **Header:** Title "Actions Taken", badge counter showing total actions, and "+ Record Action Taken" button (visible only for IT Staff & Admin).
* **Actions Taken Feed/Table:** Chronological card list or structured table containing:
  * **Header row/pills:** Date/Time (formatted readable), Performed By (Name + Role badge).
  * **Description:** What action was executed.
  * **Result:** Outcome of the action.
  * **Follow-Up Flag:** If required, amber pill with icon *"Follow-Up Required"* and the `followUpNote` text block.
  * **Attachment Notes:** Small note icon with descriptive text reference (e.g., *"Diagnostic report uploaded as Attachment #2"*).
  * **Edit Button (IT Staff/Admin only):** Opens edit modal.

### 4.2 Record / Edit Action Modal Form
* **Fields:**
  1. `Action Date & Time` (datetime-local picker, defaults to current time).
  2. `Description` (textarea, required, min 5 chars).
  3. `Result` (textarea, required, min 3 chars).
  4. `Performed By` (read-only auto-populated text displaying current authenticated user name).
  5. `Follow-Up Required?` (checkbox / toggle switch).
  6. `Follow-Up Note` (textarea, conditionally required when checkbox is checked).
  7. `Attachment Notes` (text input, optional, placeholder: *"Reference image or log file name"*).
* **Validation & Feedback:** Inline red validation feedback under fields if submitted while invalid. Primary submit button shows spinner during API call.

---

## 5. Ticket Workflow & Resolution Gate UI

### 5.1 Status Transition Controls
* On IT Staff Ticket Detail: A prominent "Update Status" dropdown or button group displaying **only legally permitted transitions**:
  * From `NEW`: `OPEN`, `IN_PROGRESS`, `CANCELLED`
  * From `OPEN`: `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `CANCELLED`
  * From `IN_PROGRESS`: `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  * From `WAITING_FOR_REQUESTER`: `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
  * From `RESOLVED`: `CLOSED`, `REOPENED`
  * From `REOPENED`: `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `CANCELLED`
  * From `CLOSED` / `CANCELLED`: Terminal states (disabled or reopen only if permitted).
* **Resolution Modal:** When selecting `RESOLVED`, a modal prompts for mandatory `Resolution Summary`.
* **Advisory Indicator:** If Requester marked `requesterResolved: true`, a green alert badge appears: *"Requester indicated issue is resolved — Please review and confirm final resolution."*

---

## 6. Responsive Breakpoints & Accessibility
* **Desktop (≥ 1200px):** Full multi-column grid, expanded tables, side-by-side split view.
* **Tablet (768px – 1199px):** 2-column or 3-column metric cards, stack action panels.
* **Mobile (< 768px):** 1-column cards, full-width buttons, collapsible filters, zero horizontal scroll.
* **Accessibility Checklist:**
  - [x] Standard WCAG AA contrast ratio (> 4.5:1) for all text and badges.
  - [x] Clear `:focus-visible` outline rings on buttons, inputs, links.
  - [x] All modal dialogs trap focus and close on `Escape` key.
  - [x] Status pills include readable text labels alongside color.
