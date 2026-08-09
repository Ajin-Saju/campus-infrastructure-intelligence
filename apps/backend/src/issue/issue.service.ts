import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IssueRepository } from './issue.repository';
import { CreateIssueDto } from './dto/create-issue.dto';
import { QueryIssueDto } from './dto/query-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AiService } from '../ai/ai.service';

import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class IssueService {
  constructor(
    private readonly repository: IssueRepository,
    private readonly auditLogService: AuditLogService,
    private readonly aiService: AiService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  async getCategories() {
    let categories = await this.repository.findAllCategories();
    if (categories.length === 0) {
      // Seed default categories if none exist
      const defaultCategories = [
        { name: 'General Maintenance', code: 'GEN_MAINT', description: 'General infrastructure issues' },
        { name: 'Electrical', code: 'ELECTRICAL', description: 'Electrical fixtures, wiring, lights, power' },
        { name: 'Plumbing', code: 'PLUMBING', description: 'Water supply, drainage, leaks, pipes' },
        { name: 'HVAC & AC', code: 'HVAC', description: 'Air conditioning, heating, ventilation' },
        { name: 'Furniture & Fixtures', code: 'FURNITURE', description: 'Desks, chairs, whiteboards, doors' },
        { name: 'IT & AV Equipment', code: 'IT_AV', description: 'Projectors, displays, network ports' },
      ];

      for (const cat of defaultCategories) {
        await this.repository.createDefaultCategory(cat.name, cat.code, cat.description);
      }

      categories = await this.repository.findAllCategories();
    }
    return categories;
  }

  async createIssue(dto: CreateIssueDto, reportedById: string) {
    let categoryId = dto.categoryId;

    if (!categoryId) {
      const defaultCat = await this.repository.findFirstCategory();
      if (defaultCat) {
        categoryId = defaultCat.id;
      } else {
        const categories = await this.getCategories();
        categoryId = categories[0].id;
      }
    }

    const ticketNumber = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;

    const issue = await this.repository.createIssue(ticketNumber, reportedById, dto, categoryId);

    // Trigger AI analysis and database prediction storage
    try {
      await this.aiService.analyzeAndSaveIssue(issue.id);
    } catch (err) {
      console.error('Automated AI analysis error:', err);
    }

    await this.auditLogService.logEvent({
      userId: reportedById,
      action: 'ISSUE_REPORT_CREATED',
      entityType: 'IssueReport',
      entityId: issue.id,
      details: { ticketNumber: issue.ticketNumber, title: issue.title },
    });

    return issue;
  }

  async getIssues(queryDto: QueryIssueDto, userId: string, userRole: string) {
    return this.repository.findIssuesByRole(queryDto, userId, userRole);
  }

  async getMyReports(queryDto: QueryIssueDto, reportedById: string) {
    return this.repository.findIssues({
      ...queryDto,
      reportedById,
    });
  }

  async getIssueById(id: string, userId: string, userRole: string) {
    // First check the issue exists at all
    const issue = await this.repository.findIssueById(id);
    if (!issue) {
      throw new NotFoundException(`Issue report with ID '${id}' not found`);
    }

    // Then verify the requesting user is authorized to access it
    const hasAccess = await this.repository.checkIssueAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to access this issue report');
    }

    return issue;
  }

  /**
   * Internal helper: fetch an issue by ID without ownership checks.
   * Only use from endpoints that are already role-guarded (e.g. ADMIN/TECHNICIAN).
   */
  private async getIssueByIdInternal(id: string) {
    const issue = await this.repository.findIssueById(id);
    if (!issue) {
      throw new NotFoundException(`Issue report with ID '${id}' not found`);
    }
    return issue;
  }

  async updateIssueStatus(id: string, dto: UpdateIssueStatusDto, performingUserId: string) {
    const issue = await this.getIssueByIdInternal(id);
    const updated = await this.repository.updateIssueStatus(id, dto.status);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ISSUE_STATUS_UPDATED',
      entityType: 'IssueReport',
      entityId: id,
      details: { status: dto.status },
    });

    if (issue.reportedById) {
      await this.notificationService.sendNotification(
        issue.reportedById,
        `Issue Status Updated: ${issue.ticketNumber}`,
        `Your issue report status changed to ${dto.status}.`,
        NotificationType.STATUS_CHANGED,
        `/issues/${id}`,
      );
    }

    return updated;
  }

  async updateIssuePriority(id: string, newPriority: any, performingUserId: string) {
    const issue = await this.getIssueByIdInternal(id);
    const updated = await this.prisma.issueReport.update({
      where: { id },
      data: { priority: newPriority },
    });

    if (issue.reportedById) {
      await this.notificationService.sendNotification(
        issue.reportedById,
        `Priority Changed: ${issue.ticketNumber}`,
        `Issue report "${issue.title}" priority updated to ${newPriority}.`,
        NotificationType.PRIORITY_CHANGED,
        `/issues/${id}`,
      );
    }

    return updated;
  }
}
