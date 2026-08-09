# Database Schema & Structure Documentation

The **Campus Infrastructure Intelligence** database is managed using **Prisma ORM** with **PostgreSQL**.

---

## 1. Primary Entity Tables

| Table Name | Description | Primary Key | Key Foreign Keys |
|---|---|---|---|
| `User` | User accounts, roles, profiles | `id` (CUID) | `roleId` -> `Role.id` |
| `Role` | System access roles (`ADMIN`, `TECHNICIAN`, `STUDENT`, `FACULTY`, `VENDOR`) | `id` (CUID) | - |
| `Building` | Campus buildings | `id` (CUID) | - |
| `Floor` | Building floors | `id` (CUID) | `buildingId` -> `Building.id` |
| `Room` | Building rooms | `id` (CUID) | `floorId` -> `Floor.id` |
| `AssetCategory` | Asset classification categories | `id` (CUID) | - |
| `Asset` | Physical assets, equipment, lifecycles | `id` (CUID) | `categoryId`, `buildingId`, `roomId` |
| `AssetMaintenanceLog` | Historical maintenance actions on assets | `id` (CUID) | `assetId` -> `Asset.id` |
| `IssueCategory` | Maintenance issue categories | `id` (CUID) | - |
| `IssueReport` | Issue reports filed by campus users | `id` (CUID) | `reporterId`, `buildingId`, `roomId`, `assetId` |
| `MaintenanceTask` | Workflow tasks for issue resolution | `id` (CUID) | `issueId`, `assignedTechnicianId` |
| `Vendor` | External service vendors | `id` (CUID) | `userId` -> `User.id` |
| `VendorAssignment` | Vendor task assignments & quotations | `id` (CUID) | `taskId`, `vendorId` |
| `LostFoundItem` | Lost & found item listings | `id` (CUID) | `reportedById`, `claimedById`, `buildingId` |
| `LostFoundMatch` | AI or user match claims for lost/found items | `id` (CUID) | `lostItemId`, `foundItemId` |
| `AIPrediction` | Stored AI failure predictions & risk scores | `id` (CUID) | `assetId` -> `Asset.id` |
| `Notification` | In-app user notifications | `id` (CUID) | `userId` -> `User.id` |

---

## 2. Key Enums

* **AssetStatus**: `OPERATIONAL`, `NEEDS_REPAIR`, `IN_MAINTENANCE`, `DECOMMISSIONED`, `SCRAPPED`
* **IssuePriority**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
* **IssueStatus**: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`
* **TaskStatus**: `PENDING`, `AI_CATEGORIZED`, `ADMIN_REVIEW`, `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `WAITING_FOR_PARTS`, `COMPLETED`, `CLOSED`
* **LostFoundType**: `LOST`, `FOUND`
* **LostFoundStatus**: `ACTIVE`, `MATCHED`, `CLAIMED`, `RESOLVED`

---

## 3. Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate --workspace=@campus-infra/database

# Create & Apply Migration locally
npm run prisma:migrate --workspace=@campus-infra/database

# Push schema changes directly (Development)
npx prisma db push --schema=database/prisma/schema.prisma

# Seed Initial System Data
npm run prisma:seed --workspace=@campus-infra/database
```
