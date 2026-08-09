import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getAdminDashboard() {
    return this.repository.getAdminDashboardMetrics();
  }

  async getStudentDashboard(userId: string) {
    return this.repository.getStudentDashboardMetrics(userId);
  }

  async getMaintenanceDashboard(userId: string) {
    return this.repository.getMaintenanceDashboardMetrics(userId);
  }

  async getVendorDashboard(userEmail?: string, userRole?: string) {
    return this.repository.getVendorDashboardMetrics(userEmail, userRole);
  }
}
