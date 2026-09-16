# Session State — Master Handoff Document

## Historical Lab/Session Summary
- Lab 1: Completed and merged to main.
- Lab 2: Completed and merged to main (PR #26). Built Requester ticketing, category selection, file attachments, and unit/integration/E2E test suite.
- Lab 3: Issue #27 (Sprint 3 Engineering Contract & Specifications) completed and merged via PR #33 by @vienggg.

## Current Branch & Active Issue
- **Branch:** `feature/28-auth-foundation` (branched from `lab3-staging`)
- **Active Issue:** Issue #28 — Feature: Authentication Foundation & Requester Migration

## Kanban Status
| Issue | Status |
|---|---|
| #27 Docs: Sprint 3 Engineering Contract & Specifications | Done |
| #28 Feature: Authentication Foundation & Requester Migration | PR Review |
| #29 Feature: IT Staff Ticket Queue | Backlog |
| #30 Feature: IT Staff Ticket Operations & Notes | Backlog |
| #31 Feature: Administrator User Management | Backlog |
| #32 Integration, System Verification & Release | Backlog |

## Project Structure
```
toktickit/
├── client/          # React + Vite + Bootstrap
├── server/          # Express + TypeScript + Prisma
└── docs/
    ├── lab-01/
    ├── lab-02/
    └── lab-03/      # specification.md, ui-spec.md, api-spec.md, tests.md
```

## Database Status
- Migrations: Lab 3 schema initialized with zero data loss (`20260916100000_init_lab3`)
- Target Staging: `lab3-staging`

## Task Checklist — Issue #28
- [x] Create `feature/28-auth-foundation` branch
- [x] Update Prisma schema: Add `Role`, `User`, `PublicComment`, `InternalNote` models, migrate Requester
- [x] Implement database migration & idempotent seed data with bcrypt
- [x] Implement Auth backend: `/api/auth/login`, `/api/auth/me`, `/api/auth/change-password`, `/api/auth/logout`
- [x] Implement Auth middleware (`authenticateToken`, `requireRole`)
- [x] Write server auth API tests (`server/tests/lab-03/auth.api.test.ts`, `server/tests/lab-03/authorization.api.test.ts`)
- [x] Implement client Login & mandatory Change Password screens in Zen Green style
- [x] Write client tests (`client/tests/lab-03/Login.test.tsx`, `client/tests/lab-03/ChangePassword.test.tsx`)
- [x] Verify all tests pass (30 server + 27 client)
- [ ] Open Pull Request to `lab3-staging` and link Issue #28

## Last Executed Command
`git checkout -b feature/28-auth-foundation` (Exit code: 0)
