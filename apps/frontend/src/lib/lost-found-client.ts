import { apiRequest } from './auth-client';

export type LostFoundType = 'LOST' | 'FOUND';

export type LostFoundStatus =
  | 'ACTIVE'
  | 'POSSIBLE_MATCH'
  | 'CLAIMED'
  | 'RESOLVED'
  | 'RETURNED'
  | 'CLOSED';

export type LostFoundMatchStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESOLVED';

export interface LostFoundCategory {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
}

export interface LostFoundImage {
  id: string;
  url: string;
  publicId?: string | null;
}

export interface LostFoundItem {
  id: string;
  type: LostFoundType;
  title: string;
  categoryId: string;
  category: LostFoundCategory;
  description: string;
  dateOccurred: string;
  timeOccurred?: string | null;
  buildingId?: string | null;
  building?: { id: string; name: string; code: string } | null;
  floorId?: string | null;
  floor?: { id: string; name: string; floorNumber: number } | null;
  roomId?: string | null;
  room?: { id: string; name: string; roomNumber: string } | null;
  locationDescription?: string | null;
  foundBy?: string | null;
  contactPreference?: string | null;
  status: LostFoundStatus;
  reporterId: string;
  reporter?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    role?: { name: string } | string;
  } | null;
  images: LostFoundImage[];
  asLostMatches?: LostFoundMatch[];
  asFoundMatches?: LostFoundMatch[];
  createdAt: string;
  updatedAt: string;
}

export interface LostFoundMatch {
  id: string;
  lostItemId: string;
  foundItemId: string;
  reportedById: string;
  matchNotes?: string | null;
  status: LostFoundMatchStatus;
  resolvedById?: string | null;
  resolvedNotes?: string | null;
  lostItem?: LostFoundItem;
  foundItem?: LostFoundItem;
  reportedBy?: { id: string; firstName: string; lastName: string; email?: string; phone?: string };
  resolvedBy?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface LostFoundListResponse {
  items: LostFoundItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLostItemPayload {
  title: string;
  categoryId: string;
  description: string;
  dateOccurred: string;
  timeOccurred?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  locationDescription?: string;
  contactPreference?: string;
  images?: string[];
}

export interface CreateFoundItemPayload {
  title: string;
  categoryId: string;
  description: string;
  dateOccurred: string;
  timeOccurred?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  locationDescription?: string;
  foundBy?: string;
  contactPreference?: string;
  images?: string[];
}

export async function fetchLostFoundCategories(): Promise<LostFoundCategory[]> {
  return apiRequest<LostFoundCategory[]>('/lost-found/categories');
}

export async function createLostFoundCategory(payload: {
  name: string;
  code: string;
  description?: string;
  icon?: string;
}): Promise<LostFoundCategory> {
  return apiRequest<LostFoundCategory>('/lost-found/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteLostFoundCategory(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/lost-found/categories/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchLostFoundItems(params: {
  type?: LostFoundType;
  status?: LostFoundStatus;
  categoryId?: string;
  buildingId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<LostFoundListResponse> {
  const query = new URLSearchParams();
  if (params.type) query.append('type', params.type);
  if (params.status) query.append('status', params.status);
  if (params.categoryId) query.append('categoryId', params.categoryId);
  if (params.buildingId) query.append('buildingId', params.buildingId);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  return apiRequest<LostFoundListResponse>(`/lost-found?${query.toString()}`);
}

export async function fetchMyLostFoundItems(): Promise<LostFoundItem[]> {
  return apiRequest<LostFoundItem[]>('/lost-found/my-reports');
}

export async function fetchLostFoundItemById(id: string): Promise<LostFoundItem> {
  return apiRequest<LostFoundItem>(`/lost-found/${id}`);
}

export async function createLostItemReport(payload: CreateLostItemPayload): Promise<LostFoundItem> {
  return apiRequest<LostFoundItem>('/lost-found/lost', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createFoundItemReport(payload: CreateFoundItemPayload): Promise<LostFoundItem> {
  return apiRequest<LostFoundItem>('/lost-found/found', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLostFoundItem(
  id: string,
  payload: Partial<CreateLostItemPayload> & { status?: LostFoundStatus },
): Promise<LostFoundItem> {
  return apiRequest<LostFoundItem>(`/lost-found/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function closeLostFoundItem(id: string): Promise<LostFoundItem> {
  return apiRequest<LostFoundItem>(`/lost-found/${id}/close`, {
    method: 'PATCH',
  });
}

export async function deleteLostFoundItem(id: string): Promise<LostFoundItem> {
  return apiRequest<LostFoundItem>(`/lost-found/${id}`, {
    method: 'DELETE',
  });
}

export async function createMatchRequest(payload: {
  lostItemId: string;
  foundItemId: string;
  matchNotes?: string;
}): Promise<LostFoundMatch> {
  return apiRequest<LostFoundMatch>('/lost-found/matches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMatchRequests(): Promise<LostFoundMatch[]> {
  return apiRequest<LostFoundMatch[]>('/lost-found/matches');
}

export async function resolveMatchRequest(
  matchId: string,
  payload: { status: LostFoundMatchStatus; resolvedNotes?: string },
): Promise<LostFoundMatch> {
  return apiRequest<LostFoundMatch>(`/lost-found/matches/${matchId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
