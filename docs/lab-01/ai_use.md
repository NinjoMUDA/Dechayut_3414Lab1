# Lab 1 — AI Use and Reflection

**LLM/agent used:** Gemini 3.6 Flash / Claude Opus 4.6 via Antigravity Agentic Assistant

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | `ศึกษา file ที่มี ทั้งหมด แล้วเตรียมเขียน file markdown เพื่อเตรียมทำ lab` | Analyzed all lab sheets, starter files, and PDFs to construct `lab1_preparation.md`. |
| 2 | `Implement GET /api/health returning HTTP 200 with status ok and service name` | Verified backend Express endpoint implementation against `health.test.ts`. |
| 3 | `Define Category model in Prisma schema and create idempotent category seed` | Configured `schema.prisma` model and wrote `upsert` logic in `seed.ts`. |
| 4 | `Implement GET /api/categories endpoint returning categories in id order` | Built backend route to fetch categories via Prisma ORM with 500 error fallback. |
| 5 | `Implement App.tsx handling idle, loading, success, and error UI states` | Created clean Bootstrap React interface with online badge and category card list. |
| 6 | `Fix Vitest mock for checkSystem in App.test.tsx using vi.mock ESM strategy` | Resolved Vitest module isolation issue where spyOn failed to mock ESM imports. |
| 7 | `Add reviewer @vienggg and submit detailed peer review comments on partner PRs` | Executed GitHub CLI commands to link reviewer and post structured code reviews. |
| 8 | `Create Release PR from lab1-staging to main and verify all test suites on main` | Merged full-stack slice to main and validated Supertest/Vitest 100% pass rate. |

## Reflection
During Lab 1 development, AI assistance significantly accelerated boilerplate generation for React components and Express routes. However, deep critical thinking and manual oversight were essential in two key areas:
1. **Database & Container Networking:** The AI originally attempted migration on port 5432, but by inspecting Docker environment variables, I identified that the PostgreSQL container was mapped to port 15432 with `root:root` credentials, requiring a direct manual correction to `server/.env`.
2. **Vitest Module Isolation in ESM:** The initial AI-generated test mock used `vi.spyOn(api, "checkSystem")`, which failed because Vite pre-compiled ESM imports into `App.js` artifacts. I directed the AI to clean stale build artifacts and switch to module-level `vi.mock("../../src/api.js")` to achieve clean green test runs.

Using strict step-by-step approval protocols ("Ask First Protocol") ensured full control over branch hygiene and prevented accidental direct commits to `main` or `lab1-staging`.
