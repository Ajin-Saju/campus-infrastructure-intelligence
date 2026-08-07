import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LogAuthEventParams {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async logEvent(params: LogAuthEventParams) {
    try {
      return await this.prisma.activityLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          entityType: params.entityType || 'USER_MANAGEMENT',
          entityId: params.entityId || null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          details: params.details || {},
        },
      });
    } catch (error) {
      console.error('AuditLog error:', error);
    }
  }
}
