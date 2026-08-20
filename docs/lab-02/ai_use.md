# Lab 2 AI Use Log & Reflection

## AI Model Used
- **Primary AI Agent:** Antigravity (Gemini 3.7 Flash)
- **Role:** Specification & Full-Stack Implementation Assistant

---

## Key Prompts and Actions Log

| # | Phase / Topic | Prompt Given to AI | AI Action & Engineering Output |
|---|---|---|---|
| 1 | Engineering Contract | "อ่านและทำความเข้าใจ lab 2ก่อน แล้วค่อยเขียน plan" | Analyzed 22-page Lab 2 labsheet, drafted 6-issue decomposition, and prepared comprehensive engineering specification (`specification.md`, `tests.md`, `ui-spec.md`, `api-spec.md`). |
| 2 | Spec & Test Matrix | "เริ่มเลย" | Generated full functional requirements (FR-01..16), business rules (BR-01..14), acceptance criteria (AC-01..14), and mapped planned automated tests across unit, API, UI, and E2E levels. |
| 3 | Dev Requester Context | "ทำต่อเลยจนกว่าจะให้ review" | Implemented Prisma schema (`RequesterUser`, `RelatedSystem`, `Category`, `Ticket`, `Attachment`), migration, seed, active requester backend API, and Zen Green RequesterSelector UI with full test coverage (5 server tests, 6 client tests). |
| 4 | Ticket Creation | "ลุยต่อ" | Implemented `POST /api/tickets` with unique `TKT-YYYY-XXXXXX` generator, field validations, and Zen Green CreateTicket UI with attachment validation and error preservation (8 server tests, 10 client tests). |
| 5 | My Tickets View | "review แล้วต่อเลย" | Implemented `GET /api/tickets` multi-attribute query engine with multi-tenant requester isolation, keyword search, category/priority/status filters, sorting, pagination, and Zen Green responsive table/card MyTickets UI (13 server tests, 15 client tests). |
| 6 | Ticket Detail & Attachments | "ต่อเลย" | Implemented `GET /api/tickets/:id` (with 403 guard), attachment upload (Multer, JPG/PNG/WEBP/PDF $\le 5$MB, max 5 limit), blocked download for removed files (410 Gone), soft removal with mandatory reason, and Zen Green `RequesterTicketDetail` / `AttachmentSection` UI (22 server tests, 19 client tests). |

---

## My Reflection
Using Spec-Driven Development (Spec DD) and Test-Driven Development (TDD) with an AI coding assistant enables clear scoping and prevents requirement drift. By establishing the engineering contract upfront before writing source code, business rules and security boundaries (such as multi-user isolation and attachment constraints) are strictly defined and traceable to automated tests.
