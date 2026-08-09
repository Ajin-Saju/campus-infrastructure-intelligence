import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { LostFoundRepository } from './lost-found.repository';
import { CreateLostItemDto } from './dto/create-lost-item.dto';
import { CreateFoundItemDto } from './dto/create-found-item.dto';
import { UpdateLostFoundItemDto } from './dto/update-lost-found-item.dto';
import { CreateMatchDto } from './dto/create-match.dto';
import { ResolveMatchDto } from './dto/resolve-match.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryLostFoundDto } from './dto/query-lost-found.dto';
import {
  LostFoundType,
  LostFoundStatus,
  LostFoundMatchStatus,
} from '@prisma/client';

@Injectable()
export class LostFoundService implements OnModuleInit {
  constructor(private repository: LostFoundRepository) {}

  async onModuleInit() {
    try {
      await this.seedDefaultCategories();
    } catch (err: any) {
      console.warn('LostFoundService seed warning:', err?.message || err);
    }
  }

  private async seedDefaultCategories() {
    const categories = [
      { name: 'Electronics', code: 'ELECTRONICS', icon: 'Laptop' },
      { name: 'Documents', code: 'DOCUMENTS', icon: 'FileText' },
      { name: 'ID Cards', code: 'ID_CARDS', icon: 'CreditCard' },
      { name: 'Keys', code: 'KEYS', icon: 'Key' },
      { name: 'Bags', code: 'BAGS', icon: 'ShoppingBag' },
      { name: 'Books', code: 'BOOKS', icon: 'Book' },
      { name: 'Clothing', code: 'CLOTHING', icon: 'Shirt' },
      { name: 'Accessories', code: 'ACCESSORIES', icon: 'Watch' },
      { name: 'Wallets', code: 'WALLETS', icon: 'Wallet' },
      { name: 'Other', code: 'OTHER', icon: 'HelpCircle' },
    ];

    for (const cat of categories) {
      try {
        const existing = await this.repository.findCategories();
        if (!existing.some((c) => c.code === cat.code)) {
          await this.repository.createCategory(cat);
        }
      } catch (err) {
        // Ignore duplicate errors during seed
      }
    }
  }

  // Categories
  async getCategories() {
    return this.repository.findCategories();
  }

