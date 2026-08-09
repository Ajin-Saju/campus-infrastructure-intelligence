import { apiRequest } from './auth-client';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ISSUE_ASSIGNED' | 'STATUS_CHANGED' | 'ISSUE_COMPLETED' | 'VENDOR_ASSIGNED' | 'PRIORITY_CHANGED' | 'ISSUE_UPDATE' | 'TASK_ASSIGNMENT' | 'SLA_BREACH' | 'SYSTEM' | 'MAINTENANCE_REMINDER';
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export async function fetchUserNotifications(limit = 50): Promise<NotificationItem[]> {
  return apiRequest<NotificationItem[]>(`/notifications?limit=${limit}`);
}

export async function fetchUnreadNotificationCount(): Promise<{ unreadCount: number }> {
  return apiRequest<{ unreadCount: number }>('/notifications/unread-count');
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function deleteNotification(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/notifications/${id}`, {
    method: 'DELETE',
  });
}
