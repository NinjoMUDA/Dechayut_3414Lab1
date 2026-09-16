# Lab 3 AI Use and Reflection Log

## 1. AI Agents and Models
- **Specification & Coding Agent:** Antigravity AI (Google DeepMind)
- **Model:** Gemini 3.8 Flash (Medium)

---

## 2. Selected Key Prompts & AI Contributions

| # | Task / Area | Prompt Summary | AI Output & Engineering Contribution |
|---|---|---|---|
| 1 | **Sprint 3 Decomposition** | "Create Sprint 3 Engineering Contract covering specification.md, ui-spec.md, api-spec.md, and tests.md based on the Lab 3 handout." | Structured the 3 system roles, operational status transition rules, and mapped all 10 acceptance criteria into measurable test IDs. |
| 2 | **Database Migration Strategy** | "Evolve Prisma schema from RequesterUser to User without dropping existing Lab 2 tickets or attachments." | Identified that automatic migrate dev would drop tables. Crafted dedicated zero-data-loss migration renaming `RequesterUser` $\rightarrow$ `User` and adding role, credentials, and comment/note entities. |
| 3 | **Authentication Backend** | "Implement JWT and cookie-based authentication endpoints with bcrypt password hashing and first-login gate." | Created `auth.ts` helper with `authenticateToken`, `requireRole`, and `optionalAuthenticate`, and mounted `/api/auth/login`, `/api/auth/me`, `/api/auth/change-password`, `/api/auth/logout`. |
| 4 | **Test Automation (Server)** | "Write Supertest API integration tests covering valid login, invalid password, inactive accounts, first-login password change, and requester resource isolation." | Generated `auth.api.test.ts` and `authorization.api.test.ts`, verifying HTTP status codes and ensuring password hashes are never leaked. |
| 5 | **Frontend Auth & State Management** | "Build AuthContext in React managing token storage, session rehydration from /api/auth/me, and role state." | Created `AuthContext.tsx` providing reactive `login`, `logout`, and `changePassword` actions with graceful backward-compatibility for legacy tests. |
| 6 | **Zen Green Login & Password Gate** | "Implement Login and ChangePassword components complying with Zen Green UI design rules and live password complexity checks." | Built responsive forms with inline validation, password visibility toggles, real-time checklist indicators, and loading spinners. |
| 7 | **IT Staff Ticket Queue Implementation** | "Implement GET /api/staff/tickets with multi-criteria filtering, sorting, pagination, and build StaffTicketQueue responsive component with Zen Green theme." | Implemented secure endpoint guarded for IT_STAFF and ADMIN with case-insensitive search, category, status, priority, and assignment filters, created StaffTicketQueue component with desktop table and mobile cards, and authored comprehensive unit and integration tests. |

---

## 3. My Reflection

Working with the AI specification and coding agent during Lab 3 highlighted the critical importance of contract-first engineering. By drafting `specification.md`, `ui-spec.md`, `api-spec.md`, and `tests.md` before writing application code, we avoided architectural ambiguity regarding role separation and data ownership. 

A standout moment was handling the database migration: automated tooling (`prisma migrate dev`) initially attempted to drop the `RequesterUser` table, which would have destroyed all existing Lab 2 tickets. Working methodically with the agent allowed us to intercept this destructive action, author an explicit SQL migration (`ALTER TABLE "RequesterUser" RENAME TO "User"`), and preserve 100% of existing tickets and attachments while smoothly introducing authentication.
