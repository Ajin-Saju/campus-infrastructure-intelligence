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
import { LostFoundService } from './lost-found.service';
import { CreateLostItemDto } from './dto/create-lost-item.dto';
import { CreateFoundItemDto } from './dto/create-found-item.dto';
import { UpdateLostFoundItemDto } from './dto/update-lost-found-item.dto';
import { CreateMatchDto } from './dto/create-match.dto';
import { ResolveMatchDto } from './dto/resolve-match.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryLostFoundDto } from './dto/query-lost-found.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lost-found')
export class LostFoundController {
  constructor(private readonly lostFoundService: LostFoundService) {}

  // Categories
  @Get('categories')
  async getCategories() {
    return this.lostFoundService.getCategories();
  }

  @Post('categories')
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser('role') role: string | { name: string },
  ) {
    const roleName = typeof role === 'object' && role ? role.name : String(role || '');
    return this.lostFoundService.createCategory(dto, roleName);
  }

  @Delete('categories/:id')
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser('role') role: string | { name: string },
  ) {
    const roleName = typeof role === 'object' && role ? role.name : String(role || '');
    return this.lostFoundService.deleteCategory(id, roleName);
  }

  // Items
  @Get()
  async getItems(
    @Query() query: QueryLostFoundDto,
    @CurrentUser('role') role: string | { name: string },
    @CurrentUser('id') userId: string,
  ) {
    const roleName = typeof role === 'object' && role ? role.name : String(role || '');
    return this.lostFoundService.getItems(query, roleName, userId);
  }

  @Get('my-reports')
  async getMyItems(@CurrentUser('id') userId: string) {
    return this.lostFoundService.getMyItems(userId);
  }

  @Get('matches')
  async getMatches(
    @CurrentUser('role') role: string | { name: string },
    @CurrentUser('id') userId: string,
  ) {
    const roleName = typeof role === 'object' && role ? role.name : String(role || '');
    return this.lostFoundService.getMatches(roleName, userId);
  }

  @Get(':id')
  async getItemById(
    @Param('id') id: string,
    @CurrentUser('role') role: string | { name: string },
    @CurrentUser('id') userId: string,
  ) {
    const roleName = typeof role === 'object' && role ? role.name : String(role || '');
    return this.lostFoundService.getItemById(id, roleName, userId);
  }

  @Post('lost')
  async createLostItem(
    @Body() dto: CreateLostItemDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lostFoundService.createLostItem(dto, userId);
  }

  @Post('found')
  async createFoundItem(
    @Body() dto: CreateFoundItemDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lostFoundService.createFoundItem(dto, userId);
  }

  @Patch(':id')
  async updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateLostFoundItemDto,
    @CurrentUser('role') role: string | { name: string },
    @CurrentUser('id') userId: string,
  ) {
    const roleName = typeof role === 'object' && role ? role.name : String(role || '');
    return this.lostFoundService.updateItem(id, dto, roleName, userId);
  }

  @Patch(':id/close')
  async closeItem(
    @Param('id') id: string,
    @CurrentUser('role') role: string | { name: string },
    @CurrentUser('id') userId: string,
  ) {
    const roleName = typeof role === 'object' && role ? role.name : String(role || '');
    return this.lostFoundService.closeItem(id, roleName, userId);
  }

  @Delete(':id')
  async deleteItem(
    @Param('id') id: string,
    @CurrentUser('role') role: string | { name: string },
  ) {
    const roleName = typeof role === 'object' && role ? role.name : String(role || '');
    return this.lostFoundService.deleteItem(id, roleName);
  }

  // Matches
  @Post('matches')
  async createMatchRequest(
    @Body() dto: CreateMatchDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lostFoundService.createMatchRequest(dto, userId);
  }

  @Patch('matches/:id/resolve')
  async resolveMatch(
    @Param('id') id: string,
    @Body() dto: ResolveMatchDto,
    @CurrentUser('role') role: string | { name: string },
    @CurrentUser('id') userId: string,
  ) {
    const roleName = typeof role === 'object' && role ? role.name : String(role || '');
    return this.lostFoundService.resolveMatch(id, dto, roleName, userId);
  }
}
