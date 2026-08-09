import { apiRequest } from './auth-client';

export interface GlobalSearchResult {
  assets: any[];
  buildings: any[];
  rooms: any[];
  issues: any[];
  vendors: any[];
  qrCodes: any[];
  totalMatches: number;
}

export interface FilterSearchQueryParams {
  q?: string;
  status?: string;
  categoryId?: string;
  priority?: string;
  buildingId?: string;
  roomId?: string;
  vendorId?: string;
  assetId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FilterSearchResult {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function fetchGlobalSearch(q: string): Promise<GlobalSearchResult> {
  return apiRequest<GlobalSearchResult>(`/search/global?q=${encodeURIComponent(q)}`);
}

export async function fetchFilteredSearch(params: FilterSearchQueryParams): Promise<FilterSearchResult> {
  const queryParts: string[] = [];
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      queryParts.push(`${key}=${encodeURIComponent(String(val))}`);
    }
  });

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiRequest<FilterSearchResult>(`/search/filter${queryString}`);
}
