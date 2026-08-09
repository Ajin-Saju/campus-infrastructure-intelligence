# Production Dockerfile for NestJS Backend Deployment (Render / Docker container)
FROM node:22-alpine AS base

# Install OpenSSL for Prisma Engine compatibility
RUN apk add --no-cache openssl

FROM base AS deps
WORKDIR /app

# Copy root workspace and package manifests
COPY package*.json turbo.json ./
COPY database/package*.json ./database/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/config/package*.json ./packages/config/
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies cleanly
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate --workspace=@campus-infra/database

# Build Backend Application
RUN npm run build --workspace=apps/backend

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built application and node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder /app/database ./database

USER nestjs

# Default port
EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/backend/dist/main.js"]
