import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AssetRepository } from './asset.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateAssetCategoryDto } from './dto/create-asset-category.dto';
import { UpdateAssetCategoryDto } from './dto/update-asset-category.dto';
import { AssetCategoryQueryDto } from './dto/asset-category-query.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetQueryDto } from './dto/asset-query.dto';
import { AddAssetImageDto } from './dto/add-asset-image.dto';

@Injectable()
export class AssetService {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ==================== ASSET CATEGORIES ====================

  async findPaginatedCategories(query: AssetCategoryQueryDto) {
    return this.assetRepository.findPaginatedCategories({
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }

  async findAllCategories() {
    return this.assetRepository.findAllCategories();
  }

  async getCategoryById(id: string) {
    const category = await this.assetRepository.findCategoryById(id);
    if (!category) {
      throw new NotFoundException(`Asset category with ID "${id}" not found`);
    }
    return category;
  }

  async createCategory(dto: CreateAssetCategoryDto, performingUserId?: string) {
    const existingCode = await this.assetRepository.findCategoryByCode(dto.code);
    if (existingCode) {
      throw new ConflictException(`Category with code "${dto.code}" already exists`);
    }

    const existingName = await this.assetRepository.findCategoryByName(dto.name);
    if (existingName) {
      throw new ConflictException(`Category with name "${dto.name}" already exists`);
    }

    let parentConnect;
    if (dto.parentId) {
      const parent = await this.assetRepository.findCategoryById(dto.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent category with ID "${dto.parentId}" not found`);
      }
      parentConnect = { connect: { id: dto.parentId } };
    }

    const category = await this.assetRepository.createCategory({
      name: dto.name,
      code: dto.code.toUpperCase(),
      description: dto.description || null,
      parent: parentConnect,
    });

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ASSET_CATEGORY_CREATED',
      entityType: 'ASSET_CATEGORY',
      entityId: category.id,
      details: { name: category.name, code: category.code },
    });

    return category;
  }

  async updateCategory(id: string, dto: UpdateAssetCategoryDto, performingUserId?: string) {
    const category = await this.getCategoryById(id);

    if (dto.code && dto.code.toUpperCase() !== category.code) {
      const existingCode = await this.assetRepository.findCategoryByCode(dto.code);
      if (existingCode && existingCode.id !== id) {
        throw new ConflictException(`Category with code "${dto.code}" already exists`);
      }
    }

    if (dto.name && dto.name.toLowerCase() !== category.name.toLowerCase()) {
      const existingName = await this.assetRepository.findCategoryByName(dto.name);
      if (existingName && existingName.id !== id) {
        throw new ConflictException(`Category with name "${dto.name}" already exists`);
      }
    }

    let parentConnect;
    if (dto.parentId !== undefined) {
      if (dto.parentId === null || dto.parentId === '') {
        parentConnect = { disconnect: true };
      } else {
        if (dto.parentId === id) {
          throw new BadRequestException('A category cannot be its own parent');
        }
        const parent = await this.assetRepository.findCategoryById(dto.parentId);
        if (!parent) {
          throw new NotFoundException(`Parent category with ID "${dto.parentId}" not found`);
        }
        parentConnect = { connect: { id: dto.parentId } };
      }
    }

    const updated = await this.assetRepository.updateCategory(id, {
      name: dto.name,
      code: dto.code ? dto.code.toUpperCase() : undefined,
      description: dto.description !== undefined ? dto.description : undefined,
      parent: parentConnect,
    });

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ASSET_CATEGORY_UPDATED',
      entityType: 'ASSET_CATEGORY',
      entityId: updated.id,
      details: { name: updated.name, code: updated.code },
    });

    return updated;
  }

  async deleteCategory(id: string, performingUserId?: string) {
    const category = await this.getCategoryById(id);

    if (category._count.assets > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it has ${category._count.assets} associated assets`,
      );
    }

    await this.assetRepository.deleteCategory(id);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ASSET_CATEGORY_DELETED',
      entityType: 'ASSET_CATEGORY',
      entityId: id,
      details: { name: category.name, code: category.code },
    });
  }

  // ==================== ASSETS ====================

  async findPaginatedAssets(query: AssetQueryDto) {
    return this.assetRepository.findPaginatedAssets({
      search: query.search,
      categoryId: query.categoryId,
      buildingId: query.buildingId,
      floorId: query.floorId,
      roomId: query.roomId,
      status: query.status,
      vendor: query.vendor,
      page: query.page,
      limit: query.limit,
    });
  }

  async getAssetById(id: string) {
    const asset = await this.assetRepository.findAssetById(id);
    if (!asset) {
      throw new NotFoundException(`Asset with ID "${id}" not found`);
    }
    return asset;
  }

