import { apiRequest } from './auth-client';

export enum AssetStatus {
  OPERATIONAL = 'OPERATIONAL',
  NEEDS_REPAIR = 'NEEDS_REPAIR',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  DECOMMISSIONED = 'DECOMMISSIONED',
  SCRAPPED = 'SCRAPPED',
}

export interface AssetImageItem {
  id: string;
  assetId: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface AssetCategoryItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  parent?: AssetCategoryItem;
  createdAt: string;
  _count?: {
    assets: number;
  };
}

export interface AssetItem {
  id: string;
  assetTag: string;
  name: string;
  description?: string;
  categoryId: string;
  departmentId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  status: AssetStatus;
  serialNumber?: string;
  modelNumber?: string;
  manufacturer?: string; // Vendor name
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  expectedLifespanYears?: number;
  createdAt: string;

  category?: AssetCategoryItem;
  building?: { id: string; name: string; code: string };
  floor?: { id: string; name: string; floorNumber: number };
  room?: { id: string; roomNumber: string; name?: string };
  department?: { id: string; name: string; code: string };
  images?: AssetImageItem[];
}

export interface PaginatedAssetsResponse {
  data: AssetItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedAssetCategoriesResponse {
  data: AssetCategoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AssetQueryParams {
  search?: string;
  categoryId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  status?: AssetStatus;
  vendor?: string;
  page?: number;
  limit?: number;
}

export interface AssetCategoryQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

// Categories API
export async function fetchAssetCategories(
  params: AssetCategoryQueryParams = {},
): Promise<PaginatedAssetCategoriesResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<PaginatedAssetCategoriesResponse>(`/assets/categories${queryString}`);
}

export async function fetchAllAssetCategories(): Promise<AssetCategoryItem[]> {
  return apiRequest<AssetCategoryItem[]>('/assets/categories/all');
}

export async function fetchAssetCategoryById(id: string): Promise<AssetCategoryItem> {
  return apiRequest<AssetCategoryItem>(`/assets/categories/${id}`);
}

export async function createAssetCategory(data: {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
}): Promise<AssetCategoryItem> {
  return apiRequest<AssetCategoryItem>('/assets/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAssetCategory(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    parentId?: string;
  },
): Promise<AssetCategoryItem> {
  return apiRequest<AssetCategoryItem>(`/assets/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAssetCategory(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/assets/categories/${id}`, {
    method: 'DELETE',
  });
}

// Assets API
export async function fetchAssets(
  params: AssetQueryParams = {},
): Promise<PaginatedAssetsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.categoryId) query.append('categoryId', params.categoryId);
  if (params.buildingId) query.append('buildingId', params.buildingId);
  if (params.floorId) query.append('floorId', params.floorId);
  if (params.roomId) query.append('roomId', params.roomId);
  if (params.status) query.append('status', params.status);
  if (params.vendor) query.append('vendor', params.vendor);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<PaginatedAssetsResponse>(`/assets${queryString}`);
}

export async function fetchAssetById(id: string): Promise<AssetItem> {
  return apiRequest<AssetItem>(`/assets/${id}`);
}

export async function createAsset(data: {
  assetTag: string;
  name: string;
  categoryId: string;
  description?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  status?: AssetStatus;
  serialNumber?: string;
  modelNumber?: string;
  vendor?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  expectedLifespanYears?: number;
}): Promise<AssetItem> {
  return apiRequest<AssetItem>('/assets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAsset(
  id: string,
  data: Partial<{
    assetTag: string;
    name: string;
    categoryId: string;
    description: string;
    buildingId: string;
    floorId: string;
    roomId: string;
    status: AssetStatus;
    serialNumber: string;
    modelNumber: string;
    vendor: string;
    purchaseDate: string;
    purchaseCost: number;
    warrantyExpiry: string;
    expectedLifespanYears: number;
  }>,
): Promise<AssetItem> {
  return apiRequest<AssetItem>(`/assets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/assets/${id}`, {
    method: 'DELETE',
  });
}

// Asset Images API
export async function addAssetImage(
  assetId: string,
  data: { url: string; caption?: string; isPrimary?: boolean },
): Promise<AssetImageItem> {
  return apiRequest<AssetImageItem>(`/assets/${assetId}/images`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAssetImage(
  assetId: string,
  imageId: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/assets/${assetId}/images/${imageId}`, {
    method: 'DELETE',
  });
}
