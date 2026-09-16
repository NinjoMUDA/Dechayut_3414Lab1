# Lab 3 REST API Specification

## 1. Base URL & Authentication Context
- **Base URL:** `/api`
- **Authentication Mechanism:** HTTP-only cookie (`token`) and optional Bearer header (`Authorization: Bearer <jwt_token>`).
- **Default Content-Type:** `application/json`
- **Standard Error Response Shape:**
```json
{
  "success": false,
  "message": "Human-readable error explanation",
  "errors": ["Specific field error or rule violation"]
}
```

---

## 2. Authentication & Session Endpoints

### 2.1. User Login
#### `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "jennifer.anderson@example.com",
  "password": "Password123!"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "u-req-1",
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com",
      "role": "REQUESTER",
      "mustChangePassword": false
    }
  }
}
```
- **Failure Responses:**
  - `400 Bad Request`: Validation errors (missing email/password).
  - `401 Unauthorized`: Invalid email or password, or account inactive (`isActive: false`).

---

### 2.2. Current Authenticated User
#### `GET /api/auth/me`
- **Access:** Authenticated (All Roles)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "u-req-1",
    "name": "Jennifer Anderson",
    "email": "jennifer.anderson@example.com",
    "role": "REQUESTER",
    "mustChangePassword": false
  }
}
```
- **Failure Responses:**
  - `401 Unauthorized`: Missing or invalid session token.

---

### 2.3. Mandatory / Self Password Change
#### `POST /api/auth/change-password`
- **Access:** Authenticated (All Roles)
- **Request Body:**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecurePassword456!",
  "confirmPassword": "NewSecurePassword456!"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "mustChangePassword": false
  }
}
```
- **Failure Responses:**
  - `400 Bad Request`: Password mismatch, new password fails complexity (minimum 8 chars, upper, lower, number).
  - `401 Unauthorized`: Current password incorrect.

---

### 2.4. Logout
#### `POST /api/auth/logout`
- **Access:** Authenticated
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. Requester Continuation & Collaboration Endpoints

### 3.1. Create Ticket (Requester)
#### `POST /api/tickets`
- **Access:** Requester, IT Staff, Admin (Tied automatically to caller's identity)
- **Request Body:**
```json
{
  "categoryId": "cat-hardware",
  "relatedSystemId": "sys-laptop",
  "summary": "Laptop battery drains quickly after update",
  "description": "Battery lasts only 45 minutes after latest OS update.",
  "requestedPriority": "MEDIUM"
}
```
- **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "tkt-123",
    "ticketNumber": "TKT-2026-000001",
    "summary": "Laptop battery drains quickly after update",
    "currentStatus": "NEW",
    "requestedPriority": "MEDIUM",
    "itPriority": "MEDIUM",
    "requesterId": "u-req-1",
    "createdAt": "2026-09-15T12:00:00.000Z"
  }
}
```

---

### 3.2. Indicate Problem Resolved (Requester)
#### `PATCH /api/tickets/:id/resolve-indicator`
- **Access:** Authenticated Requester (Owner only), IT Staff, Admin
- **Request Body:**
```json
{
  "requesterResolved": true
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "tkt-123",
    "requesterResolved": true
  }
}
```

---

### 3.3. Public Comments (All Permitted Roles)
#### `GET /api/tickets/:id/comments`
- **Access:** Requester (Owner only), IT Staff, Admin
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "comm-1",
      "content": "Thank you for the update. Please let me know if you need any additional information.",
      "createdAt": "2026-09-15T12:30:00.000Z",
      "author": {
        "id": "u-req-1",
        "name": "Jennifer Anderson",
        "role": "REQUESTER"
      }
    }
  ]
}
```

#### `POST /api/tickets/:id/comments`
- **Access:** Requester (Owner only), IT Staff, Admin
- **Request Body:**
```json
{
  "content": "We are investigating the issue on your device. We will update you shortly."
}
```
- **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "comm-2",
    "content": "We are investigating the issue on your device. We will update you shortly.",
    "createdAt": "2026-09-15T12:35:00.000Z",
    "author": {
      "id": "u-staff-1",
      "name": "Michael Brown",
      "role": "IT_STAFF"
    }
  }
}
```

---

### 3.4. Internal Notes (IT Staff & Admin ONLY)
#### `GET /api/tickets/:id/notes`
- **Access:** IT Staff, Admin (Strictly `403 Forbidden` for Requesters)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "note-1",
      "content": "Ran battery health diagnostic. Cycle count is 950; replacement battery order needed.",
      "createdAt": "2026-09-15T13:00:00.000Z",
      "author": {
        "id": "u-staff-1",
        "name": "Michael Brown",
        "role": "IT_STAFF"
      }
    }
  ]
}
```
- **Failure Responses:**
  - `403 Forbidden`: Caller has role `REQUESTER`.

#### `POST /api/tickets/:id/notes`
- **Access:** IT Staff, Admin (Strictly `403 Forbidden` for Requesters)
- **Request Body:**
```json
{
  "content": "Contacted vendor for battery warranty coverage."
}
```
- **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "note-2",
    "content": "Contacted vendor for battery warranty coverage.",
    "createdAt": "2026-09-15T13:05:00.000Z",
    "author": {
      "id": "u-staff-1",
      "name": "Michael Brown",
      "role": "IT_STAFF"
    }
  }
}
```

