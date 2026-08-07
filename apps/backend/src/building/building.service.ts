import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BuildingRepository } from './building.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { BuildingQueryDto } from './dto/building-query.dto';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class BuildingService {
  constructor(
    private readonly buildingRepository: BuildingRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  // Building Management
  async findPaginatedBuildings(query: BuildingQueryDto) {
    return this.buildingRepository.findPaginated({
      search: query.search,
      departmentId: query.departmentId,
      page: query.page,
      limit: query.limit,
    });
  }

  async getBuildingById(id: string) {
    const building = await this.buildingRepository.findById(id);
    if (!building) {
      throw new NotFoundException(`Building with ID "${id}" not found`);
    }
    return building;
  }

  async createBuilding(dto: CreateBuildingDto, performingUserId?: string) {
    const existing = await this.buildingRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Building with code "${dto.code}" already exists`);
    }

    const building = await this.buildingRepository.createBuilding({
      name: dto.name,
      code: dto.code.toUpperCase(),
      address: dto.address || null,
      latitude: dto.latitude || null,
      longitude: dto.longitude || null,
      totalFloors: dto.totalFloors || 1,
      department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
    });

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'BUILDING_CREATED',
      entityType: 'BUILDING',
      entityId: building.id,
      details: { name: building.name, code: building.code },
    });

    return building;
  }

  async updateBuilding(id: string, dto: UpdateBuildingDto, performingUserId?: string) {
    const building = await this.getBuildingById(id);

    if (dto.code && dto.code.toUpperCase() !== building.code) {
      const existing = await this.buildingRepository.findByCode(dto.code);
      if (existing) {
        throw new ConflictException(`Building with code "${dto.code}" already exists`);
      }
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.code) updateData.code = dto.code.toUpperCase();
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.totalFloors !== undefined) updateData.totalFloors = dto.totalFloors;

    if (dto.departmentId !== undefined) {
      if (dto.departmentId) {
        updateData.department = { connect: { id: dto.departmentId } };
      } else {
        updateData.department = { disconnect: true };
      }
    }

    const updated = await this.buildingRepository.updateBuilding(id, updateData);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'BUILDING_UPDATED',
      entityType: 'BUILDING',
      entityId: id,
      details: { updatedFields: Object.keys(dto) },
    });

    return updated;
  }

  async softDeleteBuilding(id: string, performingUserId?: string) {
    await this.getBuildingById(id);
    const deleted = await this.buildingRepository.softDeleteBuilding(id);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'BUILDING_DELETED',
      entityType: 'BUILDING',
      entityId: id,
    });

    return deleted;
  }

  // Floor Management
  async createFloor(buildingId: string, dto: CreateFloorDto, performingUserId?: string) {
    await this.getBuildingById(buildingId);

    const existingFloor = await this.buildingRepository.findFloorByNumber(
      buildingId,
      dto.floorNumber,
    );
    if (existingFloor) {
      throw new ConflictException(`Floor #${dto.floorNumber} already exists in this building`);
    }

    const floor = await this.buildingRepository.createFloor({
      building: { connect: { id: buildingId } },
      floorNumber: dto.floorNumber,
      name: dto.name,
      mapUrl: dto.mapUrl || null,
    });

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'FLOOR_CREATED',
      entityType: 'FLOOR',
      entityId: floor.id,
      details: { buildingId, floorNumber: dto.floorNumber, name: dto.name },
    });

    return floor;
  }

  async updateFloor(floorId: string, dto: UpdateFloorDto, performingUserId?: string) {
    const floor = await this.buildingRepository.findFloorById(floorId);
    if (!floor) {
      throw new NotFoundException(`Floor with ID "${floorId}" not found`);
    }

    if (dto.floorNumber !== undefined && dto.floorNumber !== floor.floorNumber) {
      const existingFloor = await this.buildingRepository.findFloorByNumber(
        floor.buildingId,
        dto.floorNumber,
      );
      if (existingFloor) {
        throw new ConflictException(`Floor #${dto.floorNumber} already exists in this building`);
      }
    }

    const updateData: any = {};
    if (dto.floorNumber !== undefined) updateData.floorNumber = dto.floorNumber;
    if (dto.name) updateData.name = dto.name;
    if (dto.mapUrl !== undefined) updateData.mapUrl = dto.mapUrl;

    const updated = await this.buildingRepository.updateFloor(floorId, updateData);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'FLOOR_UPDATED',
      entityType: 'FLOOR',
      entityId: floorId,
    });

    return updated;
  }

  async deleteFloor(floorId: string, performingUserId?: string) {
    const floor = await this.buildingRepository.findFloorById(floorId);
    if (!floor) {
      throw new NotFoundException(`Floor with ID "${floorId}" not found`);
    }

    const deleted = await this.buildingRepository.deleteFloor(floorId);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'FLOOR_DELETED',
      entityType: 'FLOOR',
      entityId: floorId,
    });

    return deleted;
  }

  // Room Management
  async createRoom(
    buildingId: string,
    floorId: string,
    dto: CreateRoomDto,
    performingUserId?: string,
  ) {
    await this.getBuildingById(buildingId);
    const floor = await this.buildingRepository.findFloorById(floorId);
    if (!floor) {
      throw new NotFoundException(`Floor with ID "${floorId}" not found`);
    }

    const existingRoom = await this.buildingRepository.findRoomByNumber(buildingId, dto.roomNumber);
    if (existingRoom) {
      throw new ConflictException(`Room "${dto.roomNumber}" already exists in this building`);
    }

    const room = await this.buildingRepository.createRoom({
      building: { connect: { id: buildingId } },
      floor: { connect: { id: floorId } },
      roomNumber: dto.roomNumber,
      name: dto.name || null,
      type: dto.type || 'CLASSROOM',
      capacity: dto.capacity || null,
    });

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ROOM_CREATED',
      entityType: 'ROOM',
      entityId: room.id,
      details: { buildingId, floorId, roomNumber: dto.roomNumber },
    });

    return room;
  }

  async updateRoom(roomId: string, dto: UpdateRoomDto, performingUserId?: string) {
    const room = await this.buildingRepository.findRoomById(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    if (dto.roomNumber && dto.roomNumber !== room.roomNumber) {
      const existingRoom = await this.buildingRepository.findRoomByNumber(
        room.buildingId,
        dto.roomNumber,
      );
      if (existingRoom) {
        throw new ConflictException(`Room "${dto.roomNumber}" already exists in this building`);
      }
    }

    const updateData: any = {};
    if (dto.roomNumber) updateData.roomNumber = dto.roomNumber;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type) updateData.type = dto.type;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;

    const updated = await this.buildingRepository.updateRoom(roomId, updateData);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ROOM_UPDATED',
      entityType: 'ROOM',
      entityId: roomId,
    });

    return updated;
  }

  async deleteRoom(roomId: string, performingUserId?: string) {
    const room = await this.buildingRepository.findRoomById(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    const deleted = await this.buildingRepository.deleteRoom(roomId);

    await this.auditLogService.logEvent({
      userId: performingUserId,
      action: 'ROOM_DELETED',
      entityType: 'ROOM',
      entityId: roomId,
    });

    return deleted;
  }
}
