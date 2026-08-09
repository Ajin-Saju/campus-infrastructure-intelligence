# System Architecture & Flow Documentation

This document explains the technical architecture, data flows, and infrastructure components of the **Campus Infrastructure Intelligence System**.

---

## 1. High-Level Target Deployment Architecture

```text
                         GitHub
                            │
              ┌─────────────┴─────────────┐
              │                           │
          Next.js                      NestJS
              │                           │
           Vercel                     Render
                                          │
                               ┌──────────┴──────────┐
                               │                     │
                            Docker               Supabase
                               │                  PostgreSQL
                               │
                         Socket.IO
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                   AI        Email      Cloudinary
```

---

## 2. Core System Flows

### A. Authentication & Authorization Flow
1. User submits credentials (`email`, `password`) via Next.js client (`/login`).
2. Request hits NestJS backend (`POST /api/v1/auth/login`).
3. Backend validates credentials against hashed passwords using `bcrypt`.
4. Backend issues signed JWT Access Token and Refresh Token.
5. Client stores tokens securely and attaches `Authorization: Bearer <token>` to subsequent REST & WebSocket connections.
6. Role-Based Access Control (RBAC) guards inspect token claims (`ADMIN`, `TECHNICIAN`, `STUDENT`, `FACULTY`, `VENDOR`).

### B. Issue Reporting & AI Auto-Categorization Flow
1. User reports an issue manually or via QR code scan (`/issues/report`).
2. Next.js triggers live text analysis via NestJS (`POST /api/v1/ai/analyze-issue`).
3. NestJS queries server-side Gemini/OpenAI API using private `GEMINI_API_KEY`.
4. AI returns suggested priority, issue category, and confidence score.
5. User submits report -> stored in Supabase PostgreSQL -> triggers Socket.IO event to Admin/Technician dashboards.

### C. Real-Time Notification & Socket.IO Flow
1. Next.js frontend connects to Socket.IO gateway on Render backend (`NEXT_PUBLIC_WS_URL`).
2. When an issue status changes or a task is assigned, NestJS emits a real-time event.
3. Socket.IO gateway dispatches payload to target user room.
4. Client UI updates notification badge and renders toast notification in real time.

### D. Media & Image Upload Flow
1. User attaches an image (e.g. damaged asset or issue picture).
2. Image payload is sent securely to NestJS backend or Cloudinary upload service.
3. Cloudinary processes and stores media, returning a secure CDN URL.
4. CDN URL is saved in database record (`Asset.imageUrl` or `IssueReport.mediaUrls`).

---

## 3. Security Architecture Highlights

* **No Frontend Secrets**: AI API keys, JWT secrets, database connection strings, and SMTP credentials exist purely on NestJS server-side environment.
* **CORS Protection**: Restricted to authorized production domain (`FRONTEND_URL`).
* **Input Validation**: Global NestJS `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
* **Database Isolation**: PostgreSQL connection string uses SSL and parameter queries managed by Prisma ORM against SQL injection.
