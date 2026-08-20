# Lab 2 REST API Specification

## 1. Base URL & Authentication Context
- **Base URL:** `/api`
- **Testing Requester Identity Header:** `x-requester-id: <number>` (Simulates active Development Requester).
- **Default Content-Type:** `application/json`

---

## 2. Endpoints

### 2.1. Development Requesters
#### `GET /api/requesters`
- **Description:** Retrieve all active Development Requesters for the selector.
- **Query Parameters:** None.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com",
      "isActive": true
    },
    {
      "id": 2,
      "name": "David Lee",
      "email": "david.lee@example.com",
      "isActive": true
    }
  ]
}
```

---

### 2.2. Reference Data
#### `GET /api/categories`
- **Description:** Retrieve all active ticket categories.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Account and Access" },
    { "id": 2, "name": "Hardware" },
    { "id": 3, "name": "Software" },
    { "id": 4, "name": "Network" }
  ]
}
```

#### `GET /api/related-systems`
- **Description:** Retrieve all active related IT systems.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Email" },
    { "id": 2, "name": "Campus Wi-Fi" },
    { "id": 3, "name": "VPN" },
    { "id": 4, "name": "LEB2 App" },
    { "id": 5, "name": "Grade Submission App" },
    { "id": 6, "name": "Printer" },
    { "id": 7, "name": "Corporate Laptop" }
  ]
}
```

---

### 2.3. Tickets
#### `POST /api/tickets`
- **Description:** Create a new support ticket for the active requester.
- **Headers:** `x-requester-id: <number>` (or in body `requesterId`)
- **Request Body (JSON / Multipart):**
```json
{
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 7,
  "summary": "Laptop battery drains quickly after Windows update",
  "description": "My corporate laptop battery now only lasts for 45 minutes after the latest system patch.",
  "requestedPriority": "MEDIUM"
}
```
- **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketNumber": "TKT-2026-000001",
    "requesterId": 1,
    "categoryId": 2,
    "relatedSystemId": 7,
    "summary": "Laptop battery drains quickly after Windows update",
    "description": "My corporate laptop battery now only lasts for 45 minutes after the latest system patch.",
    "requestedPriority": "MEDIUM",
    "itPriority": null,
    "currentStatus": "NEW",
    "createdAt": "2026-08-20T08:00:00.000Z",
    "updatedAt": "2026-08-20T08:00:00.000Z"
  }
}
```
- **Validation Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation Error",
  "details": {
    "summary": "Ticket summary must be between 5 and 100 characters",
    "description": "Description must be at least 10 characters"
  }
}
```

#### `GET /api/tickets`
- **Description:** Retrieve paginated tickets owned by the active Requester with search, filter, and sorting.
- **Headers:** `x-requester-id: <number>` (Mandatory)
- **Query Parameters:**
  - `search`: String (optional, matches `ticketNumber` or `summary`)
  - `categoryId`: Integer (optional)
  - `requestedPriority`: String (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) (optional)
  - `itPriority`: String (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) (optional)
  - `status`: String (`NEW`, `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) (optional)
  - `sortBy`: String (`ticketNumber`, `createdAt`, `updatedAt`, default: `createdAt`)
  - `sortOrder`: String (`asc`, `desc`, default: `desc`)
  - `page`: Integer (default: 1)
  - `limit`: Integer (default: 10, max: 50)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticketNumber": "TKT-2026-000001",
      "summary": "Laptop battery drains quickly",
      "category": { "id": 2, "name": "Hardware" },
      "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "currentStatus": "NEW",
      "createdAt": "2026-08-20T08:00:00.000Z",
      "updatedAt": "2026-08-20T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

#### `GET /api/tickets/:id`
- **Description:** Retrieve detailed information of an owned ticket.
- **Headers:** `x-requester-id: <number>`
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketNumber": "TKT-2026-000001",
    "summary": "Laptop battery drains quickly",
    "description": "Full description details here...",
    "category": { "id": 2, "name": "Hardware" },
    "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
    "requester": { "id": 1, "name": "Jennifer Anderson", "email": "jennifer.anderson@example.com" },
    "requestedPriority": "MEDIUM",
    "itPriority": "MEDIUM",
    "currentStatus": "NEW",
    "createdAt": "2026-08-20T08:00:00.000Z",
    "updatedAt": "2026-08-20T08:00:00.000Z",
    "attachments": [
      {
        "id": 1,
        "originalFilename": "battery_report.pdf",
        "fileSize": 1048576,
        "mimeType": "application/pdf",
        "isRemoved": false,
        "createdAt": "2026-08-20T08:00:00.000Z"
      }
    ]
  }
}
```
- **Unauthorized / Isolation Error (403 Forbidden or 404 Not Found):**
```json
{
  "success": false,
  "error": "You do not have permission to view this ticket"
}
```

---

### 2.4. Attachments
#### `POST /api/tickets/:id/attachments`
- **Description:** Upload an attachment to a ticket (validates owner, $\le 5$MB, allowed MIME type, $\le 5$ active files).
- **Headers:** `x-requester-id: <number>`, `Content-Type: multipart/form-data`
- **Form Data:** `file: <binary>`
- **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "ticketId": 1,
    "originalFilename": "screenshot.png",
    "fileSize": 245120,
    "mimeType": "image/png",
    "isRemoved": false,
    "createdAt": "2026-08-20T08:05:00.000Z"
  }
}
```

#### `GET /api/attachments/:id/download`
- **Description:** Download the file binary of an active attachment.
- **Headers:** `x-requester-id: <number>`
- **Success Response (200 OK):** File binary stream with `Content-Disposition: attachment; filename="..."`.
- **Soft-Removed Error (410 Gone / 404 Not Found):**
```json
{
  "success": false,
  "error": "This attachment has been removed and cannot be downloaded."
}
```

#### `PATCH /api/attachments/:id/soft-remove`
- **Description:** Soft-remove an attachment.
- **Headers:** `x-requester-id: <number>`
- **Request Body (JSON):**
```json
{
  "removalReason": "Uploaded outdated version by mistake"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "isRemoved": true,
    "removalReason": "Uploaded outdated version by mistake",
    "removedAt": "2026-08-20T08:10:00.000Z"
  }
}
```
