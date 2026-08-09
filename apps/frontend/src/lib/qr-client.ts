import { apiRequest } from './auth-client';

export interface QrCodeRecord {
  id: string;
  roomId?: string;
  assetId?: string;
  qrCodeData: string;
  qrImageUrl?: string;
  generatedAt: string;
  createdAt: string;
  room?: any;
  asset?: any;
}

export interface QrResolutionResult {
  type: 'ROOM' | 'ASSET';
  qrData: string;
  building: {
    id: string;
    name: string;
    code: string;
  } | null;
  floor: {
    id: string;
    name: string;
    floorNumber: number;
  } | null;
  room: {
    id: string;
    roomNumber: string;
    name?: string | null;
    type?: string | null;
    capacity?: number | null;
  } | null;
  asset?: {
    id: string;
    assetTag: string;
    name: string;
    status: string;
    category?: string | null;
    vendor?: string | null;
    purchaseDate?: string | null;
    warrantyExpiry?: string | null;
  } | null;
  associatedAssets?: any[];
}

export async function fetchRoomQr(roomId: string): Promise<QrCodeRecord> {
  return apiRequest<QrCodeRecord>(`/qr-code/room/${roomId}`);
}

export async function generateRoomQr(roomId: string, regenerate = false): Promise<QrCodeRecord> {
  return apiRequest<QrCodeRecord>(`/qr-code/room/${roomId}/generate`, {
    method: 'POST',
    body: JSON.stringify({ regenerate }),
  });
}

export async function fetchAssetQr(assetId: string): Promise<QrCodeRecord> {
  return apiRequest<QrCodeRecord>(`/qr-code/asset/${assetId}`);
}

export async function generateAssetQr(assetId: string, regenerate = false): Promise<QrCodeRecord> {
  return apiRequest<QrCodeRecord>(`/qr-code/asset/${assetId}/generate`, {
    method: 'POST',
    body: JSON.stringify({ regenerate }),
  });
}

export async function validateAndResolveQr(qrData: string): Promise<QrResolutionResult> {
  return apiRequest<QrResolutionResult>('/qr-code/validate', {
    method: 'POST',
    body: JSON.stringify({ qrData }),
  });
}
