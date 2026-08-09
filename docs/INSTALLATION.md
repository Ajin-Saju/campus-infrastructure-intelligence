# Local Installation & Setup Guide

This guide walks through setting up the **Campus Infrastructure Intelligence System** from zero on local development environments (Windows, macOS, Linux).

---

## 1. Prerequisites

Ensure you have the following installed on your host system:

* **Node.js**: `v20.x` or `v22.x` (LTS version recommended)
* **npm**: `v10.x` or higher
* **PostgreSQL**: `v15.x` or `v16.x` (Local installation or Docker container)
* **Docker Desktop** (Optional, for running full environment via Docker Compose)
* **Git**: `v2.x`

---

## 2. Step-by-Step Local Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/Ajin-Saju/campus-infrastructure-intelligence.git
cd campus-infrastructure-intelligence
```

### Step 2: Install Monorepo Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to create local `.env` files:

```bash
# Root Monorepo
cp .env.example .env

# Backend App
cp apps/backend/.env.example apps/backend/.env

# Frontend App
cp apps/frontend/.env.example apps/frontend/.env
```

Ensure `DATABASE_URL` in `apps/backend/.env` points to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campus_infra_db?schema=public"
```

### Step 4: Run PostgreSQL Database
Option A: Using Docker Compose (Recommended)
```bash
docker-compose up -d postgres
```

Option B: Native local PostgreSQL
Create a database named `campus_infra_db` in pgAdmin or psql:
```sql
CREATE DATABASE campus_infra_db;
```

### Step 5: Generate Prisma Client & Run Database Migrations
```bash
# Generate Prisma Client
npm run prisma:generate --workspace=@campus-infra/database

# Run Database Migrations
npm run prisma:migrate --workspace=@campus-infra/database

# Seed Initial Roles & Sample Data
npm run prisma:seed --workspace=@campus-infra/database
```

### Step 6: Start Applications

**Start both Frontend and Backend concurrently:**
```bash
npm run dev
```

Alternatively, start services individually:
```bash
# Backend (NestJS API on http://localhost:3001)
npm run dev --workspace=apps/backend

# Frontend (Next.js App on http://localhost:3000)
npm run dev --workspace=apps/frontend
```

---

## 3. Verifying Installation

1. Open your browser and navigate to `http://localhost:3000`.
2. Check backend health check at `http://localhost:3001/api/v1/health`. Expected response:
```json
{
  "status": "ok",
  "system": "Campus Infrastructure Intelligence API",
  "version": "1.0.0",
  "timestamp": "2026-08-09T11:00:00.000Z"
}
```
3. Log in with sample credentials or click Quick Demo Pills on `/login`:
   * **Admin**: `admin@campus.edu` / `password123`
   * **Technician**: `tech@campus.edu` / `password123`
   * **Student**: `student@campus.edu` / `password123`

---

## 4. Troubleshooting

* **Prisma Engine / OpenSSL Issues**: Run `npm run prisma:generate` after changing environment settings.
* **Database Connection Timeout**: Ensure PostgreSQL service is active on port `5432` and credentials in `.env` match.
* **Port Conflict**: Modify `PORT` in `apps/backend/.env` or `PORT_FRONTEND` in `apps/frontend/.env`.
