import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'database/prisma/schema.prisma',
  migrations: {
    path: 'database/prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/campus_ai',
  },
});
