# AI EXECUTION RULES & PROJECT BOUNDARIES

## 1. The "Ask First" Protocol & Dynamic Execution Modes (CRITICAL)
By default, operate in a strict step-by-step loop (Standard Ask-First Mode):
1. **Plan:** Briefly list the exact files you will modify and the terminal commands you will run for the *current small step*.
2. **PAUSE:** Stop generating text entirely. End your response with exactly this phrase: `[Awaiting User Approval to Execute]`.
3. **Execute:** Only after the user replies with approval ("yes", "go", "proceed"), make the file edits and run the commands.
4. **Report:** Briefly state if the step succeeded or failed, then propose the plan for the next step and PAUSE again.

### Mode Switching & Reset Protocol:
* **Default Mode (Strict Ask-First):** By default, the AI MUST ALWAYS stop and ask for user confirmation before executing any action, terminal command, or file modification.
* **Temporary Autonomous Mode:** The AI may only execute autonomously if the user explicitly instructs it to do so for the current request (e.g., *"go auto"*, *"continue without asking"*, *"run autonomously"*).
* **Automatic Reset to Default:** As soon as an autonomous instruction/task finishes, OR whenever the user sends any new message (even if the user does not explicitly say "back to normal"), the execution mode **AUTOMATICALLY RESETS to Default (Ask-First)**. The AI must never stay in autonomous mode across turns unless explicitly commanded again.

---

## 2. Token Efficiency & Anti-Hallucination
* **Zero Yapping:** No conversational filler, pleasantries, or explanations of basic code syntax. Provide only the required output.
* **Strict Scope:** Do not add features outside the current Lab's instructions. Do NOT speculate on future features.
* **No Speculation:** Base all database models, API endpoints, and UI elements strictly on the provided instruction files. If a detail is missing, STOP and ask the user for clarification.
* **No Fabricated Evidence:** Never report a test as "passing" or a step as "done" without actually running the command and showing the real terminal output. Acceptance criteria are only satisfied when verified against the labsheet's exact wording — not assumed.
* **Modern UI:** Ensure the React frontend uses a clean, modern design style using Bootstrap, strictly avoiding any vintage aesthetics.

---

## 3. What NOT To Do (Workflow Violations to Avoid)
* **DO NOT** commit or push directly to `main` or staging branches (`lab1-staging`, `lab2-staging`, etc.). All work (including all documentation and minor typo fixes) must reach staging via a Pull Request.
* **DO NOT** push documentation updates directly to `main` or staging. Standalone docs updates must use a `docs/<lab>-<topic>` branch (e.g., `docs/lab1-ai-use`, `docs/lab2-specs`) and open a Pull Request.
* **DO NOT** rely on keywords alone (`Closes #X`, `Fixes #X`, `Resolves #X`) in PR descriptions to link Issues when targeting staging branches. Because staging is not the repository's default branch, GitHub treats keywords as plain mentions. You MUST link the Issue via the PR "Development" panel (gear icon ⚙).
* **DO NOT** confuse linking a branch with linking a PR. Linking a branch on the Issue page is optional and does NOT satisfy the requirement; the graded check is strictly linking the Pull Request to its Issue.
* **DO NOT** run any file edit or terminal command (including `git commit`, `git push`, `gh pr create`) without first confirming via `git status` / `git branch` that you are on the correct branch for the current Issue.
* **DO NOT** commit `.env`, credentials, or anything matching `.gitignore`. Only `.env.example` (blank template) may be committed.
* **DO NOT** open a Pull Request with `main` as the base unless it is the final Lab release PR. All feature-branch and docs PRs target `lab<N>-staging`.
* **DO NOT** start a new Issue until the previous Issue is fully tested, documented, and approved/merged by your partner.
* **DO NOT** overwrite or delete the existing starter scaffold unless explicitly replacing it with required logic.
* **DO NOT** combine multiple terminal commands if one depends on the success of the other (e.g., do not run tests if the build fails).
* **DO NOT** move an Issue card to `PR Review` until the PR is opened and verified as linked to the Issue (the card on the board must display the PR number badge, and the PR sidebar under "Development" must show the linked Issue).
* **DO NOT** open a new PR when fixing review comments. All corrections must be pushed to the existing feature branch so the PR updates automatically.
* **DO NOT** merge any authored Pull Request. ALL Pull Requests MUST be reviewed, approved, and **merged directly by your peer reviewer (partner/friend)** on GitHub.
* **DO NOT** merge silently without replying to comments. An approval with silence underneath it is not a review.

---

