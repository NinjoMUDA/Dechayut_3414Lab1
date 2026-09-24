# Sprint 4 REST API Specification

All endpoints require standard session authentication via JWT cookie or `Authorization: Bearer <token>`.

---

## 1. Actions Taken Endpoints

### 1.1 List Actions Taken for Ticket
* **Method:** `GET`
* **Path:** `/api/tickets/:id/actions`
* **Authorization:**
  * `REQUESTER`: Permitted ONLY if `ticket.requesterId == req.user.id`.
  * `IT_STAFF`, `ADMIN`: Permitted for all accessible tickets.
* **Success Response (`200 OK`):**
```json
{
  "ticketId": 12,
  "actions": [
    {
      "id": 1,
      "ticketId": 12,
      "actionDateTime": "2026-09-24T10:30:00.000Z",
      "description": "Inspected network cable and replaced RJ-45 connector.",
      "result": "Link light restored and ping test latency dropped to 2ms.",
      "performedBy": {
        "id": 2,
        "name": "Michael IT Staff",
        "email": "staff@toktickit.local",
        "role": "IT_STAFF"
      },
      "followUpRequired": true,
      "followUpNote": "Check again in 24 hours to ensure connection stability.",
      "attachmentNotes": "network-diag-log.txt",
      "createdAt": "2026-09-24T10:35:00.000Z",
      "updatedAt": "2026-09-24T10:35:00.000Z"
    }
  ]
}
```

### 1.2 Create Action Taken
* **Method:** `POST`
* **Path:** `/api/tickets/:id/actions`
* **Authorization:** `IT_STAFF`, `ADMIN` (Requesters return `403 Forbidden`)
* **Request Body:**
```json
{
  "actionDateTime": "2026-09-24T10:30:00.000Z",
  "description": "Reinstalled printer driver version 4.2.1.",
  "result": "Test page printed successfully.",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "test-print-scan.png"
}
```
* **Validation Rules:**
  * `description`: Required string, min 5 chars.
  * `result`: Required string, min 3 chars.
  * `performedById`: Set automatically from `req.user.id`.
  * If `followUpRequired === true`, `followUpNote` must be provided and non-empty (min 3 chars).
* **Success Response (`201 Created`):** Returns the created `ActionTaken` object with populated `performedBy`.
* **Error Responses:**
  * `400 Bad Request`: Validation failure (e.g. missing description, missing follow-up note when required).
  * `403 Forbidden`: Authenticated user is a Requester.
  * `404 Not Found`: Ticket with `:id` does not exist.

### 1.3 Update Action Taken
* **Method:** `PATCH`
* **Path:** `/api/tickets/:id/actions/:actionId`
* **Authorization:** `IT_STAFF`, `ADMIN`
* **Request Body:** Subset of updatable fields (`description`, `result`, `actionDateTime`, `followUpRequired`, `followUpNote`, `attachmentNotes`). `performedById` and `ticketId` cannot be changed.
* **Success Response (`200 OK`):** Returns the updated `ActionTaken` object.
* **Error Responses:**
  * `400 Bad Request`: Validation failure.
  * `403 Forbidden`: Requester attempt.
  * `404 Not Found`: Action Taken record not found under specified Ticket.

---

## 2. Dashboard Endpoints

### 2.1 Requester Dashboard
* **Method:** `GET`
* **Path:** `/api/dashboards/requester`
* **Authorization:** `REQUESTER` (Also accessible to IT_STAFF/ADMIN viewing their personal requester context).
* **Success Response (`200 OK`):**
```json
{
  "metrics": {
    "myOpenTickets": 3,
    "inProgress": 1,
    "resolved": 2,
    "closed": 5,
    "waitingForRequester": 1
  },
  "recentTickets": [
    {
      "id": 14,
      "ticketNumber": "TKT-2026-000014",
      "summary": "VPN connection drops every 10 minutes",
      "currentStatus": "IN_PROGRESS",
      "requestedPriority": "HIGH",
      "updatedAt": "2026-09-24T08:15:00.000Z"
    }
  ]
}
```

### 2.2 IT Staff & Admin Dashboard
* **Method:** `GET`
* **Path:** `/api/dashboards/staff`
* **Authorization:** `IT_STAFF`, `ADMIN`
* **Success Response (`200 OK`):**
```json
{
  "metrics": {
    "newTickets": 4,
    "openTickets": 8,
    "inProgress": 5,
    "waitingForRequester": 2,
    "myAssigned": 6,
    "unassigned": 3
  },
  "priorityBreakdown": {
    "URGENT": 1,
    "HIGH": 4,
    "MEDIUM": 8,
    "LOW": 2
  },
  "recentQueueTickets": [
    {
      "id": 18,
      "ticketNumber": "TKT-2026-000018",
      "summary": "Database connection timeout in production",
      "currentStatus": "NEW",
      "itPriority": "URGENT",
      "requester": { "name": "Jennifer Requester" },
      "updatedAt": "2026-09-24T11:00:00.000Z"
    }
  ],
  "adminStats": {
    "totalUsers": 12,
    "activeUsers": 11
  }
}
```

---

## 3. Ticket Status & Resolution Lifecycle Endpoint

### 3.1 Status Transition with Stale-Update Prevention
* **Method:** `PATCH`
* **Path:** `/api/tickets/:id/status`
* **Authorization:** `IT_STAFF`, `ADMIN`
* **Request Body:**
```json
{
  "newStatus": "RESOLVED",
  "resolutionSummary": "Replaced bad cable and confirmed signal stability with user.",
  "clientUpdatedAt": "2026-09-24T10:15:00.000Z"
}
```
* **State Transition Rules:**
  * `NEW` -> `OPEN`, `IN_PROGRESS`, `CANCELLED`
  * `OPEN` -> `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `CANCELLED`
  * `IN_PROGRESS` -> `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  * `WAITING_FOR_REQUESTER` -> `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
  * `RESOLVED` -> `CLOSED`, `REOPENED`
  * `REOPENED` -> `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `CANCELLED`
  * Direct transitions from `NEW` to `RESOLVED` or `CLOSED` are rejected.
* **Resolution Precondition:**
  * When `newStatus === "RESOLVED"`, `resolutionSummary` is mandatory (min 5 chars).
* **Conflict / Stale-Update Checking:**
  * If `clientUpdatedAt` does not match the database `updatedAt` (or is strictly older), responds with `409 Conflict`:
```json
{
  "error": "Conflict",
  "message": "Ticket has been modified by another user. Please reload the latest ticket details."
}
```
* **Success Response (`200 OK`):**
```json
{
  "ticketId": 12,
  "ticketNumber": "TKT-2026-000012",
  "currentStatus": "RESOLVED",
  "resolutionSummary": "Replaced bad cable and confirmed signal stability with user.",
  "updatedAt": "2026-09-24T10:45:00.000Z"
}
```
