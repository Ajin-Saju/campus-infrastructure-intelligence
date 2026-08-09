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
import { BuildingService } from './building.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { BuildingQueryDto } from './dto/building-query.dto';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  // Buildings
  @Get('buildings')
  async findAll(@Query() query: BuildingQueryDto) {
    return this.buildingService.findPaginatedBuildings(query);
  }

  @Get('buildings/:id')
  async findOne(@Param('id') id: string) {
    return this.buildingService.getBuildingById(id);
  }

  @Roles('ADMIN')
  @Post('buildings')
  async createBuilding(
    @Body() dto: CreateBuildingDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.buildingService.createBuilding(dto, performingUserId);
  }

  @Roles('ADMIN')
  @Patch('buildings/:id')
  async updateBuilding(
    @Param('id') id: string,
    @Body() dto: UpdateBuildingDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.buildingService.updateBuilding(id, dto, performingUserId);
  }

  @Roles('ADMIN')
  @Delete('buildings/:id')
  async deleteBuilding(@Param('id') id: string, @CurrentUser('id') performingUserId: string) {
    await this.buildingService.softDeleteBuilding(id, performingUserId);
    return { message: `Building with ID "${id}" has been deleted successfully` };
  }

  // Floors
  @Roles('ADMIN')
  @Post('buildings/:buildingId/floors')
  async createFloor(
    @Param('buildingId') buildingId: string,
    @Body() dto: CreateFloorDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.buildingService.createFloor(buildingId, dto, performingUserId);
  }

  @Roles('ADMIN')
  @Patch('floors/:id')
  async updateFloor(
    @Param('id') id: string,
    @Body() dto: UpdateFloorDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.buildingService.updateFloor(id, dto, performingUserId);
  }

  @Roles('ADMIN')
  @Delete('floors/:id')
  async deleteFloor(@Param('id') id: string, @CurrentUser('id') performingUserId: string) {
    await this.buildingService.deleteFloor(id, performingUserId);
    return { message: `Floor with ID "${id}" has been deleted successfully` };
  }

  // Rooms
  @Roles('ADMIN')
  @Post('buildings/:buildingId/floors/:floorId/rooms')
  async createRoom(
    @Param('buildingId') buildingId: string,
    @Param('floorId') floorId: string,
    @Body() dto: CreateRoomDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.buildingService.createRoom(buildingId, floorId, dto, performingUserId);
  }

  @Roles('ADMIN')
  @Patch('rooms/:id')
  async updateRoom(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser('id') performingUserId: string,
  ) {
    return this.buildingService.updateRoom(id, dto, performingUserId);
  }

  @Roles('ADMIN')
  @Delete('rooms/:id')
  async deleteRoom(@Param('id') id: string, @CurrentUser('id') performingUserId: string) {
    await this.buildingService.deleteRoom(id, performingUserId);
    return { message: `Room with ID "${id}" has been deleted successfully` };
  }
}
