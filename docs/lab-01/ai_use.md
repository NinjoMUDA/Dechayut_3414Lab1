# Lab 1 — AI Use and Reflection

**LLM/agent used:** Gemini 3.6 Flash / Claude Opus 4.6 via Antigravity Agentic Assistant

| Prompt Name | Actual Prompt Text & My Reflection |
|-------------|------------------------------------|
| **Plan Lab 1 Implementation** | Read the enclosed TokTickIT Lab 1 requirements. Summarize the four GitHub Issues, their dependencies, required outputs, and required automated tests. Propose an implementation order, but do not write code yet.<br/>**My Reflection:** This worked well in one shot to establish the initial dependency order (Issue 1 -> Issues 2 & 3 in parallel -> Issue 4). |
| **Set Up Full-Stack Project** | Setup the TokTickIT project tech stack as given in Lab 1 using React, TypeScript, Vite, and Bootstrap for frontend, and Node.js, Express, and TypeScript for backend. Configure PostgreSQL and Prisma.<br/>**My Reflection:** The AI generated the structure cleanly, but I had to manually adjust the database connection port from default 5432 to Docker container port 15432. |
| **Implement Health Check Endpoint** | Add GET /api/health returning HTTP 200 with status ok and service name TokTickIT API to the Express backend.<br/>**My Reflection:** The endpoint was generated accurately and passed Supertest validation immediately. |
| **Implement Category Seed & Model** | Define Category model in Prisma schema with id, unique name, and createdAt. Create idempotent seed script using upsert.<br/>**My Reflection:** Initial AI script used simple `create`, which would crash on multiple runs. I directed it to use `upsert` to guarantee idempotency. |
| **Implement Category List Endpoint** | Implement GET /api/categories endpoint returning categories from PostgreSQL ordered by id ascending.<br/>**My Reflection:** Ensured explicit `orderBy: { id: 'asc' }` was added to satisfy deterministic Supertest assertion order. |
| **Build Check System UI Component** | Implement App.tsx handling idle, loading, success, and error UI states with Bootstrap badge and category card list.<br/>**My Reflection:** Component UI rendered well, but I had to refine error state handling to correctly catch network connection failures. |
| **Fix Test Mock Isolation** | Fix Vitest mock for checkSystem in App.test.tsx using vi.mock ESM strategy.<br/>**My Reflection:** `vi.spyOn` failed due to Vite ESM pre-bundling. I directed the AI to use module-level `vi.mock("../../src/api.js")` to isolate component tests. |
| **Execute Peer Review & Release** | Create Release PR from lab1-staging to main and verify all test suites on main branch.<br/>**My Reflection:** Verified 100% green tests on main and ensured peer reviewer clicked formal Approve before merging. |

## Reflection
During Lab 1 development, AI assistance significantly accelerated boilerplate generation for React components and Express routes. However, deep critical thinking and manual oversight were essential in two key areas:
1. **Database & Container Networking:** The AI originally attempted migration on port 5432, but by inspecting Docker environment variables, I identified that the PostgreSQL container was mapped to port 15432 with `root:root` credentials, requiring a direct manual correction to `server/.env`.
2. **Vitest Module Isolation in ESM:** The initial AI-generated test mock used `vi.spyOn(api, "checkSystem")`, which failed because Vite pre-compiled ESM imports into `App.js` artifacts. I directed the AI to clean stale build artifacts and switch to module-level `vi.mock("../../src/api.js")` to achieve clean green test runs.

Using strict step-by-step approval protocols ("Ask First Protocol") ensured full control over branch hygiene and prevented accidental direct commits to `main` or `lab1-staging`.
