import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskStatus, IssuePriority, TaskType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  MaintenanceService,
  UpdateStatusDto,
  AssignTechnicianDto,
  AddCommentDto,
  AddRepairImageDto,
  AddRepairHistoryDto,
} from './maintenance.service';

export interface CreateTaskBodyDto {
  title: string;
  description?: string;
  issueReportId?: string;
  assetId?: string;
  assignedToId?: string;
  type?: TaskType;
  priority?: IssuePriority;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  estimatedCost?: number;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Roles('ADMIN', 'TECHNICIAN')
  @Get('tasks')
  async getTasks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: IssuePriority,
    @Query('assignedToId') assignedToId?: string,
    @Query('assigned') assigned?: string,
    @Query('issueReportId') issueReportId?: string,
    @Query('assetId') assetId?: string,
    @Query('search') search?: string,
  ) {
    return this.maintenanceService.getPaginatedTasks({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status,
      priority,
      assignedToId,
      isAssigned: assigned === 'true' ? true : assigned === 'false' ? false : undefined,
      issueReportId,
      assetId,
      search,
    });
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Get('history')
  async getRepairHistory(
    @Query('search') search?: string,
    @Query('assetId') assetId?: string,
  ) {
    return this.maintenanceService.getRepairHistory(search, assetId);
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Post('tasks')
  async createTask(
    @Body() body: CreateTaskBodyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.createTask(
      {
        ...body,
        scheduledStartDate: body.scheduledStartDate ? new Date(body.scheduledStartDate) : undefined,
        scheduledEndDate: body.scheduledEndDate ? new Date(body.scheduledEndDate) : undefined,
      },
      userId,
    );
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Get('tasks/:id')
  async getTaskById(@Param('id') id: string) {
    return this.maintenanceService.getTaskById(id);
  }

  @Roles('ADMIN')
  @Patch('tasks/:id/assign')
  async assignTechnician(
    @Param('id') id: string,
    @Body() dto: AssignTechnicianDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.assignTechnician(id, dto, userId);
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Patch('tasks/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.updateTaskStatus(id, dto, userId);
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Post('tasks/:id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.addComment(id, dto, userId);
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Post('tasks/:id/repair-images')
  async addRepairImage(
    @Param('id') id: string,
    @Body() dto: AddRepairImageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.addRepairImage(id, dto, userId);
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Post('tasks/:id/repair-history')
  async addRepairHistory(
    @Param('id') id: string,
    @Body() dto: AddRepairHistoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.addRepairHistory(id, dto, userId);
  }
}
