# Lab 2 Zen Green UI Specification

## 1. Design Philosophy & Color Palette
The TokTickIT interface adheres to the **Zen Green Theme**, offering a calm, clean, and modern design language without vintage ornamentation.

### Color Tokens

| Token Name | Hex Code | Purpose & Intended Use |
|---|---|---|
| `--color-primary-green` | `#006B3C` | App header background, primary action buttons, strong brand emphasis |
| `--color-secondary-green` | `#0B7A46` | Active tab indicators, focus outlines, secondary buttons, interactive links |
| `--color-pale-green` | `#EAF6EF` | Selected row highlight, success alerts, subtle panel backgrounds |
| `--color-page-bg` | `#F5F7F6` | Main viewport page background |
| `--color-surface` | `#FFFFFF` | Card backgrounds, modal containers, data tables |
| `--color-text-main` | `#1A2E22` | Dark charcoal-green for primary reading text (avoiding harsh #000000) |
| `--color-text-muted` | `#52665A` | Subtitles, metadata labels, helper text |
| `--color-border-subtle` | `#E0E6E2` | Card borders, table dividers, input borders |
| `--color-error` | `#DC3545` | Validation error text, invalid input borders, alert banners |
| `--color-warning` | `#D97706` | Warning badges (e.g. Urgent Priority, pending notices) |
| `--color-success` | `#198754` | Success confirmation alerts and badges |

---

## 2. Typography & Component Hierarchy

### Typography
- **Font Family:** Inter, system-ui, -apple-system, sans-serif
- **Headings:**
  - `h1` (Page Title): `24px / 1.3`, Semi-bold (600), `--color-text-main`
  - `h2` (Card / Section Header): `18px / 1.4`, Semi-bold (600), `--color-text-main`
  - `h3` (Sub-section): `15px / 1.4`, Medium (500), `--color-text-main`
- **Body & Labels:**
  - Form Label: `14px / 1.2`, Semi-bold (600), `--color-text-main`, positioned above inputs
  - Input Text: `14px / 1.5`, Regular (400)
  - Helper & Validation Text: `12px / 1.4`, Regular (400)

### Component Rules
1. **Labels:** Must appear directly above controls with a red asterisk (`*`, color `#DC3545`) for required fields.
2. **Inputs:** Single-line inputs have a consistent height of `40px` with `8px` border-radius.
3. **Multiline Description:** Taller (`min-height: 120px`), resizable vertically only.
4. **Read-Only Fields:** Light gray-green background (`#F0F4F2`), distinct neutral border, non-editable cursor.
5. **Button Hierarchy:**
   - **Primary CTA:** Background `#006B3C`, text `#FFFFFF`, hover `#0B7A46`.
   - **Secondary / Ghost:** White background, border `#0B7A46`, text `#0B7A46`.
   - **Destructive:** White background, border `#DC3545`, text `#DC3545`, hover background `#FDF2F2`.
   - **Disabled State:** Background `#E9ECEF`, text `#6C757D`, cursor `not-allowed`.
   - **Busy State:** Displays animated spinner (`fa-spin` / Bootstrap spinner) and disabled interaction.

---

## 3. Screen Layouts & States

### 3.1. Development Requester Selection Screen / Modal
- **Purpose:** Test simulation for choosing active Requester user before entering ticketing features.
- **Layout:** Centered Zen Green card with icon avatar, title "Select Development Requester", description banner explaining this is a testing mechanism for Lab 2, dropdown containing active seeded Requesters, and "Continue" CTA.
- **Header Shell Integration:** Once selected, top navigation bar displays user avatar icon, Requester Name, and a "Change Requester" dropdown action.

### 3.2. Create Ticket Screen (Create Mode)
- **Top Row (System / Read-Only):**
  - Requester Name: Pre-filled read-only text input.
  - Ticket Date: Current date/time (system generated).
- **Classification Row:**
  - Category: Dropdown populated from database (`Account and Access`, `Hardware`, `Software`, `Network`).
  - Related System: Dropdown populated from database (`Email`, `Campus Wi-Fi`, `VPN`, `LEB2 App`, etc.).
  - Requested Priority: Select input (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- **Main Fields:**
  - Ticket Summary: Text input (5–100 chars) with live char count and red validation message below.
  - Description: Textarea (10–2000 chars) with red validation message below.
- **Attachments Area:**
  - Drag-and-drop / File selection button (JPG, PNG, WEBP, PDF up to 5 MB, max 5 files).
  - Selected files preview list with size, type badge, and remove item button before submission.
- **Form Actions:**
  - "Submit Ticket" primary button (busy indicator on submit).
  - "Cancel" secondary button navigating back to My Tickets.

### 3.3. My Tickets Screen (List Mode)
- **Header Row:** Title "My Tickets", "Create Ticket" green button.
- **Search & Filters Card:**
  - Keyword Search box (Search by Ticket # or Summary).
  - Category filter dropdown.
  - Requested Priority filter dropdown.
  - IT Priority filter dropdown.
  - Status filter dropdown.
  - "Clear Filters" link/button.
- **Ticket Table (Desktop $\ge 992$px):**
  - Columns: Ticket No. (clickable link), Created Date, Summary, Category, Requested Priority (badge), IT Priority (badge), Current Status (badge), Last Updated.
- **Ticket Cards (Mobile $< 768$px):**
  - Stacked cards with Ticket No., Status badge, Summary header, Category/Priority tags, and tap to view details.
- **Pagination:** `< Previous [ 1 ] [ 2 ] [ 3 ] ... Next >` with current page highlighted in `--color-primary-green`.
- **Empty States:**
  - Zero tickets owned: "You have not submitted any tickets yet." + "Create Ticket" button.
  - Filter no results: "No tickets match your search criteria." + "Clear Filters" button.

### 3.4. Requester Ticket Detail Screen (View Mode)
- **Navigation Breadcrumb:** `My Tickets > Ticket Details (TKT-YYYY-XXXXXX)` + "Back to My Tickets" button.
- **Read-Only Information Grid:**
  - Ticket No., Ticket Date, Category, Related System, Requester, Requested Priority, IT Priority, Current Status.
  - Ticket Summary card & Description card.
- **Attachments Section:**
  - Tabbed or card section listing all uploaded attachments.
  - Active Attachments: File icon, filename, file size, upload timestamp, "Download" button, "Remove" button.
  - Soft-Removed Attachments: Filename, "Removed" badge, removal reason tooltip/text, disabled download.
  - "Add Attachment" button opening file picker + upload confirmation.
  - "Soft Remove" modal: Confirmation prompt requiring user to enter a mandatory removal reason.

---

## 4. Priority & Status Badges

| Type | Value | Badge Style |
|---|---|---|
| **Priority** | `LOW` | Pale green background `#EAF6EF`, text `#0B7A46` |
| **Priority** | `MEDIUM` | Soft amber background `#FEF3C7`, text `#B45309` |
| **Priority** | `HIGH` | Soft orange background `#FFEDD5`, text `#C2410C` |
| **Priority** | `URGENT` | Soft red background `#FEE2E2`, text `#B91C1C` |
| **Status** | `NEW` | Light cyan background `#E0F2FE`, text `#0369A1` |
| **Status** | `OPEN` / `IN_PROGRESS` | Pale green background `#EAF6EF`, text `#006B3C` |
| **Status** | `RESOLVED` | Pale green solid `#D1FAE5`, text `#065F46` |

---

## 5. Responsive Breakpoint Rules

| Viewport | Width | Layout Behavior |
|---|---|---|
| **Desktop** | $\ge 992$px | Full multi-column grid, tabular ticket list, side-by-side detail cards, max-width `1200px` centered. |
| **Tablet** | $768\text{px} - 991\text{px}$ | 2-column form rows, table with horizontal scrolling container. |
| **Mobile** | $< 768$px | Single-column stacked fields, card-based ticket list, mobile navbar collapse, full-width action buttons. |

---

## 6. Accessibility (a11y) & Usability
- High contrast ratio $\ge 4.5:1$ between text and background across all states.
- All interactive controls keyboard accessible (`Tab`, `Shift+Tab`, `Enter`, `Space`).
- Focus rings using `--color-secondary-green` with `2px` offset.
- Form inputs linked to `<label>` elements via `htmlFor`/`id`.
- Error messages connected via `aria-describedby`.
