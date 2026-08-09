import { apiRequest } from './auth-client';

export type TaskStatusType =
  | 'PENDING'
  | 'AI_CATEGORIZED'
  | 'ADMIN_REVIEW'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export type IssuePriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskType = 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'EMERGENCY';

export interface MaintenanceUpdateItem {
  id: string;
  taskId: string;
  updatedById: string;
  statusFrom?: TaskStatusType | null;
  statusTo: TaskStatusType;
  notes: string;
  progressPercentage?: number | null;
  costIncurred?: number | null;
  createdAt: string;
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface RepairHistoryItem {
  id: string;
  assetId: string;
  taskId?: string | null;
  performedById?: string | null;
  repairDate: string;
  description: string;
  partsReplaced?: string | null;
  cost: number;
  downtimeHours?: number | null;
  createdAt: string;
  asset?: {
    id: string;
    name: string;
    assetTag: string;
    building?: { id: string; name: string } | null;
  } | null;
  task?: {
    id: string;
    taskNumber: string;
    title: string;
    status: TaskStatusType;
    priority: IssuePriorityType;
    type?: TaskType;
  } | null;
  performedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
}

export interface TaskAttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MaintenanceTaskItem {
  id: string;
  taskNumber: string;
  title: string;
  description?: string | null;
  issueReportId?: string | null;
  assetId?: string | null;
  assignedToId?: string | null;
  type: TaskType;
  status: TaskStatusType;
  priority: IssuePriorityType;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  createdAt: string;
  updatedAt: string;

  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  } | null;
  asset?: {
    id: string;
    name: string;
    assetTag: string;
    category?: { id: string; name: string };
    building?: { id: string; name: string };
    room?: { id: string; roomNumber: string };
  } | null;
  issueReport?: {
    id: string;
    ticketNumber: string;
    title: string;
    priority: IssuePriorityType;
    category?: { id: string; name: string };
    reportedBy?: { id: string; firstName: string; lastName: string; email: string };
    comments?: {
      id: string;
      content: string;
      createdAt: string;
      isInternal: boolean;
      user: { id: string; firstName: string; lastName: string };
    }[];
  } | null;
  updates?: MaintenanceUpdateItem[];
  repairHistories?: RepairHistoryItem[];
  attachments?: TaskAttachmentItem[];
  _count?: {
    updates: number;
    repairHistories: number;
    attachments: number;
  };
}

export interface QueryTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatusType;
  priority?: IssuePriorityType;
  assignedToId?: string;
  assigned?: boolean;
  issueReportId?: string;
  assetId?: string;
  search?: string;
}

export interface TasksPaginatedResponse {
  data: MaintenanceTaskItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  issueReportId?: string;
  assetId?: string;
  assignedToId?: string;
  type?: TaskType;
  priority?: IssuePriorityType;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  estimatedCost?: number;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatusType;
  notes?: string;
  progressPercentage?: number;
  costIncurred?: number;
  partsReplaced?: string;
  downtimeHours?: number;
  repairImageUrl?: string;
}

export async function fetchMaintenanceTasks(params: QueryTasksParams = {}): Promise<TasksPaginatedResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.status) query.append('status', params.status);
  if (params.priority) query.append('priority', params.priority);
  if (params.assignedToId) query.append('assignedToId', params.assignedToId);
  if (params.assigned !== undefined) query.append('assigned', params.assigned.toString());
  if (params.issueReportId) query.append('issueReportId', params.issueReportId);
  if (params.assetId) query.append('assetId', params.assetId);
  if (params.search) query.append('search', params.search);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<TasksPaginatedResponse>(`/maintenance/tasks${queryString}`);
}

export async function fetchMaintenanceTaskById(id: string): Promise<MaintenanceTaskItem> {
  return apiRequest<MaintenanceTaskItem>(`/maintenance/tasks/${id}`);
}

export async function createMaintenanceTask(payload: CreateTaskPayload): Promise<MaintenanceTaskItem> {
  return apiRequest<MaintenanceTaskItem>('/maintenance/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function assignTechnician(id: string, assignedToId: string): Promise<MaintenanceTaskItem> {
  return apiRequest<MaintenanceTaskItem>(`/maintenance/tasks/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedToId }),
  });
}

export async function updateMaintenanceTaskStatus(
  id: string,
  payload: UpdateTaskStatusPayload,
): Promise<MaintenanceTaskItem> {
  return apiRequest<MaintenanceTaskItem>(`/maintenance/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function addMaintenanceTaskComment(
  id: string,
  content: string,
  isInternal = false,
): Promise<MaintenanceTaskItem> {
  return apiRequest<MaintenanceTaskItem>(`/maintenance/tasks/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, isInternal }),
  });
}

export async function addMaintenanceRepairImage(
  id: string,
  url: string,
  fileName?: string,
): Promise<MaintenanceTaskItem> {
  return apiRequest<MaintenanceTaskItem>(`/maintenance/tasks/${id}/repair-images`, {
    method: 'POST',
    body: JSON.stringify({ url, fileName }),
  });
}

export async function addMaintenanceRepairHistory(
  id: string,
  payload: {
    assetId?: string;
    description: string;
    partsReplaced?: string;
    cost?: number;
    downtimeHours?: number;
    repairDate?: string;
  },
): Promise<MaintenanceTaskItem> {
  return apiRequest<MaintenanceTaskItem>(`/maintenance/tasks/${id}/repair-history`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchRepairHistory(params: { search?: string; assetId?: string } = {}): Promise<RepairHistoryItem[]> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.assetId) query.append('assetId', params.assetId);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<RepairHistoryItem[]>(`/maintenance/history${queryString}`);
}
