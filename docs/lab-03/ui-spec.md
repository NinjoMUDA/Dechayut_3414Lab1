# Lab 3 Zen Green UI Specification

## 1. Design Philosophy & Color Palette
TokTickIT retains the **Zen Green Theme** introduced in Lab 2, providing a clean, calm, and modern enterprise interface without retro ornamentation. All new screens (Authentication, IT Staff Queue, Ticket Detail operations, and Administrator User Management) strictly follow the established token and layout architecture.

### Color Tokens

| Token Name | Hex Code | Purpose & Intended Use |
|---|---|---|
| `--color-primary-green` | `#006B3C` | Navbar background, primary action buttons, focused tab underline |
| `--color-secondary-green` | `#0B7A46` | Interactive hover states, active links, focused input borders |
| `--color-pale-green` | `#EAF6EF` | Selected table row highlight, light badge background, success alerts |
| `--color-page-bg` | `#F5F7F6` | Main viewport application background |
| `--color-surface` | `#FFFFFF` | Card containers, modal sheets, data tables |
| `--color-text-main` | `#1A2E22` | Dark charcoal-green for body reading and header typography |
| `--color-text-muted` | `#52665A` | Subtitles, metadata labels, helper text |
| `--color-border-subtle` | `#E0E6E2` | Card outlines, table dividers, input borders |
| `--color-internal-bg` | `#FFFBEB` | Warning-tinted background for restricted Internal Notes section |
| `--color-internal-border` | `#FDE68A` | Border for restricted Internal Notes panel |
| `--color-error` | `#DC3545` | Validation error text, invalid border, destructive action |
| `--color-warning` | `#D97706` | Medium/Urgent priority badge, status alerts |
| `--color-success` | `#198754` | Resolved status badge, active user badge, success confirmations |

---

## 2. Typography & Component Hierarchy

### Typography
- **Font Family:** Inter, system-ui, -apple-system, sans-serif
- **Headings:**
  - `h1` (Page Title): `24px / 1.3`, Semi-bold (600), `--color-text-main`
  - `h2` (Card / Section Header): `18px / 1.4`, Semi-bold (600), `--color-text-main`
  - `h3` (Sub-section / Tab): `15px / 1.4`, Medium (500), `--color-text-main`
- **Body & Labels:**
  - Form Label: `14px / 1.2`, Semi-bold (600), `--color-text-main`
  - Input Text: `14px / 1.5`, Regular (400)
  - Helper & Validation Text: `12px / 1.4`, Regular (400)

### Component Conventions
1. **Labels & Validation:** Positioned above inputs; required inputs marked with red asterisk (`*`). Validation errors rendered directly below in `#DC3545`.
2. **Buttons:**
   - **Primary:** Background `#006B3C`, text `#FFFFFF`, hover `#0B7A46`.
   - **Secondary / Outline:** White background, border `#0B7A46`, text `#0B7A46`.
   - **Destructive:** Border `#DC3545`, text `#DC3545`, hover background `#FDF2F2`.
   - **Disabled / Busy:** Opacity 0.65 with spinning circular indicator during asynchronous operations.
3. **Role & Status Badges:** Pill-shaped (`border-radius: 50rem; padding: 0.25rem 0.65rem; font-size: 0.75rem; font-weight: 600`).
   - `Requester`: `#EAF6EF` background, `#006B3C` text.
   - `IT Staff`: `#E0F2FE` background, `#0369A1` text.
   - `Administrator`: `#FEF3C7` background, `#92400E` text.
   - `Active`: `#D1FAE5` background, `#065F46` text.
   - `Inactive`: `#F3F4F6` background, `#6B7280` text.

---

## 3. Screen Layouts & Specifications

### 3.1. Application Shell & Navigation Bar
- **Navbar Header:** Solid `#006B3C` background.
- **Brand Logo:** TokTickIT mark with white typography.
- **Role-Specific Navigation Links:**
  - **Requester:** `My Tickets`, `Create Ticket`
  - **IT Staff:** `My Queue` (Ticket Queue)
  - **Administrator:** `User Management`
- **User Profile Area (Right):**
  - Displays user full name with role pill badge.
  - Dropdown menu featuring:
    - User email & role summary
    - `Logout` button

### 3.2. Login Screen
- **Layout:** Centered card (`max-width: 420px`) on `--color-page-bg`.
- **Elements:**
  - Brand header with TokTickIT logo.
  - Title: "Sign in to your account".
  - Email Address input with validation.
  - Password input with toggle show/hide visibility icon.
  - "Sign In" primary full-width button.
  - Error banner for invalid credentials or inactive accounts.
  - Disabled / busy state with loading spinner during authentication.

### 3.3. Mandatory First-Login Password Change Screen
- **Trigger:** Displayed when user logs in with `mustChangePassword = true`. All other routes blocked.
- **Layout:** Centered card (`max-width: 460px`).
- **Elements:**
  - Title: "Change Your Password".
  - Subtitle: "You must change your initial password to continue."
  - Current (temporary) password input.
  - New password input.
  - Confirm new password input.
  - Visual checklist of password requirements:
    - [x] At least 8 characters
    - [x] Include upper and lower case letters
    - [x] Include a number and a special character
  - "Continue" primary button (disabled until criteria are met).

