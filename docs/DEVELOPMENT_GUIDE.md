# Development Guide - Campus Infrastructure Intelligence

## Prerequisites

- **Node.js**: >= 18.0.0 (v22 recommended)
- **NPM**: >= 9.0.0
- **Docker & Docker Compose**: Optional for containerized services, required for local PostgreSQL

## Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy the example environment configuration:

   ```bash
   cp .env.example .env
   cp apps/frontend/.env.example apps/frontend/.env.local
   cp apps/backend/.env.example apps/backend/.env
   cp database/.env.example database/.env
   ```

3. **Start Local Database**

   ```bash
   docker compose -f docker/docker-compose.dev.yml up -d
   ```

4. **Run Development Mode**

   ```bash
   npm run dev
   ```

5. **Lint & Code Format**
   ```bash
   npm run lint
   npm run format
   ```
