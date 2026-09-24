# AI Assistance Log & Reflection — Lab 4

## 1. LLM Model Information
* **Primary LLM:** Gemini 3.8 Flash (Medium) / Google Antigravity Agentic Assistant
* **Role:** Specification Agent & Pair Programming Coding Agent
* **Context Scope:** KMUTT CPE 334 Software Engineering Lab 4 (TokTickIT Sprint 4)

---

## 2. Selected Prompts & Tool Interactions

### Prompt 1: Lab 4 Handout Analysis & Requirement Decomposition
* **User Input:** `อ่านข้อมูลทั้งหมดใน LAB4 เพื่อเตรียมทำ LAB4`
* **AI Action:** Read and analyzed `LAB4/SE+Lab+4.pdf` cover-to-cover, extracted stakeholder request, learning outcomes, business rules (BR-01, BR-02), database increment, REST API requirements, Zen Green UI constraints, 9 report sections, and decomposed Sprint 4 into 6 distinct GitHub issues.

### Prompt 2: Branch Setup & Remote Staging Initialization
* **User Input:** `ok`
* **AI Action:** Verified `main` branch status, pulled latest changes, created and pushed `lab4-staging` to remote repository as the base branch for Sprint 4 PRs.

### Prompt 3: Issue Creation & Sprint 4 Specification Drafting
* **User Input:** `ok`
* **AI Action:** Created GitHub Issues #41 to #46 via `gh issue create`, branched `docs/lab4-contract` from `lab4-staging`, drafted comprehensive engineering contract (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `reviewer.md`).

---

## 3. My Reflection on Specification & Coding Agents
Using an AI Specification Agent at the inception of Sprint 4 ensures that requirements are crystallized into verifiable Acceptance Criteria (ACs) and numbered Business Rules (BRs) before any database migration or UI code is written. This Spec-DD approach prevents architectural drift, guarantees backward compatibility with earlier lab sprints, and provides a clear traceability chain from user requirements directly into automated test assertions.
