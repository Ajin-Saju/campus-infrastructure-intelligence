import { apiRequest } from './auth-client';

export interface IssueCategoryItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  defaultPriority?: string;
}

export interface IssueImageItem {
  id?: string;
  url: string;
  caption?: string;
}

export interface IssueAttachmentItem {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

export interface IssueReportItem {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  categoryId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
  reportedById: string;
  buildingId?: string | null;
  roomId?: string | null;
  assetId?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  category?: IssueCategoryItem;
  reportedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  building?: {
    id: string;
    name: string;
    code: string;
  } | null;
  room?: {
    id: string;
    roomNumber: string;
    name?: string | null;
    building?: { id: string; name: string };
    floor?: { id: string; name: string; floorNumber: number };
  } | null;
  asset?: {
    id: string;
    assetTag: string;
    name: string;
    category?: { id: string; name: string };
    building?: { id: string; name: string };
    floor?: { id: string; name: string };
    room?: { id: string; roomNumber: string };
  } | null;

  images?: IssueImageItem[];
  attachments?: IssueAttachmentItem[];
  maintenanceTasks?: {
    id: string;
    taskNumber: string;
    title: string;
    status: string;
    priority: string;
    assignedTo?: { id: string; firstName: string; lastName: string } | null;
  }[];
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  categoryId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  buildingId?: string;
  roomId?: string;
  assetId?: string;
  images?: { url: string; caption?: string }[];
  attachments?: { fileName: string; fileUrl: string; fileType: string; fileSize?: number }[];
}

export interface IssuesPaginatedResponse {
  data: IssueReportItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function fetchIssueCategories(): Promise<IssueCategoryItem[]> {
  return apiRequest<IssueCategoryItem[]>('/issues/categories');
}

export async function createIssueReport(payload: CreateIssuePayload): Promise<IssueReportItem> {
  return apiRequest<IssueReportItem>('/issues', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMyReports(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<IssuesPaginatedResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<IssuesPaginatedResponse>(`/issues/my-reports${queryString}`);
}

export async function fetchAllIssues(params?: {
  page?: number;
  limit?: number;
  status?: string;
  buildingId?: string;
  roomId?: string;
  assetId?: string;
  search?: string;
}): Promise<IssuesPaginatedResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.status) query.append('status', params.status);
  if (params?.buildingId) query.append('buildingId', params.buildingId);
  if (params?.roomId) query.append('roomId', params.roomId);
  if (params?.assetId) query.append('assetId', params.assetId);
  if (params?.search) query.append('search', params.search);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<IssuesPaginatedResponse>(`/issues${queryString}`);
}

export async function fetchIssueById(id: string): Promise<IssueReportItem> {
  return apiRequest<IssueReportItem>(`/issues/${id}`);
}

export async function updateIssueStatus(
  id: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED',
): Promise<IssueReportItem> {
  return apiRequest<IssueReportItem>(`/issues/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
