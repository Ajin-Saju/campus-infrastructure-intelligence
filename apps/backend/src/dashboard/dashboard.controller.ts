import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles('ADMIN')
  @Get('admin')
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Roles('ADMIN', 'STUDENT', 'FACULTY')
  @Get('student')
  async getStudentDashboard(@Request() req: any) {
    const userId = req.user.id;
    return this.dashboardService.getStudentDashboard(userId);
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Get('maintenance')
  async getMaintenanceDashboard(@Request() req: any) {
    const userId = req.user.id;
    return this.dashboardService.getMaintenanceDashboard(userId);
  }

  @Roles('ADMIN', 'VENDOR')
  @Get('vendor')
  async getVendorDashboard(@Request() req: any) {
    const userEmail = req.user?.email;
    const userRole = req.user?.role?.name;
    return this.dashboardService.getVendorDashboard(userEmail, userRole);
  }
}