## 4. Silent Documentation Updates & Markdown Transparency
To preserve context without wasting output tokens, silently update the following files, but **do not print their contents in the chat unless asked**. This is critical so a new AI session can instantly resume work.
* `LAB<N>/session_state.md` (หรือ `toktickit/docs/session_state.md`) (Master Handoff Document) — update after every approved step, not just at the end of an Issue. It must strictly contain:
    * **Historical Lab/Session Summary:** Cumulative summary of what features, architecture, and configuration were completed in previous labs or sessions.
    * **Current Branch & Active Issue:** (e.g., `feature/1-project-foundation`, Issue 1).
    * **Kanban Status:** Exact placement in the board (Backlog, Specified, Started, PR Review, Fixing, Done) — only move to Done after the user confirms tests pass and PR is merged.
    * **Project Structure:** Updated tree-view of `toktickit/client`, `toktickit/server`, and `toktickit/server/prisma`.
    * **Architecture & DB State:** Note if Prisma is initialized, migrations run, or seeding completed.
    * **Task Checklist:** Granular Kanban-style list of what is `[x]` DONE and what is `[ ]` PENDING for the current Issue.
    * **Last Executed Command:** The exact terminal command just run and its exit status (Pass/Fail).
* `toktickit/docs/lab-<XX>/ai_use.md` — log key prompts and actions taken (e.g., `toktickit/docs/lab-01/ai_use.md`, `toktickit/docs/lab-02/...`).
* `toktickit/docs/lab-<XX>/tests.md` — update the table of Supertest and Vitest test cases as they're written and run.
* `toktickit/docs/lab-<XX>/reviewer.md` — prepare and update peer review details (reviewer name, PR links, comments given/received, and resolutions) as Pull Requests are managed.
* **Markdown Edit Transparency:** Whenever proposing to modify any `.md` file, always show the user the exact diff or text content of what will be modified in the proposal step before executing.

---

## 5. Report Generation Protocol
* Whenever assigned or asked to create/generate a PDF report, you (and any subagents) MUST check report templates/scripts (เช่น `toktickit/generate_pdf.py` หรือ guideline ใน `LAB<N>/`) first and strictly follow its build method, layout, font, and styling rules, and save the final report into the corresponding `LAB<N>/` folder.
* **Document Format (.docx Only):** When generating Word document reports, create ONLY `.docx` files. Do NOT create legacy `.doc` files.

---

## 6. Reminders & Workflow Guidelines (TokTickIT Workflow Standard - Complete Reference)

### 1. GitHub Project Board (Exact 6 Columns / Statuses):
* The board is named `TokTickIT Individual Sprints` with the following 6 columns in exact order:
  `Backlog` → `Specified` → `Started` → `PR Review` → `Fixing` → `Done`.
* All items must be created as **real Issues** (never draft cards).
* **Card progression rules:**
  * `Backlog`: Default for newly created Issues (provided but not yet read/understood).
  * `Specified`: Moved only after reading and understanding its requirements (ready to implement).
  * `Started`: Moved when the feature branch is created and active coding begins (only 1 active Issue at a time).
  * `PR Review`: Moved ONLY after the PR is opened and linked to the Issue via the Development panel (card on board must display the PR # badge).
  * `Fixing`: Moved if the reviewer requests changes or tests fail. Work is corrected on the SAME branch (never open a second PR), replied in thread, and then moved back to `PR Review`.
  * `Done`: Moved after the reviewer approves and merges the PR into staging. **Manually close the Issue on GitHub** (merging into staging does not auto-close issues).

### 2. Pull Request to Issue Linking Protocol (Mandatory Method 1):
* **Branch linking is NOT PR linking:** Linking a branch on the Issue page is optional/nice-to-have, but the graded check is strictly the **Pull Request linked to its Issue**.
* **Keywords do not auto-link on staging:** Typing `Closes #X`, `Fixes #X`, or `Resolves #X` only mentions the issue because staging is not the default branch.
* **Method 1 (Required):**
  1. Open your Pull Request on GitHub.
  2. On the right sidebar, find **"Development"**.
  3. Click the gear icon ⚙ beside it.
  4. Search for your Issue and click to link it.
* **Verification:** The sidebar under "Development" MUST say *"Successfully merging this pull request may close these issues"* (never *"None yet"*), and the Issue card on the Project board must display the PR number.

### 3. Mandatory Peer Review & Merge Agreement (CRITICAL):
* **Reviewer Merges:** The **REVIEWER (@vienggg)**, not the PR author, is the one who clicks **"Merge pull request"** on GitHub after approving.
* **Lab Agreement on Comments:** *"If your reviewer leaves a comment, reply to it. Do not just take the approval and merge without saying anything."*
* **Author Reply Obligation:** An approval with silence underneath it is not a review. The PR author MUST reply to every comment explaining what was modified or discussing the feedback.
* **Resolving Conversations:** Click **"Resolve conversation"** ONLY after replying and actually fixing the issue.
* **Handling Change Requests:** If reviewer selects "Request changes", do not open a new PR. Move the board card to `Fixing`, commit fixes to the same branch, reply in the conversation thread, and move the card back to `PR Review`.

### 4. Documentation Updates Workflow (`.md` Files):
* **Zero Direct Pushes:** Everything reaches staging through a Pull Request. Never push directly to `main` or staging branches.
* **In-progress Issue:** Update docs directly on the active feature branch so they merge with the code in the same PR.
* **Standalone / Post-merge Docs:** Create a dedicated branch named `docs/<lab>-<topic>` (e.g., `docs/lab1-report`, `docs/lab2-specs`), open a PR targeting staging, have your peer reviewer review, approve, and merge it. If no Issue exists for the doc, state so in one line in the PR description.

