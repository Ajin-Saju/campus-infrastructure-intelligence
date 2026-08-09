import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QrCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== ROOM QR CODES ====================

  async findRoomQrByRoomId(roomId: string) {
    return this.prisma.roomQRCode.findFirst({
      where: { roomId, deletedAt: null },
      include: {
        room: {
          include: {
            building: true,
            floor: true,
            assets: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async findRoomQrByData(qrCodeData: string) {
    return this.prisma.roomQRCode.findFirst({
      where: { qrCodeData, deletedAt: null },
      include: {
        room: {
          include: {
            building: true,
            floor: true,
            assets: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async upsertRoomQr(roomId: string, qrCodeData: string, qrImageUrl?: string) {
    return this.prisma.roomQRCode.upsert({
      where: { roomId },
      update: {
        qrCodeData,
        qrImageUrl,
        generatedAt: new Date(),
        deletedAt: null,
      },
      create: {
        roomId,
        qrCodeData,
        qrImageUrl,
      },
      include: {
        room: {
          include: {
            building: true,
            floor: true,
            assets: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  // ==================== ASSET QR CODES ====================

  async findAssetQrByAssetId(assetId: string) {
    return this.prisma.assetQRCode.findFirst({
      where: { assetId, deletedAt: null },
      include: {
        asset: {
          include: {
            category: true,
            building: true,
            floor: true,
            room: true,
            images: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async findAssetQrByData(qrCodeData: string) {
    return this.prisma.assetQRCode.findFirst({
      where: { qrCodeData, deletedAt: null },
      include: {
        asset: {
          include: {
            category: true,
            building: true,
            floor: true,
            room: true,
            images: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async upsertAssetQr(assetId: string, qrCodeData: string, qrImageUrl?: string) {
    return this.prisma.assetQRCode.upsert({
      where: { assetId },
      update: {
        qrCodeData,
        qrImageUrl,
        generatedAt: new Date(),
        deletedAt: null,
      },
      create: {
        assetId,
        qrCodeData,
        qrImageUrl,
      },
      include: {
        asset: {
          include: {
            category: true,
            building: true,
            floor: true,
            room: true,
            images: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  // ==================== ENTITY SEARCH FOR RESOLUTION ====================

  async findRoomWithLocation(roomId: string) {
    return this.prisma.room.findFirst({
      where: { id: roomId, deletedAt: null },
      include: {
        building: true,
        floor: true,
        assets: {
          where: { deletedAt: null },
          include: { category: true, images: { where: { deletedAt: null } } },
        },
      },
    });
  }

  async findRoomByNumberOrId(identifier: string) {
    return this.prisma.room.findFirst({
      where: {
        OR: [{ id: identifier }, { roomNumber: { equals: identifier, mode: 'insensitive' } }],
        deletedAt: null,
      },
      include: {
        building: true,
        floor: true,
        assets: {
          where: { deletedAt: null },
          include: { category: true, images: { where: { deletedAt: null } } },
        },
      },
    });
  }

  async findAssetWithLocation(assetId: string) {
    return this.prisma.asset.findFirst({
      where: { id: assetId, deletedAt: null },
      include: {
        category: true,
        building: true,
        floor: true,
        room: true,
        images: { where: { deletedAt: null } },
      },
    });
  }

  async findAssetByTagOrId(identifier: string) {
    return this.prisma.asset.findFirst({
      where: {
        OR: [{ id: identifier }, { assetTag: { equals: identifier, mode: 'insensitive' } }],
        deletedAt: null,
      },
      include: {
        category: true,
        building: true,
        floor: true,
        room: true,
        images: { where: { deletedAt: null } },
      },
    });
  }
}
