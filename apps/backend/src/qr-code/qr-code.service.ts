import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { QrCodeRepository } from './qr-code.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import * as QRCode from 'qrcode';

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
    purchaseDate?: Date | null;
    warrantyExpiry?: Date | null;
  } | null;
  associatedAssets?: any[];
}

@Injectable()
export class QrCodeService {
  constructor(
    private readonly qrRepository: QrCodeRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ==================== ROOM QR CODES ====================

  async generateRoomQr(roomId: string, regenerate = false, performingUserId?: string) {
    const room = await this.qrRepository.findRoomWithLocation(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    let existing = await this.qrRepository.findRoomQrByRoomId(roomId);

    if (existing && !regenerate) {
      return existing;
    }

    const nonce = regenerate ? `:${Date.now()}` : '';
    const payload = `CAMPUS:ROOM:${room.id}${nonce}`;
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      width: 350,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const roomQr = await this.qrRepository.upsertRoomQr(roomId, payload, qrDataUrl);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: regenerate ? 'ROOM_QR_REGENERATED' : 'ROOM_QR_GENERATED',
      entityType: 'ROOM_QR_CODE',
      entityId: roomQr.id,
      details: { roomId: room.id, roomNumber: room.roomNumber, building: room.building.name },
    });

    return roomQr;
  }

  async getRoomQr(roomId: string) {
    let qr = await this.qrRepository.findRoomQrByRoomId(roomId);
    if (!qr) {
      qr = await this.generateRoomQr(roomId, false);
    }
    return qr;
  }

  // ==================== ASSET QR CODES ====================

  async generateAssetQr(assetId: string, regenerate = false, performingUserId?: string) {
    const asset = await this.qrRepository.findAssetWithLocation(assetId);
    if (!asset) {
      throw new NotFoundException(`Asset with ID "${assetId}" not found`);
    }

    let existing = await this.qrRepository.findAssetQrByAssetId(assetId);

    if (existing && !regenerate) {
      return existing;
    }

    const nonce = regenerate ? `:${Date.now()}` : '';
    const payload = `CAMPUS:ASSET:${asset.id}${nonce}`;
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      width: 350,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const assetQr = await this.qrRepository.upsertAssetQr(assetId, payload, qrDataUrl);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: regenerate ? 'ASSET_QR_REGENERATED' : 'ASSET_QR_GENERATED',
      entityType: 'ASSET_QR_CODE',
      entityId: assetQr.id,
      details: { assetId: asset.id, assetTag: asset.assetTag, name: asset.name },
    });

    return assetQr;
  }

  async getAssetQr(assetId: string) {
    let qr = await this.qrRepository.findAssetQrByAssetId(assetId);
    if (!qr) {
      qr = await this.generateAssetQr(assetId, false);
    }
    return qr;
  }

  // ==================== AUTOMATIC LOCATION IDENTIFICATION ====================

  async validateAndResolveQr(qrDataRaw: string): Promise<QrResolutionResult> {
    if (!qrDataRaw || typeof qrDataRaw !== 'string') {
      throw new BadRequestException('Invalid QR code data');
    }

    const rawStr = qrDataRaw.trim();

    // 1. Check if rawStr is JSON string
    if (rawStr.startsWith('{') && rawStr.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawStr);
        if (parsed.assetId || parsed.assetTag) {
          return this.resolveAssetByIdentifier(parsed.assetId || parsed.assetTag, rawStr);
        }
        if (parsed.roomId || parsed.roomNumber) {
          return this.resolveRoomByIdentifier(parsed.roomId || parsed.roomNumber, rawStr);
        }
      } catch (err) {
        // Fallback to text parsing
      }
    }

    // 2. Parse CAMPUS:ASSET: or CAMPUS:ROOM: prefixes
    if (rawStr.startsWith('CAMPUS:ASSET:')) {
      const parts = rawStr.split(':');
      const targetId = parts[2];
      return this.resolveAssetByIdentifier(targetId, rawStr);
    }

    if (rawStr.startsWith('CAMPUS:ROOM:')) {
      const parts = rawStr.split(':');
      const targetId = parts[2];
      return this.resolveRoomByIdentifier(targetId, rawStr);
    }

    // 3. Check DB for exact qrCodeData match in AssetQRCode or RoomQRCode
    const dbAssetQr = await this.qrRepository.findAssetQrByData(rawStr);
    if (dbAssetQr && dbAssetQr.asset) {
      return this.formatAssetResolution(dbAssetQr.asset, rawStr);
    }

    const dbRoomQr = await this.qrRepository.findRoomQrByData(rawStr);
    if (dbRoomQr && dbRoomQr.room) {
      return this.formatRoomResolution(dbRoomQr.room, rawStr);
    }

    // 4. Heuristic fallback: attempt finding by AssetTag / Asset ID or RoomNumber / Room ID
    const assetMatch = await this.qrRepository.findAssetByTagOrId(rawStr);
    if (assetMatch) {
      return this.formatAssetResolution(assetMatch, rawStr);
    }

    const roomMatch = await this.qrRepository.findRoomByNumberOrId(rawStr);
    if (roomMatch) {
      return this.formatRoomResolution(roomMatch, rawStr);
    }

    throw new NotFoundException(
      `Scanned QR Code could not be identified with any Room or Asset in the system.`,
    );
  }

  private async resolveAssetByIdentifier(
    identifier: string,
    qrData: string,
  ): Promise<QrResolutionResult> {
    const asset = await this.qrRepository.findAssetByTagOrId(identifier);
    if (!asset) {
      throw new NotFoundException(`Asset associated with scanned QR code (${identifier}) not found`);
    }
    return this.formatAssetResolution(asset, qrData);
  }

  private async resolveRoomByIdentifier(
    identifier: string,
    qrData: string,
  ): Promise<QrResolutionResult> {
    const room = await this.qrRepository.findRoomByNumberOrId(identifier);
    if (!room) {
      throw new NotFoundException(`Room associated with scanned QR code (${identifier}) not found`);
    }
    return this.formatRoomResolution(room, qrData);
  }

  private formatAssetResolution(asset: any, qrData: string): QrResolutionResult {
    return {
      type: 'ASSET',
      qrData,
      building: asset.building
        ? { id: asset.building.id, name: asset.building.name, code: asset.building.code }
        : null,
      floor: asset.floor
        ? { id: asset.floor.id, name: asset.floor.name, floorNumber: asset.floor.floorNumber }
        : null,
      room: asset.room
        ? {
            id: asset.room.id,
            roomNumber: asset.room.roomNumber,
            name: asset.room.name,
            type: asset.room.type,
            capacity: asset.room.capacity,
          }
        : null,
      asset: {
        id: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        status: asset.status,
        category: asset.category ? asset.category.name : null,
        vendor: asset.manufacturer || null,
        purchaseDate: asset.purchaseDate,
        warrantyExpiry: asset.warrantyExpiry,
      },
    };
  }

  private formatRoomResolution(room: any, qrData: string): QrResolutionResult {
    return {
      type: 'ROOM',
      qrData,
      building: room.building
        ? { id: room.building.id, name: room.building.name, code: room.building.code }
        : null,
      floor: room.floor
        ? { id: room.floor.id, name: room.floor.name, floorNumber: room.floor.floorNumber }
        : null,
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        name: room.name,
        type: room.type,
        capacity: room.capacity,
      },
      associatedAssets: (room.assets || []).map((a: any) => ({
        id: a.id,
        assetTag: a.assetTag,
        name: a.name,
        status: a.status,
        category: a.category ? a.category.name : null,
      })),
    };
  }
}
