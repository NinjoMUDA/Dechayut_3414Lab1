# Lab 1 — Test Plan and Evidence  (fill this in)

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | Passed (HTTP 200, status: ok, service: TokTickIT API) |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | Passed (HTTP 200, returns 4 categories in ID order) |
| 3 | Vitest | Heading renders | Passed (TokTickIT heading in DOM) |
| 4 | Vitest | Success state shows Online + category list | Passed (Renders System Status: Online & 4 categories) |
| 5 | Vitest | Error state shows Offline + message | Passed (Renders System Status: Offline & error message) |

Paste your passing terminal output / screenshot below.
