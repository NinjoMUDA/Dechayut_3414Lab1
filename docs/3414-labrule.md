# 3414-LabRule — Specific Rules & Boundaries for CPE 334 Labs

## 1. Strict Teammate Approval Workflow (PR Review)
- For every Issue PR, a teammate **MUST click 'Approve'** (Formal Approval Review) on GitHub, rather than just leaving a comment, before merging into the staging branch (`lab1-staging`).
- *(Lab 1 Exception Note: For Lab 1, comment-only approval before merge is tolerated if already done, but formal approval is strictly enforced starting Lab 2).*

## 2. Sequential Issue Development Boundaries
- Issues **MUST be completed sequentially**. Work on the next Issue cannot start until the previous Issue's PR is formally approved and merged.
- **Parallel Exception:** Issue 2 (API Health Check) and Issue 3 (Category Seed) are allowed to be worked on in parallel.

## 3. Documentation Branching Protocol (`/docs` Updates)
- Documentation files under `docs/` (`ai_use.md`, `reviewer.md`, `tests.md`) must be gradually updated and committed before the Issue 4 PR is approved/merged.
- If all Issues 1–4 are already merged into `main` but documentation files in `/docs` were missed or need final updates, a dedicated branch named `feature/Lab1Doc` **MUST** be created to update documentation and merge into `lab1-staging` → `main`.

## 4. `ai_use.md` Quality Requirement
- `ai_use.md` must emphasize **deep critical thinking** and personal reflection rather than generic AI autofill.
- Must include specific key prompts used, what was done with the outputs, and explicit instances where AI output was corrected or rejected.

## 5. Submission PDF Structuring Standards (LEB2 Submission)
- The single submission PDF (`report_lab01_{{student_id}}.pdf`) must **strictly follow the format and headings specified in the lab sheet checklist**.
- Every included image/screenshot **MUST** have a clear descriptive caption explaining what the image depicts.

## 6. Mandatory Kanban Project Board Integration
- GitHub Projects / KANBAN board **MUST** be actively utilized for task tracking throughout all development phases, moving items across columns (`Backlog`, `Specified`, `Started`, `PR Review`, `Fixing`, `Done`).