  async createCategory(dto: CreateCategoryDto, userRole: string) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only Administrators can manage categories');
    }
    return this.repository.createCategory(dto);
  }

  async deleteCategory(id: string, userRole: string) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only Administrators can manage categories');
    }
    return this.repository.deleteCategory(id);
  }

  // Create Lost Item
  async createLostItem(dto: CreateLostItemDto, userId: string) {
    const category = await this.repository.findCategoryById(dto.categoryId);
    if (!category) {
      throw new BadRequestException('Invalid category specified');
    }

    const { images, dateOccurred, categoryId, buildingId, floorId, roomId, ...rest } = dto;
    return this.repository.createItem(
      {
        ...rest,
        type: LostFoundType.LOST,
        dateOccurred: new Date(dateOccurred),
        status: LostFoundStatus.ACTIVE,
        reporter: { connect: { id: userId } },
        category: { connect: { id: categoryId } },
        ...(buildingId ? { building: { connect: { id: buildingId } } } : {}),
        ...(floorId ? { floor: { connect: { id: floorId } } } : {}),
        ...(roomId ? { room: { connect: { id: roomId } } } : {}),
      },
      images || [],
    );
  }

  // Create Found Item
  async createFoundItem(dto: CreateFoundItemDto, userId: string) {
    const category = await this.repository.findCategoryById(dto.categoryId);
    if (!category) {
      throw new BadRequestException('Invalid category specified');
    }

    const { images, dateOccurred, categoryId, buildingId, floorId, roomId, ...rest } = dto;
    return this.repository.createItem(
      {
        ...rest,
        type: LostFoundType.FOUND,
        dateOccurred: new Date(dateOccurred),
        status: LostFoundStatus.ACTIVE,
        reporter: { connect: { id: userId } },
        category: { connect: { id: categoryId } },
        ...(buildingId ? { building: { connect: { id: buildingId } } } : {}),
        ...(floorId ? { floor: { connect: { id: floorId } } } : {}),
        ...(roomId ? { room: { connect: { id: roomId } } } : {}),
      },
      images || [],
    );
  }

  // Browse Public / Permitted Items
  async getItems(query: QueryLostFoundDto, userRole?: string, userId?: string) {
    const result = await this.repository.findItems(query, userRole, userId);
    
    // Mask sensitive contact details if not Admin
    const sanitizedItems = result.items.map((item) =>
      this.sanitizeItemForUser(item, userRole, userId),
    );

    return { ...result, items: sanitizedItems };
  }

  // Get My Reports
  async getMyItems(userId: string) {
    return this.repository.findUserItems(userId);
  }

  // Get Single Item Details
  async getItemById(id: string, userRole?: string, userId?: string) {
    const item = await this.repository.findItemById(id);
    if (!item) {
      throw new NotFoundException('Lost & Found report not found');
    }
    return this.sanitizeItemForUser(item, userRole, userId);
  }

  // Edit Item (Owner or Admin)
  async updateItem(
    id: string,
    dto: UpdateLostFoundItemDto,
    userRole: string,
    userId: string,
  ) {
    const item = await this.repository.findItemById(id);
    if (!item) {
      throw new NotFoundException('Lost & Found report not found');
    }

    const isAdmin = userRole === 'ADMIN';
    const isOwner = item.reporterId === userId;
    const isMaintenance = userRole === 'TECHNICIAN' || userRole === 'MAINTENANCE';

    if (!isAdmin && !isOwner && !isMaintenance) {
      throw new ForbiddenException(
        'You do not have permission to modify this report',
      );
    }

    if (!isAdmin && isMaintenance && item.reporterId !== userId) {
      // Maintenance can update location/status for items physically received
    }

    const { images, dateOccurred, categoryId, buildingId, floorId, roomId, ...rest } = dto;

    const updateData: any = { ...rest };
    if (dateOccurred) updateData.dateOccurred = new Date(dateOccurred);
    if (categoryId) updateData.category = { connect: { id: categoryId } };
    if (buildingId) updateData.building = { connect: { id: buildingId } };
    if (floorId) updateData.floor = { connect: { id: floorId } };
    if (roomId) updateData.room = { connect: { id: roomId } };

    return this.repository.updateItem(id, updateData, images);
  }

  // Close Report
  async closeItem(id: string, userRole: string, userId: string) {
    const item = await this.repository.findItemById(id);
    if (!item) {
      throw new NotFoundException('Lost & Found report not found');
    }

    if (userRole !== 'ADMIN' && item.reporterId !== userId) {
      throw new ForbiddenException(
        'You can only close reports that you created',
      );
    }

    return this.repository.updateItem(id, { status: LostFoundStatus.CLOSED });
  }

  // Delete Item (Admin only)
  async deleteItem(id: string, userRole: string) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only Administrators can delete reports');
    }
    return this.repository.softDeleteItem(id);
  }

  // Matches / Claims
  async createMatchRequest(dto: CreateMatchDto, userId: string) {
    const lostItem = await this.repository.findItemById(dto.lostItemId);
    const foundItem = await this.repository.findItemById(dto.foundItemId);

    if (!lostItem || !foundItem) {
      throw new NotFoundException('Lost or Found item not found');
    }

    if (lostItem.type !== LostFoundType.LOST || foundItem.type !== LostFoundType.FOUND) {
      throw new BadRequestException('Match must connect a Lost item and a Found item');
    }

    const match = await this.repository.createMatch({
      lostItemId: dto.lostItemId,
      foundItemId: dto.foundItemId,
      reportedById: userId,
      matchNotes: dto.matchNotes,
    });

    // Update status to POSSIBLE_MATCH
    await this.repository.updateItem(dto.lostItemId, { status: LostFoundStatus.POSSIBLE_MATCH });
    await this.repository.updateItem(dto.foundItemId, { status: LostFoundStatus.POSSIBLE_MATCH });

    return match;
  }

  async getMatches(userRole: string, userId: string) {
    return this.repository.findMatches(userRole, userId);
  }

  async resolveMatch(
    matchId: string,
    dto: ResolveMatchDto,
    userRole: string,
    userId: string,
  ) {
    const match = await this.repository.findMatchById(matchId);
    if (!match) {
      throw new NotFoundException('Match request not found');
    }

    const isAdmin = userRole === 'ADMIN';
    const isLostOwner = match.lostItem.reporterId === userId;
    const isFoundOwner = match.foundItem.reporterId === userId;

    if (!isAdmin && !isLostOwner && !isFoundOwner) {
      throw new ForbiddenException(
        'You do not have permission to resolve this claim',
      );
    }

    const updatedMatch = await this.repository.updateMatchStatus(
      matchId,
      dto.status,
      userId,
      dto.resolvedNotes,
    );

    if (dto.status === LostFoundMatchStatus.APPROVED || dto.status === LostFoundMatchStatus.RESOLVED) {
      await this.repository.updateItem(match.lostItemId, { status: LostFoundStatus.RESOLVED });
      await this.repository.updateItem(match.foundItemId, { status: LostFoundStatus.RETURNED });
    } else if (dto.status === LostFoundMatchStatus.REJECTED) {
      await this.repository.updateItem(match.lostItemId, { status: LostFoundStatus.ACTIVE });
      await this.repository.updateItem(match.foundItemId, { status: LostFoundStatus.ACTIVE });
    }

    return updatedMatch;
  }

  // Sanitization helper to enforce data protection rules
  private sanitizeItemForUser(item: any, userRole?: string, userId?: string) {
    if (!item) return item;

    const isAdmin = userRole === 'ADMIN';
    const isOwner = userId && item.reporterId === userId;

    if (!isAdmin && !isOwner) {
      const sanitized = { ...item };
      if (sanitized.reporter) {
        sanitized.reporter = {
          id: sanitized.reporter.id,
          firstName: sanitized.reporter.firstName,
          lastName: sanitized.reporter.lastName ? `${sanitized.reporter.lastName.charAt(0)}.` : '',
          role: sanitized.reporter.role,
        };
      }
      delete sanitized.contactPreference;
      return sanitized;
    }

    return item;
  }
}
