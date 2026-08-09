import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connection initialized successfully via Prisma');
    } catch (err: any) {
      console.error('Prisma DB connection attempt warning on startup:', err?.message || err);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (_err) {
      // Ignore disconnect error on shutdown
    }
  }
}
