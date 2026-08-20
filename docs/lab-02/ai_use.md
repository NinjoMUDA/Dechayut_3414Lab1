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
| 3 | Dev Requester Context | *(Upcoming)* | Implement Prisma schema, seed data, and Dev Requester selector. |
| 4 | Ticket Creation | *(Upcoming)* | Implement `POST /api/tickets` and Zen Green Create Ticket form. |
| 5 | My Tickets View | *(Upcoming)* | Implement multi-attribute query engine and My Tickets UI. |
| 6 | Ticket Detail & Attachments | *(Upcoming)* | Implement attachment upload, download, and soft removal. |

---

## My Reflection
Using Spec-Driven Development (Spec DD) and Test-Driven Development (TDD) with an AI coding assistant enables clear scoping and prevents requirement drift. By establishing the engineering contract upfront before writing source code, business rules and security boundaries (such as multi-user isolation and attachment constraints) are strictly defined and traceable to automated tests.
