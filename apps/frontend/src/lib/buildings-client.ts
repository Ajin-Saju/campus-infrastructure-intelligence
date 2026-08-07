import { apiRequest } from './auth-client';

export interface RoomItem {
  id: string;
  buildingId: string;
  floorId: string;
  roomNumber: string;
  name?: string;
  type: string;
  capacity?: number;
  createdAt: string;
}

export interface FloorItem {
  id: string;
  buildingId: string;
  floorNumber: number;
  name: string;
  mapUrl?: string;
  rooms: RoomItem[];
  createdAt: string;
}

export interface BuildingItem {
  id: string;
  name: string;
  code: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  totalFloors: number;
  createdAt: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  floors?: FloorItem[];
  _count?: {
    floors: number;
    rooms: number;
  };
}

export interface PaginatedBuildingsResponse {
  data: BuildingItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BuildingQueryParams {
  search?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}

// Buildings
export async function fetchBuildings(
  params: BuildingQueryParams = {},
): Promise<PaginatedBuildingsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.departmentId) query.append('departmentId', params.departmentId);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<PaginatedBuildingsResponse>(`/buildings${queryString}`);
}

export async function fetchBuildingById(id: string): Promise<BuildingItem> {
  return apiRequest<BuildingItem>(`/buildings/${id}`);
}

export async function createBuilding(data: any): Promise<BuildingItem> {
  return apiRequest<BuildingItem>('/buildings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBuilding(id: string, data: any): Promise<BuildingItem> {
  return apiRequest<BuildingItem>(`/buildings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteBuilding(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/buildings/${id}`, {
    method: 'DELETE',
  });
}

// Floors
export async function createFloor(buildingId: string, data: any): Promise<FloorItem> {
  return apiRequest<FloorItem>(`/buildings/${buildingId}/floors`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFloor(floorId: string, data: any): Promise<FloorItem> {
  return apiRequest<FloorItem>(`/floors/${floorId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteFloor(floorId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/floors/${floorId}`, {
    method: 'DELETE',
  });
}

// Rooms
export async function createRoom(
  buildingId: string,
  floorId: string,
  data: any,
): Promise<RoomItem> {
  return apiRequest<RoomItem>(`/buildings/${buildingId}/floors/${floorId}/rooms`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRoom(roomId: string, data: any): Promise<RoomItem> {
  return apiRequest<RoomItem>(`/rooms/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteRoom(roomId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/rooms/${roomId}`, {
    method: 'DELETE',
  });
}
