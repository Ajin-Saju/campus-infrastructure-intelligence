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
import { IssueService } from './issue.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { QueryIssueDto } from './dto/query-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Get('categories')
  async getCategories() {
    return this.issueService.getCategories();
  }

  @Post()
  async createIssue(
    @Body() dto: CreateIssueDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.issueService.createIssue(dto, performingUserId);
  }

  /**
   * GET /issues
   * Returns issues scoped to the requesting user's role:
   *   ADMIN      → all issues (no filter)
   *   STUDENT    → own reports only (reportedById = me)
   *   FACULTY    → own reports only (reportedById = me)
   *   TECHNICIAN → issues assigned to them via maintenanceTask
   *   VENDOR     → issues assigned to their vendor via vendorAssignment
   */
  @Get()
  async getIssues(
    @Query() queryDto: QueryIssueDto,
    @CurrentUser('id') performingUserId: string,
    @CurrentUser() currentUser: any,
  ) {
    const userRole: string = currentUser?.role?.name ?? '';
    return this.issueService.getIssues(queryDto, performingUserId, userRole);
  }

  @Get('my-reports')
  async getMyReports(
    @Query() queryDto: QueryIssueDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.issueService.getMyReports(queryDto, performingUserId);
  }

  /**
   * GET /issues/:id
   * Returns a single issue only if the requesting user is authorized.
   * Unauthorized access returns 403 Forbidden.
   */
  @Get(':id')
  async getIssueById(
    @Param('id') id: string,
    @CurrentUser('id') performingUserId: string,
    @CurrentUser() currentUser: any,
  ) {
    const userRole: string = currentUser?.role?.name ?? '';
    return this.issueService.getIssueById(id, performingUserId, userRole);
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Patch(':id/status')
  async updateIssueStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIssueStatusDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.issueService.updateIssueStatus(id, dto, performingUserId);
  }
}
