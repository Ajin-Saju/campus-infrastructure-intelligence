import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetCategoryDto } from './dto/create-asset-category.dto';
import { UpdateAssetCategoryDto } from './dto/update-asset-category.dto';
import { AssetCategoryQueryDto } from './dto/asset-category-query.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetQueryDto } from './dto/asset-query.dto';
import { AddAssetImageDto } from './dto/add-asset-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  // ==================== ASSET CATEGORIES ====================

  @Get('categories')
  async findCategories(@Query() query: AssetCategoryQueryDto) {
    return this.assetService.findPaginatedCategories(query);
  }

  @Get('categories/all')
  async findAllCategories() {
    return this.assetService.findAllCategories();
  }

  @Get('categories/:id')
  async findCategoryById(@Param('id') id: string) {
    return this.assetService.getCategoryById(id);
  }

  @Roles('ADMIN')
  @Post('categories')
  async createCategory(
    @Body() dto: CreateAssetCategoryDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.assetService.createCategory(dto, performingUserId);
  }

  @Roles('ADMIN')
  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateAssetCategoryDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.assetService.updateCategory(id, dto, performingUserId);
  }

  @Roles('ADMIN')
  @Delete('categories/:id')
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser('id') performingUserId: string,
  ) {
    await this.assetService.deleteCategory(id, performingUserId);
    return { message: `Category with ID "${id}" deleted successfully` };
  }

  // ==================== ASSETS ====================

  @Get()
  async findAssets(@Query() query: AssetQueryDto) {
    return this.assetService.findPaginatedAssets(query);
  }

  @Get(':id')
  async findAssetById(@Param('id') id: string) {
    return this.assetService.getAssetById(id);
  }

  @Roles('ADMIN')
  @Post()
  async createAsset(
    @Body() dto: CreateAssetDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.assetService.createAsset(dto, performingUserId);
  }

  @Roles('ADMIN')
  @Patch(':id')
  async updateAsset(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.assetService.updateAsset(id, dto, performingUserId);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async deleteAsset(
    @Param('id') id: string,
    @CurrentUser('id') performingUserId: string,
  ) {
    await this.assetService.deleteAsset(id, performingUserId);
    return { message: `Asset with ID "${id}" deleted successfully` };
  }

  // ==================== ASSET IMAGES ====================

  @Roles('ADMIN', 'TECHNICIAN')
  @Post(':id/images')
  async addImage(
    @Param('id') id: string,
    @Body() dto: AddAssetImageDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.assetService.addImage(id, dto, performingUserId);
  }

  @Roles('ADMIN')
  @Delete(':id/images/:imageId')
  async deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser('id') performingUserId: string,
  ) {
    await this.assetService.deleteImage(id, imageId, performingUserId);
    return { message: `Image with ID "${imageId}" deleted successfully` };
  }
}