---

## 4. IT Staff Operational Endpoints

### 4.1. IT Staff Ticket Queue
#### `GET /api/staff/tickets`
- **Access:** IT Staff, Admin
- **Query Parameters:**
  - `search`: String (matches `ticketNumber` or `summary`)
  - `category`: String (Category ID)
  - `status`: String (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`)
  - `requestedPriority`: String (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
  - `itPriority`: String (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
  - `ownerId`: String (Staff User ID or `"unassigned"`)
  - `sortBy`: String (`ticketNumber`, `createdAt`, `updatedAt`)
  - `sortOrder`: String (`asc`, `desc`, default `desc`)
  - `page`: Integer (default `1`)
  - `pageSize`: Integer (default `10`)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tkt-123",
      "ticketNumber": "TKT-2026-000001",
      "summary": "Laptop battery drains quickly",
      "category": { "name": "Hardware" },
      "requestedPriority": "MEDIUM",
      "itPriority": "HIGH",
      "currentStatus": "IN_PROGRESS",
      "ticketOwner": { "id": "u-staff-1", "name": "Michael Brown" },
      "requester": { "id": "u-req-1", "name": "Jennifer Anderson" },
      "requesterResolved": false,
      "createdAt": "2026-09-15T10:00:00.000Z",
      "updatedAt": "2026-09-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

---

### 4.2. Update Ticket Operational Fields (Claim, Priority, Status)
#### `PATCH /api/staff/tickets/:id`
- **Access:** IT Staff, Admin
- **Request Body:**
```json
{
  "ticketOwnerId": "u-staff-1",
  "itPriority": "HIGH",
  "currentStatus": "IN_PROGRESS",
  "resolutionSummary": "Replaced battery pack under warranty"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "tkt-123",
    "ticketNumber": "TKT-2026-000001",
    "ticketOwnerId": "u-staff-1",
    "itPriority": "HIGH",
    "currentStatus": "IN_PROGRESS",
    "updatedAt": "2026-09-15T13:30:00.000Z"
  }
}
```
- **Validation Rules:**
  - Status transition must follow valid transition matrix (BR-14).
  - Assigned owner must be an active user with role `IT_STAFF` or `ADMIN`.

---

## 5. Administrator User Management Endpoints

### 5.1. List Users
#### `GET /api/admin/users`
- **Access:** Admin ONLY
- **Query Parameters:**
  - `search`: String (matches `name` or `email`)
  - `role`: String (`REQUESTER`, `IT_STAFF`, `ADMIN`)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "u-admin-1",
      "name": "John Smith",
      "email": "john.smith@toktickit.com",
      "role": "ADMIN",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-09-01T08:00:00.000Z"
    },
    {
      "id": "u-staff-1",
      "name": "Michael Brown",
      "email": "michael.brown@toktickit.com",
      "role": "IT_STAFF",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-09-01T08:00:00.000Z"
    }
  ]
}
```

---

### 5.2. Create User
#### `POST /api/admin/users`
- **Access:** Admin ONLY
- **Request Body:**
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "IT_STAFF",
  "isActive": true,
  "initialPassword": "Password123!"
}
```
- **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "u-staff-new",
    "name": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "isActive": true,
    "mustChangePassword": true,
    "createdAt": "2026-09-15T14:00:00.000Z"
  }
}
```
- **Failure Responses:**
  - `400 Bad Request`: Email already exists (BR-08) or validation failure.

---

### 5.3. Update User
#### `PATCH /api/admin/users/:id`
- **Access:** Admin ONLY
- **Request Body:**
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "IT_STAFF",
  "isActive": false
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "u-staff-new",
    "name": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "isActive": false
  }
}
```
- **Safety Rule Failures (400 Bad Request):**
  - Attempting to deactivate caller's own account (BR-10): *"You cannot deactivate your own account"*.
  - Attempting to deactivate or demote the system's last active Administrator (BR-11): *"Cannot deactivate or demote the last active Administrator"*.

---

### 5.4. Reset User Password
#### `POST /api/admin/users/:id/reset-password`
- **Access:** Admin ONLY
- **Request Body:**
```json
{
  "initialPassword": "Password123!"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Temporary password assigned; user must change on next login",
  "data": {
    "mustChangePassword": true
  }
}
```
