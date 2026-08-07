# Architecture Overview - Campus Infrastructure Intelligence

## 1. System High Level Overview

**Campus Infrastructure Intelligence** is structured as an enterprise monorepo using Turborepo. It cleanly separates concerns across frontend applications, backend services, shared packages, and database layers.

```
/
├── apps/
│   ├── frontend      # Next.js 15 App Router, React 19, Tailwind CSS, shadcn/ui
│   └── backend       # NestJS enterprise backend application
├── packages/
│   ├── ui            # Shared UI components and utility helpers (cn)
│   ├── shared        # Shared TypeScript interfaces, types, and constants
│   └── config        # Shared build & lint configurations (TSConfig, ESLint, Prettier)
├── database/         # Prisma ORM schema & PostgreSQL configuration
├── docker/           # Production Dockerfiles and Docker Compose files
├── docs/             # Architecture and development guides
└── .github/          # GitHub Actions CI workflows
```

## 2. Technology Stack Rationale

- **Next.js 15 & React 19**: Enterprise-grade Server Side Rendering (SSR) & App Router architecture for performant campus web portals.
- **NestJS**: Modular TypeScript framework providing clear dependency injection, enterprise structure, and clean domain boundaries.
- **Prisma & PostgreSQL**: Type-safe ORM paired with PostgreSQL for reliable relational database management.
- **Turborepo**: High-performance monorepo build system with task caching.
- **Tailwind CSS & shadcn/ui**: Accessible, customizable component primitives with zero runtime footprint.
