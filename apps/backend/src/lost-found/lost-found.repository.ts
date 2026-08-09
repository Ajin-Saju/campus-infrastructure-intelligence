import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  LostFoundType,
  LostFoundStatus,
  LostFoundMatchStatus,
  Prisma,
} from '@prisma/client';
import { QueryLostFoundDto } from './dto/query-lost-found.dto';

@Injectable()
export class LostFoundRepository {
  constructor(private prisma: PrismaService) {}

  // Category operations
  async findCategories() {
    return this.prisma.lostFoundCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    return this.prisma.lostFoundCategory.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async createCategory(data: Prisma.LostFoundCategoryCreateInput) {
    return this.prisma.lostFoundCategory.create({ data });
  }

  async deleteCategory(id: string) {
    return this.prisma.lostFoundCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Item operations
  async createItem(
    data: Prisma.LostFoundItemCreateInput,
    imageUrls: string[] = [],
  ) {
    return this.prisma.lostFoundItem.create({
      data: {
        ...data,
        images: {
          create: imageUrls.map((url) => ({ url })),
        },
      },
      include: {
        category: true,
        building: true,
        floor: true,
        room: true,
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: { select: { name: true } },
          },
        },
        images: true,
      },
    });
  }

  async findItems(query: QueryLostFoundDto, userRole?: string, userId?: string) {
    const {
      type,
      status,
      categoryId,
      buildingId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.LostFoundItemWhereInput = {
      deletedAt: null,
    };

    if (type) where.type = type;
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (buildingId) where.buildingId = buildingId;

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { locationDescription: { contains: term, mode: 'insensitive' } },
        { foundBy: { contains: term, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.lostFoundItem.count({ where });
    const items = await this.prisma.lostFoundItem.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: true,
        building: true,
        floor: true,
        room: true,
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: { select: { name: true } },
          },
        },
        images: true,
      },
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findUserItems(userId: string) {
    return this.prisma.lostFoundItem.findMany({
      where: {
        reporterId: userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        building: true,
        floor: true,
        room: true,
        images: true,
        asLostMatches: {
          include: {
            foundItem: { include: { category: true, images: true } },
            reportedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        asFoundMatches: {
          include: {
            lostItem: { include: { category: true, images: true } },
            reportedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findItemById(id: string) {
    return this.prisma.lostFoundItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        building: true,
        floor: true,
        room: true,
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: { select: { name: true } },
          },
        },
        images: true,
        asLostMatches: {
          include: {
            foundItem: { include: { category: true, images: true } },
            reportedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        asFoundMatches: {
          include: {
            lostItem: { include: { category: true, images: true } },
            reportedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async updateItem(id: string, data: Prisma.LostFoundItemUpdateInput, imageUrls?: string[]) {
    if (imageUrls && imageUrls.length > 0) {
      await this.prisma.lostFoundImage.deleteMany({ where: { itemId: id } });
      await this.prisma.lostFoundImage.createMany({
        data: imageUrls.map((url) => ({ itemId: id, url })),
      });
    }

    return this.prisma.lostFoundItem.update({
      where: { id },
      data,
      include: {
        category: true,
        building: true,
        floor: true,
        room: true,
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: { select: { name: true } },
          },
        },
        images: true,
      },
    });
  }

  async softDeleteItem(id: string) {
    return this.prisma.lostFoundItem.update({
      where: { id },
      data: { deletedAt: new Date(), status: LostFoundStatus.CLOSED },
    });
  }

  // Match operations
  async createMatch(data: {
    lostItemId: string;
    foundItemId: string;
    reportedById: string;
    matchNotes?: string;
  }) {
    return this.prisma.lostFoundMatch.create({
      data: {
        lostItemId: data.lostItemId,
        foundItemId: data.foundItemId,
        reportedById: data.reportedById,
        matchNotes: data.matchNotes,
        status: LostFoundMatchStatus.PENDING,
      },
      include: {
        lostItem: { include: { category: true, images: true } },
        foundItem: { include: { category: true, images: true } },
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findMatches(userRole?: string, userId?: string) {
    const where: Prisma.LostFoundMatchWhereInput = {};

    if (userRole !== 'ADMIN' && userId) {
      where.OR = [
        { reportedById: userId },
        { lostItem: { reporterId: userId } },
        { foundItem: { reporterId: userId } },
      ];
    }

    return this.prisma.lostFoundMatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        lostItem: { include: { category: true, images: true, reporter: { select: { id: true, firstName: true, lastName: true } } } },
        foundItem: { include: { category: true, images: true, reporter: { select: { id: true, firstName: true, lastName: true } } } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findMatchById(id: string) {
    return this.prisma.lostFoundMatch.findUnique({
      where: { id },
      include: {
        lostItem: { include: { category: true, images: true } },
        foundItem: { include: { category: true, images: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateMatchStatus(
    id: string,
    status: LostFoundMatchStatus,
    resolvedById?: string,
    resolvedNotes?: string,
  ) {
    return this.prisma.lostFoundMatch.update({
      where: { id },
      data: {
        status,
        resolvedById,
        resolvedNotes,
      },
      include: {
        lostItem: true,
        foundItem: true,
      },
    });
  }
}
