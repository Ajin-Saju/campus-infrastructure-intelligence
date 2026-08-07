# Campus Infrastructure Intelligence

AI-powered campus infrastructure maintenance management system with QR-based issue reporting, analytics, and intelligent maintenance workflow.

---

## Technical Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS, TypeScript, `@nestjs/config`
- **Database Layer**: PostgreSQL, Prisma ORM
- **Monorepo Engine**: Turborepo, npm workspaces
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

---

## Installation & Setup Steps

### 1. Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: `v18.0.0` or higher (v22 recommended)
- **NPM**: `v9.0.0` or higher
- **Docker**: (Optional, for database and container deployment)

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/Ajin-Saju/campus-infrastructure-intelligence.git
cd campus-infrastructure-intelligence
npm install
```

### 3. Setup Environment Variables

Copy the environment template files for all workspaces:

```bash
# Root environment file
cp .env.example .env

# App environment files
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
cp database/.env.example database/.env
```

### 4. Database Setup (Optional Local PostgreSQL)

Start PostgreSQL using Docker Compose:

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

### 5. Running the Monorepo

Start all applications in development mode using Turborepo:

```bash
npm run dev
```

- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:3001`

---

## Monorepo Folder Structure

```
campus-infrastructure-intelligence/
├── apps/
│   ├── frontend/         # Next.js 15 App Router, React 19, Tailwind CSS, shadcn/ui
│   └── backend/          # NestJS API application foundation
├── packages/
│   ├── ui/               # Shared React component primitives & Tailwind utilities (cn)
│   ├── shared/           # Shared TypeScript types, constants, and utility helpers
│   └── config/           # Centralized TSConfig, ESLint, and Prettier configurations
├── database/             # Prisma ORM schema definition & PostgreSQL migrations workspace
├── docker/               # Production Dockerfiles and Docker Compose orchestrations
├── docs/                 # Enterprise architecture & developer setup documentation
└── .github/
    └── workflows/        # GitHub Actions CI pipeline workflows
```

---

## Available Commands

- `npm run dev`: Start all workspaces concurrently in development mode.
- `npm run build`: Build all workspaces for production.
- `npm run lint`: Run ESLint across all workspaces.
- `npm run check-types`: Execute TypeScript type-checking across all workspaces.
- `npm run format`: Format all codebase files with Prettier.
- `npm run format:check`: Verify formatting compliance with Prettier.
