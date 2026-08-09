import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterSearchDto } from './dto/search-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. GLOBAL MULTI-ENTITY SEARCH
  // ==========================================
  async globalSearch(
    query: string,
    userId?: string,
    userRole?: string,
    userEmail?: string,
  ) {
    if (!query || query.trim().length === 0) {
      return {
        assets: [],
        buildings: [],
        rooms: [],
        issues: [],
        vendors: [],
        qrCodes: [],
        totalMatches: 0,
      };
    }

    const q = query.trim();

    // 1. Issue filter based on role
    const issueWhere: Prisma.IssueReportWhereInput = {
      deletedAt: null,
      OR: [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    };

    if (userRole === 'STUDENT' || userRole === 'FACULTY') {
      if (userId) issueWhere.reportedById = userId;
    } else if (userRole === 'TECHNICIAN') {
      if (userId) {
        issueWhere.maintenanceTasks = {
          some: { assignedToId: userId },
        };
      }
    } else if (userRole === 'VENDOR' && userEmail) {
      issueWhere.maintenanceTasks = {
        some: {
          vendorAssignments: {
            some: { vendor: { email: userEmail } },
          },
        },
      };
    }

    // 2. Vendor filter based on role
    const isVendorAllowed = userRole === 'ADMIN' || userRole === 'TECHNICIAN' || userRole === 'VENDOR';
    const vendorWhere: Prisma.VendorWhereInput | null = isVendorAllowed
      ? {
          deletedAt: null,
          ...(userRole === 'VENDOR' && userEmail ? { email: userEmail } : {}),
          OR: [
            { companyName: { contains: q, mode: 'insensitive' } },
            { contactName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { taxId: { contains: q, mode: 'insensitive' } },
          ],
        }
      : null;

    // 3. QR code access check
    const canSeeQrCodes = userRole === 'ADMIN' || userRole === 'TECHNICIAN';

    const [assets, buildings, rooms, issues, vendors, assetQrCodes, roomQrCodes] = await Promise.all([
      // Assets
      this.prisma.asset.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { assetTag: { contains: q, mode: 'insensitive' } },
            { serialNumber: { contains: q, mode: 'insensitive' } },
            { manufacturer: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { building: true, room: true, category: true },
        take: 5,
      }),

      // Buildings
      this.prisma.building.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { address: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),

      // Rooms
      this.prisma.room.findMany({
        where: {
          deletedAt: null,
          OR: [
            { roomNumber: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
            { type: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { building: true },
        take: 5,
      }),

      // Issues (RBAC Scoped)
      this.prisma.issueReport.findMany({
        where: issueWhere,
        include: { category: true, asset: true, building: true },
        take: 5,
      }),

      // Vendors (RBAC Scoped)
      vendorWhere
        ? this.prisma.vendor.findMany({
            where: vendorWhere,
            take: 5,
          })
        : Promise.resolve([]),

      // Asset & Room QR Code Matches (ADMIN / TECHNICIAN only)
      canSeeQrCodes
        ? this.prisma.asset.findMany({
            where: {
              deletedAt: null,
              OR: [
                { assetTag: { contains: q, mode: 'insensitive' } },
                { serialNumber: { contains: q, mode: 'insensitive' } },
              ],
            },
            include: { building: true, room: true },
            take: 5,
          })
        : Promise.resolve([]),

      canSeeQrCodes
        ? this.prisma.room.findMany({
            where: {
              deletedAt: null,
              OR: [
                { roomNumber: { contains: q, mode: 'insensitive' } },
                { type: { contains: q, mode: 'insensitive' } },
              ],
            },
            include: { building: true },
            take: 5,
          })
        : Promise.resolve([]),
    ]);

    const qrCodes = canSeeQrCodes
      ? [
          ...assetQrCodes.map((aItem) => ({
            id: aItem.id,
            qrCodeId: `QR-ASSET-${aItem.assetTag}`,
            targetType: 'ASSET',
            name: aItem.name,
            assetTag: aItem.assetTag,
          })),
          ...roomQrCodes.map((rItem) => ({
            id: rItem.id,
            qrCodeId: `QR-ROOM-${rItem.roomNumber}`,
            targetType: 'ROOM',
            name: `Room ${rItem.roomNumber}`,
            roomNumber: rItem.roomNumber,
          })),
        ]
      : [];

    const totalMatches =
      assets.length +
      buildings.length +
      rooms.length +
      issues.length +
      vendors.length +
      qrCodes.length;

    return {
      assets,
      buildings,
      rooms,
      issues,
      vendors,
      qrCodes,
      totalMatches,
    };
  }

  // ==========================================
  // 2. ADVANCED MULTI-CRITERIA SEARCH & FILTERS
  // ==========================================
  async filterSearch(dto: FilterSearchDto, userId?: string, userRole?: string) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.IssueReportWhereInput = {
      deletedAt: null,
    };

    // Role-based scoping for Issue filter search
    if (userRole === 'STUDENT' || userRole === 'FACULTY') {
      if (userId) where.reportedById = userId;
    } else if (userRole === 'TECHNICIAN') {
      if (userId) {
        where.maintenanceTasks = {
          some: { assignedToId: userId },
        };
      }
    }

    // Keyword Search
    if (dto.q && dto.q.trim().length > 0) {
      const qStr = dto.q.trim();
      where.OR = [
        { ticketNumber: { contains: qStr, mode: 'insensitive' } },
        { title: { contains: qStr, mode: 'insensitive' } },
        { description: { contains: qStr, mode: 'insensitive' } },
      ];
    }

    // Status Filter
    if (dto.status) {
      where.status = dto.status;
    }

    // Category Filter
    if (dto.categoryId) {
      where.categoryId = dto.categoryId;
    }

    // Priority Filter
    if (dto.priority) {
      where.priority = dto.priority;
    }

    // Building Filter
    if (dto.buildingId) {
      where.buildingId = dto.buildingId;
    }

    // Room Filter
    if (dto.roomId) {
      where.roomId = dto.roomId;
    }

    // Asset Filter
    if (dto.assetId) {
      where.assetId = dto.assetId;
    }

    // Vendor Filter (matches maintenance tasks assigned to vendor)
    if (dto.vendorId) {
      where.maintenanceTasks = {
        some: {
          vendorAssignments: {
            some: {
              vendorId: dto.vendorId,
              deletedAt: null,
            },
          },
        },
      };
    }

    // Date Range Filter
    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        where.createdAt.lte = new Date(dto.endDate);
      }
    }

    // Sorting
    const orderBy: Prisma.IssueReportOrderByWithRelationInput = {};
    const sortBy = dto.sortBy || 'createdAt';
    const sortOrder = dto.sortOrder || 'desc';

    if (sortBy === 'priority') {
      orderBy.priority = sortOrder;
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [data, total] = await Promise.all([
      this.prisma.issueReport.findMany({
        where,
        include: {
          category: true,
          building: true,
          room: true,
          asset: true,
          reportedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          maintenanceTasks: {
            include: {
              vendorAssignments: {
                include: { vendor: true },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.issueReport.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