  async createAsset(dto: CreateAssetDto, performingUserId?: string) {
    const existingTag = await this.assetRepository.findAssetByTag(dto.assetTag);
    if (existingTag) {
      throw new ConflictException(`Asset with Tag/ID "${dto.assetTag}" already exists`);
    }

    // Verify category exists
    await this.getCategoryById(dto.categoryId);

    const asset = await this.assetRepository.createAsset({
      assetTag: dto.assetTag,
      name: dto.name,
      description: dto.description || null,
      category: { connect: { id: dto.categoryId } },
      department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
      building: dto.buildingId ? { connect: { id: dto.buildingId } } : undefined,
      floor: dto.floorId ? { connect: { id: dto.floorId } } : undefined,
      room: dto.roomId ? { connect: { id: dto.roomId } } : undefined,
      status: dto.status,
      serialNumber: dto.serialNumber || null,
      modelNumber: dto.modelNumber || null,
      manufacturer: dto.vendor || null,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      purchaseCost: dto.purchaseCost !== undefined ? dto.purchaseCost : null,
      warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null,
      expectedLifespanYears:
        dto.expectedLifespanYears !== undefined ? dto.expectedLifespanYears : null,
    });

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ASSET_CREATED',
      entityType: 'ASSET',
      entityId: asset.id,
      details: { assetTag: asset.assetTag, name: asset.name },
    });

    return asset;
  }

  async updateAsset(id: string, dto: UpdateAssetDto, performingUserId?: string) {
    const existing = await this.getAssetById(id);

    if (dto.assetTag && dto.assetTag.toLowerCase() !== existing.assetTag.toLowerCase()) {
      const existingTag = await this.assetRepository.findAssetByTag(dto.assetTag);
      if (existingTag && existingTag.id !== id) {
        throw new ConflictException(`Asset with Tag/ID "${dto.assetTag}" already exists`);
      }
    }

    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      await this.getCategoryById(dto.categoryId);
    }

    const updated = await this.assetRepository.updateAsset(id, {
      assetTag: dto.assetTag,
      name: dto.name,
      description: dto.description !== undefined ? dto.description : undefined,
      category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      department:
        dto.departmentId !== undefined
          ? dto.departmentId
            ? { connect: { id: dto.departmentId } }
            : { disconnect: true }
          : undefined,
      building:
        dto.buildingId !== undefined
          ? dto.buildingId
            ? { connect: { id: dto.buildingId } }
            : { disconnect: true }
          : undefined,
      floor:
        dto.floorId !== undefined
          ? dto.floorId
            ? { connect: { id: dto.floorId } }
            : { disconnect: true }
          : undefined,
      room:
        dto.roomId !== undefined
          ? dto.roomId
            ? { connect: { id: dto.roomId } }
            : { disconnect: true }
          : undefined,
      status: dto.status,
      serialNumber: dto.serialNumber !== undefined ? dto.serialNumber : undefined,
      modelNumber: dto.modelNumber !== undefined ? dto.modelNumber : undefined,
      manufacturer: dto.vendor !== undefined ? dto.vendor : undefined,
      purchaseDate:
        dto.purchaseDate !== undefined
          ? dto.purchaseDate
            ? new Date(dto.purchaseDate)
            : null
          : undefined,
      purchaseCost: dto.purchaseCost !== undefined ? dto.purchaseCost : undefined,
      warrantyExpiry:
        dto.warrantyExpiry !== undefined
          ? dto.warrantyExpiry
            ? new Date(dto.warrantyExpiry)
            : null
          : undefined,
      expectedLifespanYears:
        dto.expectedLifespanYears !== undefined ? dto.expectedLifespanYears : undefined,
    });

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ASSET_UPDATED',
      entityType: 'ASSET',
      entityId: updated.id,
      details: { assetTag: updated.assetTag, name: updated.name },
    });

    return updated;
  }

  async deleteAsset(id: string, performingUserId?: string) {
    const asset = await this.getAssetById(id);

    await this.assetRepository.deleteAsset(id);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ASSET_DELETED',
      entityType: 'ASSET',
      entityId: id,
      details: { assetTag: asset.assetTag, name: asset.name },
    });
  }

  // ==================== ASSET IMAGES ====================

  async addImage(assetId: string, dto: AddAssetImageDto, performingUserId?: string) {
    await this.getAssetById(assetId);

    const image = await this.assetRepository.addImage({
      asset: { connect: { id: assetId } },
      url: dto.url,
      caption: dto.caption || null,
      isPrimary: dto.isPrimary || false,
      uploadedBy: performingUserId ? { connect: { id: performingUserId } } : undefined,
    });

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ASSET_IMAGE_ADDED',
      entityType: 'ASSET_IMAGE',
      entityId: image.id,
      details: { assetId, url: image.url },
    });

    return image;
  }

  async deleteImage(assetId: string, imageId: string, performingUserId?: string) {
    await this.getAssetById(assetId);
    const image = await this.assetRepository.findImageById(imageId);
    if (!image || image.assetId !== assetId) {
      throw new NotFoundException(`Image with ID "${imageId}" for asset "${assetId}" not found`);
    }

    await this.assetRepository.deleteImage(imageId);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ASSET_IMAGE_DELETED',
      entityType: 'ASSET_IMAGE',
      entityId: imageId,
      details: { assetId },
    });
  }
}
