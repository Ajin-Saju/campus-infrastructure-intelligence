import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AssetStatus } from '@prisma/client';

export interface CategoryFilterOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AssetFilterOptions {
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

@Injectable()
export class AssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== ASSET CATEGORIES ====================

  async findPaginatedCategories(options: CategoryFilterOptions) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.AssetCategoryWhereInput = {
      deletedAt: null,
    };

    if (options.search && options.search.trim() !== '') {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.assetCategory.count({ where }),
      this.prisma.assetCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          parent: true,
          _count: {
            select: {
              assets: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findAllCategories() {
    return this.prisma.assetCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    return this.prisma.assetCategory.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        subCategories: { where: { deletedAt: null } },
        _count: {
          select: { assets: { where: { deletedAt: null } } },
        },
      },
    });
  }

  async findCategoryByCode(code: string) {
    return this.prisma.assetCategory.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null },
    });
  }

  async findCategoryByName(name: string) {
    return this.prisma.assetCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, deletedAt: null },
    });
  }

  async createCategory(data: Prisma.AssetCategoryCreateInput) {
    return this.prisma.assetCategory.create({
      data,
      include: { parent: true },
    });
  }

  async updateCategory(id: string, data: Prisma.AssetCategoryUpdateInput) {
    return this.prisma.assetCategory.update({
      where: { id },
      data,
      include: { parent: true },
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.assetCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== ASSETS ====================

  async findPaginatedAssets(options: AssetFilterOptions) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {
      deletedAt: null,
    };

    if (options.search && options.search.trim() !== '') {
      const q = options.search.trim();
      where.OR = [
        { assetTag: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { manufacturer: { contains: q, mode: 'insensitive' } },
        { serialNumber: { contains: q, mode: 'insensitive' } },
        { modelNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.buildingId) {
      where.buildingId = options.buildingId;
    }

    if (options.floorId) {
      where.floorId = options.floorId;
    }

    if (options.roomId) {
      where.roomId = options.roomId;
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.vendor && options.vendor.trim() !== '') {
      where.manufacturer = { contains: options.vendor.trim(), mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      this.prisma.asset.count({ where }),
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          building: true,
          floor: true,
          room: true,
          department: true,
          images: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findAssetById(id: string) {
    return this.prisma.asset.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        building: true,
        floor: true,
        room: true,
        department: true,
        images: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findAssetByTag(assetTag: string) {
    return this.prisma.asset.findFirst({
      where: { assetTag: { equals: assetTag, mode: 'insensitive' }, deletedAt: null },
    });
  }

  async createAsset(data: Prisma.AssetCreateInput) {
    return this.prisma.asset.create({
      data,
      include: {
        category: true,
        building: true,
        floor: true,
        room: true,
        department: true,
        images: { where: { deletedAt: null } },
      },
    });
  }

  async updateAsset(id: string, data: Prisma.AssetUpdateInput) {
    return this.prisma.asset.update({
      where: { id },
      data,
      include: {
        category: true,
        building: true,
        floor: true,
        room: true,
        department: true,
        images: { where: { deletedAt: null } },
      },
    });
  }

  async deleteAsset(id: string) {
    return this.prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== ASSET IMAGES ====================

  async addImage(data: Prisma.AssetImageCreateInput) {
    return this.prisma.assetImage.create({
      data,
    });
  }

  async findImageById(id: string) {
    return this.prisma.assetImage.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async deleteImage(id: string) {
    return this.prisma.assetImage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
