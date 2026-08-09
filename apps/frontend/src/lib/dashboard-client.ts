import { apiRequest } from './auth-client';

export interface AdminDashboardData {
  metrics: {
    openIssues: number;
    closedIssues: number;
    criticalIssues: number;
    activeMaintenance: number;
    monthlyCost: number;
    resolutionTimeHours: number;
    problematicBuilding: string;
    problematicRoom: string;
    vendorPerformance: Array<{
      id: string;
      companyName: string;
      rating: number;
      assignedJobs: number;
      completedJobs: number;
      totalBilled: number;
    }>;
  };
  charts: {
    issuesPerMonth: Array<{ month: string; issues: number }>;
    issuesPerBuilding: Array<{ building: string; issues: number }>;
    categoryDistribution: Array<{ name: string; value: number }>;
    resolutionTimeTrend: Array<{ month: string; avgHours: number }>;
    repairCostTrend: Array<{ month: string; cost: number }>;
    topProblemAssets: Array<{ name: string; issueCount: number }>;
  };
}

export interface StudentDashboardData {
  metrics: {
    myReports: number;
    pendingReports: number;
    completedReports: number;
  };
  recentReports: any[];
}

export interface MaintenanceDashboardData {
  metrics: {
    assignedTasks: number;
    todaysJobs: number;
    deadlines: number;
  };
  myTasksList: any[];
}

export interface VendorDashboardData {
  metrics: {
    assignedRepairs: number;
    completedRepairs: number;
    invoicesCount: number;
    totalInvoicesSum: number;
  };
  assignmentsList: any[];
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  return apiRequest<AdminDashboardData>('/dashboard/admin');
}

export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  return apiRequest<StudentDashboardData>('/dashboard/student');
}

export async function fetchMaintenanceDashboard(): Promise<MaintenanceDashboardData> {
  return apiRequest<MaintenanceDashboardData>('/dashboard/maintenance');
}

export async function fetchVendorDashboard(): Promise<VendorDashboardData> {
  return apiRequest<VendorDashboardData>('/dashboard/vendor');
}
