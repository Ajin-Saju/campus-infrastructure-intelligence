import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskStatus, IssuePriority, TaskType } from '@prisma/client';
import { MaintenanceRepository, QueryMaintenanceTasksParams, CreateTaskParams } from './maintenance.repository';

export interface UpdateStatusDto {
  status: TaskStatus;
  notes?: string;
  progressPercentage?: number;
  costIncurred?: number;
  partsReplaced?: string;
  downtimeHours?: number;
  repairImageUrl?: string;
}

export interface AssignTechnicianDto {
  assignedToId: string;
}

export interface AddCommentDto {
  content: string;
  isInternal?: boolean;
}

export interface AddRepairImageDto {
  url: string;
  fileName?: string;
  fileSize?: number;
}

export interface AddRepairHistoryDto {
  assetId?: string;
  description: string;
  partsReplaced?: string;
  cost?: number;
  downtimeHours?: number;
  repairDate?: string;
}

import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly repository: MaintenanceRepository,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Enforces strict state machine transitions:
   * Pending -> AI Categorized -> Admin Review -> Assigned -> Accepted -> In Progress -> Waiting For Parts -> Completed -> Closed
   */
  validateStatusTransition(currentStatus: TaskStatus, targetStatus: TaskStatus) {
    if (currentStatus === targetStatus) return; // idempotent retry
    if (targetStatus === TaskStatus.CANCELLED) return; // Admin can cancel at any stage

    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.PENDING]: [TaskStatus.AI_CATEGORIZED, TaskStatus.ADMIN_REVIEW, TaskStatus.ASSIGNED],
      [TaskStatus.AI_CATEGORIZED]: [TaskStatus.ADMIN_REVIEW, TaskStatus.ASSIGNED],
      [TaskStatus.ADMIN_REVIEW]: [TaskStatus.ASSIGNED],
      [TaskStatus.ASSIGNED]: [TaskStatus.ACCEPTED, TaskStatus.IN_PROGRESS],
      [TaskStatus.ACCEPTED]: [TaskStatus.IN_PROGRESS, TaskStatus.WAITING_FOR_PARTS],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.WAITING_FOR_PARTS, TaskStatus.COMPLETED],
      [TaskStatus.WAITING_FOR_PARTS]: [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED],
      [TaskStatus.COMPLETED]: [TaskStatus.CLOSED],
      [TaskStatus.CLOSED]: [],
      [TaskStatus.CANCELLED]: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed next states: [${allowed.join(', ')}]`,
      );
    }
  }

  async getPaginatedTasks(params: QueryMaintenanceTasksParams) {
    return this.repository.findPaginatedTasks(params);
  }

  async getTaskById(id: string) {
    const task = await this.repository.findTaskById(id);
    if (!task) {
      throw new NotFoundException(`Maintenance task with ID '${id}' not found`);
    }
    return task;
  }

  async createTask(params: CreateTaskParams, userId: string) {
    const task = await this.repository.createTask(params);
    await this.repository.createUpdateLog(
      task.id,
      userId,
      null,
      TaskStatus.PENDING,
      'Maintenance task created',
      0,
    );
    return this.getTaskById(task.id);
  }

  async assignTechnician(taskId: string, dto: AssignTechnicianDto, userId: string) {
    const task = await this.getTaskById(taskId);

    // If current status is PENDING / AI_CATEGORIZED / ADMIN_REVIEW, advance to ASSIGNED
    const shouldAdvanceStatus =
      task.status === TaskStatus.PENDING ||
      task.status === TaskStatus.AI_CATEGORIZED ||
      task.status === TaskStatus.ADMIN_REVIEW;

    const nextStatus = shouldAdvanceStatus ? TaskStatus.ASSIGNED : task.status;

    await this.repository.assignTechnician(taskId, dto.assignedToId, shouldAdvanceStatus);
    await this.repository.createUpdateLog(
      taskId,
      userId,
      task.status,
      nextStatus,
      `Assigned technician (User ID: ${dto.assignedToId})`,
    );

    // Trigger ISSUE_ASSIGNED Notification to technician
    await this.notificationService.sendNotification(
      dto.assignedToId,
      `Task Assigned: ${task.taskNumber}`,
      `You have been assigned to maintenance task "${task.title}".`,
      NotificationType.ISSUE_ASSIGNED,
      `/maintenance`,
    );

    return this.getTaskById(taskId);
  }

  async updateTaskStatus(taskId: string, dto: UpdateStatusDto, userId: string) {
    const task = await this.getTaskById(taskId);
    this.validateStatusTransition(task.status, dto.status);

    const now = new Date();
    const extraData: { actualStartDate?: Date; actualEndDate?: Date; actualCost?: number } = {};

    if (dto.status === TaskStatus.IN_PROGRESS && !task.actualStartDate) {
      extraData.actualStartDate = now;
    }
    if ((dto.status === TaskStatus.COMPLETED || dto.status === TaskStatus.CLOSED) && !task.actualEndDate) {
      extraData.actualEndDate = now;
    }
    if (dto.costIncurred) {
      extraData.actualCost = dto.costIncurred;
    }

    await this.repository.updateTaskStatus(taskId, dto.status, extraData);

    const notes = dto.notes || `Status changed from ${task.status} to ${dto.status}`;
    await this.repository.createUpdateLog(
      taskId,
      userId,
      task.status,
      dto.status,
      notes,
      dto.progressPercentage,
      dto.costIncurred,
    );

    // Trigger STATUS_CHANGED / ISSUE_COMPLETED Notification
    const notifType = dto.status === TaskStatus.COMPLETED ? NotificationType.ISSUE_COMPLETED : NotificationType.STATUS_CHANGED;
    const notifTitle = dto.status === TaskStatus.COMPLETED ? `Task Completed: ${task.taskNumber}` : `Status Updated: ${task.taskNumber}`;
    const notifMsg = `Task "${task.title}" status changed from ${task.status} to ${dto.status}.`;

    if (task.assignedToId) {
      await this.notificationService.sendNotification(
        task.assignedToId,
        notifTitle,
        notifMsg,
        notifType,
        `/maintenance`,
      );
    }
    if (task.issueReport?.reportedById && task.issueReport.reportedById !== task.assignedToId) {
      await this.notificationService.sendNotification(
        task.issueReport.reportedById,
        notifTitle,
        notifMsg,
        notifType,
        `/issues/${task.issueReportId}`,
      );
    }

    // If repair image URL was attached, store it as an attachment
    if (dto.repairImageUrl) {
      await this.repository.addRepairImageAttachment(taskId, userId, dto.repairImageUrl, 'repair-image.jpg');
    }

    // Auto-create Repair History entry when completed or if parts/downtime are specified
    if ((dto.status === TaskStatus.COMPLETED || dto.partsReplaced) && task.assetId) {
      await this.repository.createRepairHistory(
        task.assetId,
        taskId,
        userId,
        now,
        notes,
        dto.partsReplaced,
        dto.costIncurred || 0,
        dto.downtimeHours,
      );
    }

    return this.getTaskById(taskId);
  }

  async addComment(taskId: string, dto: AddCommentDto, userId: string) {
    const task = await this.getTaskById(taskId);
    if (!task.issueReportId) {
      // Log as maintenance update note if no issueReport is linked
      await this.repository.createUpdateLog(
        taskId,
        userId,
        task.status,
        task.status,
        `[Comment]: ${dto.content}`,
      );
    } else {
      await this.repository.createComment(task.issueReportId, userId, dto.content, dto.isInternal || false);
    }
    return this.getTaskById(taskId);
  }

  async addRepairImage(taskId: string, dto: AddRepairImageDto, userId: string) {
    await this.getTaskById(taskId);
    await this.repository.addRepairImageAttachment(
      taskId,
      userId,
      dto.url,
      dto.fileName || 'repair-image.jpg',
      dto.fileSize || 1024,
    );
    return this.getTaskById(taskId);
  }

  async addRepairHistory(taskId: string, dto: AddRepairHistoryDto, userId: string) {
    const task = await this.getTaskById(taskId);
    const assetId = dto.assetId || task.assetId;
    if (!assetId) {
      throw new BadRequestException('Asset ID is required to log repair history');
    }

    const repairDate = dto.repairDate ? new Date(dto.repairDate) : new Date();
    await this.repository.createRepairHistory(
      assetId,
      taskId,
      userId,
      repairDate,
      dto.description,
      dto.partsReplaced,
      dto.cost || 0,
      dto.downtimeHours,
    );

    return this.getTaskById(taskId);
  }

  async getRepairHistory(search?: string, assetId?: string) {
    return this.repository.findRepairHistories(search, assetId);
  }
}
