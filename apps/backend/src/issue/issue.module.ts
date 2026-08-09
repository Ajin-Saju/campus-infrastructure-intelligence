import { Module } from '@nestjs/common';
import { IssueController } from './issue.controller';
import { IssueService } from './issue.service';
import { IssueRepository } from './issue.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AiModule } from '../ai/ai.module';

import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, AuditLogModule, AiModule, NotificationModule],
  controllers: [IssueController],
  providers: [IssueService, IssueRepository],
  exports: [IssueService],
})
export class IssueModule {}
