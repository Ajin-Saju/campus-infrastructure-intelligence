import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, IssuePriority, TaskType, Prisma } from '@prisma/client';

export interface QueryMaintenanceTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: IssuePriority;
  assignedToId?: string;
  isAssigned?: boolean;
  issueReportId?: string;
  assetId?: string;
  search?: string;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  issueReportId?: string;
  assetId?: string;
  assignedToId?: string;
  type?: TaskType;
  priority?: IssuePriority;
  scheduledStartDate?: Date;
  scheduledEndDate?: Date;
  estimatedCost?: number;
}

@Injectable()
export class MaintenanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private generateTaskNumber(): string {
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString();
    return `TASK-${randomHex}`;
  }

  async findPaginatedTasks(params: QueryMaintenanceTasksParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenanceTaskWhereInput = {
      deletedAt: null,
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
      ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
      ...(params.isAssigned !== undefined
        ? params.isAssigned
          ? { assignedToId: { not: null } }
          : { assignedToId: null }
        : {}),
      ...(params.issueReportId ? { issueReportId: params.issueReportId } : {}),
      ...(params.assetId ? { assetId: params.assetId } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { taskNumber: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.maintenanceTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          asset: {
            select: { id: true, name: true, assetTag: true },
          },
          issueReport: {
            select: { id: true, ticketNumber: true, title: true, priority: true },
          },
          _count: {
            select: { updates: true, repairHistories: true, attachments: true },
          },
        },
      }),
      this.prisma.maintenanceTask.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findTaskById(id: string) {
    return this.prisma.maintenanceTask.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        asset: {
          include: {
            category: true,
            building: true,
            room: true,
          },
        },
        issueReport: {
          include: {
            category: true,
            reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            comments: {
              where: { deletedAt: null },
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        updates: {
          where: { deletedAt: null },
          include: {
            updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        repairHistories: {
          where: { deletedAt: null },
          include: {
            performedBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { repairDate: 'desc' },
        },
        attachments: {
          where: { deletedAt: null },
          include: {
            uploadedBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async createTask(params: CreateTaskParams) {
    const taskNumber = this.generateTaskNumber();
    return this.prisma.maintenanceTask.create({
      data: {
        taskNumber,
        title: params.title,
        description: params.description || null,
        issueReportId: params.issueReportId || null,
        assetId: params.assetId || null,
        assignedToId: params.assignedToId || null,
        type: params.type || TaskType.CORRECTIVE,
        status: TaskStatus.PENDING,
        priority: params.priority || IssuePriority.MEDIUM,
        scheduledStartDate: params.scheduledStartDate || null,
        scheduledEndDate: params.scheduledEndDate || null,
        estimatedCost: params.estimatedCost ? new Prisma.Decimal(params.estimatedCost) : null,
      },
    });
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    extraData?: {
      actualStartDate?: Date;
      actualEndDate?: Date;
      actualCost?: number;
    },
  ) {
    return this.prisma.maintenanceTask.update({
      where: { id },
      data: {
        status,
        ...(extraData?.actualStartDate ? { actualStartDate: extraData.actualStartDate } : {}),
        ...(extraData?.actualEndDate ? { actualEndDate: extraData.actualEndDate } : {}),
        ...(extraData?.actualCost ? { actualCost: new Prisma.Decimal(extraData.actualCost) } : {}),
      },
    });
  }

  async assignTechnician(id: string, assignedToId: string, autoUpdateStatus = true) {
    return this.prisma.maintenanceTask.update({
      where: { id },
      data: {
        assignedToId,
        ...(autoUpdateStatus ? { status: TaskStatus.ASSIGNED } : {}),
      },
    });
  }

  async createUpdateLog(
    taskId: string,
    updatedById: string,
    statusFrom: TaskStatus | null,
    statusTo: TaskStatus,
    notes: string,
    progressPercentage?: number,
    costIncurred?: number,
  ) {
    return this.prisma.maintenanceUpdate.create({
      data: {
        taskId,
        updatedById,
        statusFrom,
        statusTo,
        notes,
        progressPercentage: progressPercentage ?? null,
        costIncurred: costIncurred ? new Prisma.Decimal(costIncurred) : null,
      },
    });
  }

  async createComment(issueReportId: string, userId: string, content: string, isInternal = false) {
    return this.prisma.issueComment.create({
      data: {
        issueReportId,
        userId,
        content,
        isInternal,
      },
    });
  }

  async addRepairImageAttachment(
    taskId: string,
    uploadedById: string,
    fileUrl: string,
    fileName?: string,
    fileSize = 1024,
  ) {
    return this.prisma.attachment.create({
      data: {
        maintenanceTaskId: taskId,
        uploadedById,
        fileName: fileName || 'repair-image.jpg',
        fileUrl,
        fileType: 'image/jpeg',
        fileSize,
      },
    });
  }

  async createRepairHistory(
    assetId: string,
    taskId: string | null,
    performedById: string | null,
    repairDate: Date,
    description: string,
    partsReplaced?: string,
    cost = 0,
    downtimeHours?: number,
  ) {
    return this.prisma.repairHistory.create({
      data: {
        assetId,
        taskId,
        performedById,
        repairDate,
        description,
        partsReplaced: partsReplaced || null,
        cost: new Prisma.Decimal(cost),
        downtimeHours: downtimeHours ?? null,
      },
    });
  }

  async findRepairHistories(search?: string, assetId?: string) {
    const where: Prisma.RepairHistoryWhereInput = {
      ...(assetId ? { assetId } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: 'insensitive' } },
              { partsReplaced: { contains: search, mode: 'insensitive' } },
              { asset: { name: { contains: search, mode: 'insensitive' } } },
              { asset: { assetTag: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    return this.prisma.repairHistory.findMany({
      where,
      orderBy: { repairDate: 'desc' },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            building: { select: { id: true, name: true } },
          },
        },
        task: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
            priority: true,
            type: true,
          },
        },
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
