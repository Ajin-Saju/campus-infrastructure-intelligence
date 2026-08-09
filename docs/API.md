# API Documentation

The **Campus Infrastructure Intelligence API** provides endpoints for authentication, asset tracking, building hierarchy, issue reporting, maintenance workflows, AI insights, vendors, and notification management.

**Base URL**: `http://localhost:3001/api/v1` (Development) / `https://your-backend.onrender.com/api/v1` (Production)

---

## 1. System Health & Status

### `GET /health`
* **Auth**: Public
* **Response**:
```json
{
  "status": "ok",
  "system": "Campus Infrastructure Intelligence API",
  "version": "1.0.0",
  "timestamp": "2026-08-09T11:00:00.000Z"
}
```

---

## 2. Authentication (`/auth`)

### `POST /auth/login`
* **Auth**: Public
* **Body**:
```json
{
  "email": "user@campus.edu",
  "password": "password123"
}
```
* **Response**: `200 OK`
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "usr_123",
    "email": "user@campus.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN"
  }
}
```

### `POST /auth/register`
* **Auth**: Public
* **Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@campus.edu",
  "password": "password123",
  "roleName": "STUDENT"
}
```

### `GET /auth/me`
* **Auth**: Bearer Token
* **Response**: Returns authenticated user profile.

---

## 3. Building Hierarchy (`/buildings`)

### `GET /buildings`
* **Auth**: Bearer Token
* **Role**: All authenticated roles
* **Response**: Returns list of campus buildings with nested floors and rooms.

### `POST /buildings`
* **Auth**: Bearer Token
* **Role**: `ADMIN`
* **Body**:
```json
{
  "name": "Science Block A",
  "code": "SBA",
  "address": "North Campus Sector 2"
}
```

---

## 4. Asset Management (`/assets`)

### `GET /assets`
* **Auth**: Bearer Token
* **Role**: `ADMIN`, `TECHNICIAN`
* **Query Params**: `buildingId`, `status`, `search`
* **Response**: Returns array of asset records.

### `POST /assets`
* **Auth**: Bearer Token
* **Role**: `ADMIN`, `TECHNICIAN`
* **Body**:
```json
{
  "name": "HVAC Unit #4",
  "assetTag": "AST-HVAC-004",
  "categoryId": "cat_123",
  "buildingId": "bld_123",
  "roomId": "rm_101",
  "purchaseCost": 12500,
  "status": "OPERATIONAL"
}
```

---

## 5. Issue Reporting (`/issues`)

### `POST /issues`
* **Auth**: Bearer Token
* **Role**: All Roles
* **Body**:
```json
{
  "title": "Air Conditioner Leakage",
  "description": "AC unit in Room 101 is leaking water near whiteboard",
  "priority": "HIGH",
  "buildingId": "bld_123",
  "roomId": "rm_101"
}
```

### `GET /issues/my`
* **Auth**: Bearer Token
* **Role**: All Roles
* **Response**: Returns issues reported by current logged-in user.

---

## 6. Maintenance Workflows (`/maintenance`)

### `GET /maintenance/tasks`
* **Auth**: Bearer Token
* **Role**: `ADMIN`, `TECHNICIAN`
* **Query Params**: `status`, `assignedToMe`
* **Response**: Returns maintenance tasks and workflow statuses.

### `PATCH /maintenance/tasks/:id/status`
* **Auth**: Bearer Token
* **Role**: `ADMIN`, `TECHNICIAN`
* **Body**:
```json
{
  "status": "IN_PROGRESS",
  "notes": "Replacement filter installed"
}
```

---

## 7. AI Services (`/ai`)

### `POST /ai/analyze-issue`
* **Auth**: Bearer Token
* **Role**: All Roles
* **Body**:
```json
{
  "text": "Water leakage from ceiling in Room 204"
}
```
* **Response**:
```json
{
  "suggestedTitle": "Ceiling Water Leakage",
  "suggestedPriority": "HIGH",
  "suggestedCategory": "PLUMBING",
  "confidenceScore": 0.94
}
```

### `GET /ai/monthly-insights`
* **Auth**: Bearer Token
* **Role**: `ADMIN`
* **Response**: Returns predictive maintenance metrics, risk analysis, and failure frequency.

---

## 8. QR Code Hub (`/qr`)

### `GET /qr/resolve?code=...`
* **Auth**: Bearer Token
* **Role**: All Roles
* **Response**: Resolves asset/building/room QR code payload for instant maintenance or issue reporting.

---

## 9. Real-time Notifications (`/notifications`)

### `GET /notifications`
* **Auth**: Bearer Token
* **Response**: List of user notifications.

### `PATCH /notifications/:id/read`
* **Auth**: Bearer Token
* **Response**: Marks notification as read.
