# Sprint 4 Test Plan & Traceability Matrix

## 1. Traceability Matrix

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-01 | API | AC-01, FR-01 | Create valid Action Taken as IT Staff | Record created with authenticated user as `performedById` | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-02 | API | AC-02, FR-04 | Requester attempts to create Action Taken | 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-03 | API | AC-03, FR-02 | Create Action Taken with followUpRequired=true and empty followUpNote | 400 Bad Request validation error | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-04 | API | AC-04, FR-04 | Requester retrieves Actions Taken for owned ticket | 200 OK with list of actions | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-05 | API | AC-05, FR-04 | Requester attempts to read Actions Taken for another user's ticket | 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-06 | API | AC-06, FR-08 | Requester dashboard metrics count calculation | Counts scoped strictly to requester's own tickets | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| API-07 | API | AC-07, FR-09 | IT Staff dashboard unassigned and assigned-to-me counts | Accurate counts matching database query | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| API-08 | API | AC-08, FR-05 | Invalid status transition (NEW -> RESOLVED) | 400 Bad Request with illegal transition message | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| API-09 | API | AC-09, FR-06 | Transition to RESOLVED without resolutionSummary | 400 Bad Request requiring summary | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| API-10 | API | AC-10, FR-07 | Status transition with stale clientUpdatedAt | 409 Conflict | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| API-11 | API | AC-11, FR-11 | Assign ticket to inactive user | 400 Bad Request cannot assign to inactive user | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| API-12 | API | AC-12, FR-08, FR-09 | Retrieve dashboards when database has zero tickets | 200 OK with all zero metric counts and empty arrays | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| API-13 | API | BR-07, FR-05 | Reopen flow from RESOLVED to REOPENED and subsequent transition | 200 OK status updated to REOPENED | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| UI-01 | UI | AC-01, FR-01 | IT Staff views Actions Taken and opens Record Action modal | Form rendered with auto-populated performer | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| UI-02 | UI | AC-03, FR-02 | Inline validation when follow-up checkbox is toggled without note | Error message displayed under note field | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| UI-03 | UI | AC-04, FR-04 | Requester views Actions Taken list | Actions rendered in read-only mode without "+ Record" button | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| UI-04 | UI | AC-06, FR-08 | Requester Dashboard renders metrics and drill-down links | Metric cards display correct values and hrefs | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| UI-05 | UI | AC-07, FR-09 | IT Staff Dashboard renders metrics, priority cards, and quick actions | Metric cards and recent tickets rendered | `client/src/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| UI-06 | UI | AC-08, AC-09 | Ticket Workflow control permits only valid transitions | Dropdown options match allowed matrix | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| UI-07 | UI | BR-07, AC-08 | Reopen action button visibility and transition on RESOLVED ticket | Status changes to REOPENED with cyan badge | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| E2E-01 | E2E | AC-01, AC-04 | Complete Actions Taken creation, view, and follow-up flow | Action saved, appears in ticket feed with follow-up badge | `client/src/tests/lab-04/actions-taken-flow.spec.ts` | Planned |
| E2E-02 | E2E | AC-08, AC-09 | Complete Ticket Resolution lifecycle with resolution gate | Status progresses from NEW -> IN_PROGRESS -> RESOLVED with summary | `client/src/tests/lab-04/ticket-resolution.spec.ts` | Planned |
| E2E-03 | E2E | AC-06, AC-07 | End-to-end Dashboard navigation and drill-down verification | Clicking metric card navigates to correctly filtered queue | `client/src/tests/lab-04/dashboards.spec.ts` | Planned |
