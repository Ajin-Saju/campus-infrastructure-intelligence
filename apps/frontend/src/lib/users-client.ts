import { apiRequest } from './auth-client';

export interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  activityLogs?: Array<{
    id: string;
    action: string;
    details?: any;
    createdAt: string;
  }>;
}

export interface PaginatedUsersResponse {
  data: UserItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserQueryParams {
  search?: string;
  role?: string;
  departmentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function fetchUsers(params: UserQueryParams = {}): Promise<PaginatedUsersResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.role && params.role !== 'ALL') query.append('role', params.role);
  if (params.departmentId) query.append('departmentId', params.departmentId);
  if (params.isActive !== undefined) query.append('isActive', String(params.isActive));
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<PaginatedUsersResponse>(`/users${queryString}`);
}

export async function fetchUserById(id: string): Promise<UserItem> {
  return apiRequest<UserItem>(`/users/${id}`);
}

export async function createUser(data: any): Promise<UserItem> {
  return apiRequest<UserItem>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: any): Promise<UserItem> {
  return apiRequest<UserItem>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateUserRole(id: string, roleName: string): Promise<UserItem> {
  return apiRequest<UserItem>(`/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ roleName }),
  });
}

export async function updateUserAvatar(id: string, avatarUrl: string): Promise<UserItem> {
  return apiRequest<UserItem>(`/users/${id}/avatar`, {
    method: 'POST',
    body: JSON.stringify({ avatarUrl }),
  });
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchRoles(): Promise<
  Array<{ id: string; name: string; description?: string }>
> {
  return apiRequest<Array<{ id: string; name: string; description?: string }>>('/users/roles');
}