### 3.4. IT Staff Ticket Queue (`My Queue`)
- **Top Bar:** Page Title "Ticket Queue", total results counter (e.g., "Showing 1 to 10 of 42 tickets").
- **Search & Filter Controls:**
  - Full-width search bar with debounce: "Search by ticket number or summary...".
  - Filter toggle / row: Category dropdown, Requested Priority dropdown, IT Priority dropdown, Status dropdown, and Assignment filter ("All", "Assigned to Me", "Unassigned").
- **Desktop Table View ($\ge 992$px):**
  - Columns: Ticket No (clickable), Created Date, Summary, Category, Req. Priority, IT Priority, Status, Owner.
  - Sortable headers with sort directional arrows.
- **Mobile Card View ($< 768$px):**
  - Compact cards with Ticket No, Status badge, Summary, Req/IT priority pills, Owner name, and tap target opening detail.
- **Pagination Controls:** Centered pagination with `< Previous`, numbered pages `1 2 3 ...`, and `Next >`.
- **Empty & Feedback States:** Clear messages for empty queue, no search results found, and loading skeleton.

### 3.5. IT Staff Ticket Detail Screen
- **Breadcrumb:** `My Queue > Ticket Detail (TKT-YYYY-XXXXXX)` with "Back to Queue" button.
- **Two-Column Responsive Layout:**
  - **Left Column (Ticket Info & Context):**
    - Read-only fields: Ticket No, Created Date, Category, Related System, Requester Name/Email, Requested Priority.
    - Full Ticket Summary and Description.
    - Attachments viewer and download panel (reused from Lab 2).
    - "Problem Appears Resolved" badge if indicated by Requester.
  - **Right Column (Operational Actions & Ownership):**
    - **Current Status:** Select dropdown showing permitted transitions (`Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Cancelled`).
    - **Ticket Owner:** Select dropdown of active IT Staff / Admin, or "Claim Ticket" quick-button.
    - **IT Priority:** Select dropdown (`Low`, `Medium`, `High`, `Urgent`).
    - **Resolution Summary:** Text input required when marking ticket `Resolved`.
- **Communication Tabs / Panels:**
  - **Public Comments Tab:**
    - Timeline showing author name, role badge, timestamp, and message.
    - "Add Public Comment" textarea and "Post Comment" button.
  - **Internal Notes Tab (IT Staff & Admin ONLY):**
    - Highlighted with `--color-internal-bg` and warning banner: *"Internal notes are visible only to IT Staff and Administrators. Requesters cannot see these notes."*
    - Chronological list of notes with staff author name and timestamp.
    - "Add Internal Note" textarea and "Save Note" button.

### 3.6. Requester Ticket Detail (Lab 3 Additions)
- Retains Lab 2 layout, removing the Dev Requester Selector.
- Adds Public Comments section enabling Requester to read updates and reply.
- Adds "Problem Appears Resolved" action button allowing Requester to notify IT Staff.

### 3.7. Administrator User Management Screen
- **Header:** Title "User Management", "+ Create User" primary action button.
- **Search & Filters:** Search input ("Search by name or email...") and Role filter dropdown (`All Roles`, `Requester`, `IT Staff`, `Administrator`).
- **User Table (Desktop):**
  - Columns: Name, Email Address, Role (pill badge), Status (Active / Inactive badge), Actions ("Edit" button).
- **Create User Slide-Over / Modal:**
  - Full Name input (required).
  - Email Address input (required, format validated).
  - Role selector: `Requester`, `IT Staff`, `Administrator`.
  - Active toggle (default `true`).
  - Initial Password input (with helper note: *"User will be prompted to change password on first login"*).
  - "Save User" and "Cancel" buttons.
- **Edit User Slide-Over / Modal:**
  - Full Name, Email Address, Role dropdown, Active toggle.
  - "Reset Initial Password" action button (triggers temporary password dialog).
  - Safety Guards:
    - If user is the currently logged-in Administrator: Active toggle is disabled with message *"You cannot deactivate your own account"*.
    - If user is the last active Administrator: Role change and Active toggle are disabled with message *"Cannot deactivate or demote the system's last active Administrator"*.
  - "Save Changes" and "Cancel" buttons.

---

## 4. Responsive & Accessibility Rules
1. **Breakpoints:**
   - Desktop: $\ge 992$px (multi-column forms, data tables, side-by-side detail view).
   - Tablet: $768$px – $991$px (stacked forms, horizontally scrollable tables).
   - Mobile: $< 768$px (single-column cards, full-width buttons, collapsible hamburger nav).
2. **Accessibility:**
   - High color contrast meeting WCAG AA standards.
   - Visible keyboard focus rings (`2px solid #0B7A46; outline-offset: 2px`).
   - Accessible ARIA attributes on modal dialogues, alert banners, and expandable accordions.
   - Screen reader announcements for form validation errors and dynamic status updates.
