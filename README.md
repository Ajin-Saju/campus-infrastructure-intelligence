# Campus Infrastructure Intelligence System

[![CI Pipeline](https://github.com/Ajin-Saju/campus-infrastructure-intelligence/actions/workflows/ci.yml/badge.svg)](https://github.com/Ajin-Saju/campus-infrastructure-intelligence/actions/workflows/ci.yml)
[![Docker Build](https://github.com/Ajin-Saju/campus-infrastructure-intelligence/actions/workflows/docker.yml/badge.svg)](https://github.com/Ajin-Saju/campus-infrastructure-intelligence/actions/workflows/docker.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, AI-powered campus infrastructure, building hierarchy, asset lifecycle, QR code, maintenance workflow, and issue management monorepo application.

---

## 🏗️ Target Architecture & Technology Stack

```text
                         GitHub
                            │
              ┌─────────────┴─────────────┐
              │                           │
          Frontend                    Backend
          Next.js                     NestJS
              │                           │
           Vercel                     Render
                                          │
                               ┌──────────┴──────────┐
                               │                     │
                            Docker              PostgreSQL
                               │                     │
                            Render               Supabase
                               │
                         Socket.IO
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                   AI        Email      Cloudinary
```

* **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts.
* **Backend**: NestJS 10, Express, Socket.IO (WebSockets), Passport JWT, Bcrypt.
* **Database & ORM**: PostgreSQL, Prisma ORM.
* **AI Engine**: Google Gemini API & OpenAI API (Server-side issue categorization & predictive analytics).
* **Storage & Email**: Cloudinary Media CDN, SMTP Email Dispatcher.
* **DevOps & Containerization**: Docker, Docker Compose, Nginx, GitHub Actions CI/CD.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**: Custom permissions and navigation for `ADMIN`, `TECHNICIAN`, `STUDENT`, `FACULTY`, and `VENDOR`.
2. **Building Hierarchy**: Full management of Campus Buildings, Floors, and Rooms.
3. **Asset Management**: Lifecycle tracking, status updates, image uploads, and maintenance history.
4. **QR Code Hub**: Instant generation, download, and mobile scanning for asset details and issue submission.
5. **AI Issue Categorization & Insights**: Live text analysis for issue reporting and predictive monthly analytics for maintenance managers.
6. **Maintenance Workflows**: End-to-end task assignment, status updates, technician assignment, and vendor management.
7. **Lost & Found Hub**: Report, match, and claim campus lost and found items.
8. **Real-time Notifications**: Socket.IO WebSockets push notifications for assignments and status updates.

---

## 📁 Repository Structure

```text
campus-infrastructure-intelligence/
├── apps/
│   ├── frontend/         # Next.js 15 client web application
│   └── backend/          # NestJS REST & WebSocket server
├── packages/
│   ├── shared/           # Shared TypeScript interfaces & types
│   └── config/           # Monorepo configuration packages
├── database/
│   └── prisma/           # Prisma Schema & Database Migrations
├── docker/               # Dockerfiles & Compose environments
├── nginx/                # Reverse proxy Nginx configurations
├── docs/                 # System documentation & guides
│   ├── INSTALLATION.md   # Step-by-step local setup guide
│   ├── DEPLOYMENT.md     # Production deployment instructions
│   ├── API.md            # Complete API endpoints reference
│   ├── DATABASE.md       # PostgreSQL schema & Prisma guide
│   ├── ARCHITECTURE.md   # System architecture & flows
│   └── ER-DIAGRAM.md     # Database Mermaid ER Diagram
├── .github/
│   └── workflows/        # GitHub Actions CI & Docker workflows
├── .env.example          # Environment variables template
├── Dockerfile            # Root production backend Dockerfile
├── docker-compose.yml    # Development Docker environment
└── docker-compose.prod.yml # Production Docker orchestration
```

---

## ⚡ Quick Start (Local Setup)

1. **Clone repository**:
   ```bash
   git clone https://github.com/Ajin-Saju/campus-infrastructure-intelligence.git
   cd campus-infrastructure-intelligence
   ```

2. **Install monorepo dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env
   ```

4. **Run PostgreSQL & Prisma Setup**:
   ```bash
   # Start local PostgreSQL via Docker Compose
   docker-compose up -d postgres

   # Generate Prisma Client & run migrations
   npm run prisma:generate --workspace=@campus-infra/database
   npm run prisma:migrate --workspace=@campus-infra/database
   npm run prisma:seed --workspace=@campus-infra/database
   ```

5. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   * **Frontend**: `http://localhost:3000`
   * **Backend**: `http://localhost:3001`
   * **Health Endpoint**: `http://localhost:3001/api/v1/health`

---

## 📖 Documentation Quick Links

* 🛠️ [Installation Guide](docs/INSTALLATION.md)
* 🚀 [Production Deployment Guide](docs/DEPLOYMENT.md)
* 🔌 [API Documentation](docs/API.md)
* 🗄️ [Database & Prisma Reference](docs/DATABASE.md)
* 📐 [Architecture & Data Flow](docs/ARCHITECTURE.md)
* 📊 [Mermaid ER Diagram](docs/ER-DIAGRAM.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
