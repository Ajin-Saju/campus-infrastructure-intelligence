import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface BuildingFilterOptions {
  search?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class BuildingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPaginated(options: BuildingFilterOptions) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.BuildingWhereInput = {
      deletedAt: null,
    };

    if (options.search && options.search.trim() !== '') {
      const query = options.search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (options.departmentId) {
      where.departmentId = options.departmentId;
    }

    const [total, data] = await Promise.all([
      this.prisma.building.count({ where }),
      this.prisma.building.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
          _count: {
            select: {
              floors: { where: { deletedAt: null } },
              rooms: { where: { deletedAt: null } },
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

  async findById(id: string) {
    return this.prisma.building.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        floors: {
          where: { deletedAt: null },
          orderBy: { floorNumber: 'asc' },
          include: {
            rooms: {
              where: { deletedAt: null },
              orderBy: { roomNumber: 'asc' },
            },
          },
        },
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.building.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null },
    });
  }

  async createBuilding(data: Prisma.BuildingCreateInput) {
    return this.prisma.building.create({
      data,
      include: { department: true },
    });
  }

  async updateBuilding(id: string, data: Prisma.BuildingUpdateInput) {
    return this.prisma.building.update({
      where: { id },
      data,
      include: { department: true },
    });
  }

  async softDeleteBuilding(id: string) {
    return this.prisma.building.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Floors
  async findFloorById(floorId: string) {
    return this.prisma.floor.findFirst({
      where: { id: floorId, deletedAt: null },
      include: {
        rooms: {
          where: { deletedAt: null },
          orderBy: { roomNumber: 'asc' },
        },
      },
    });
  }

  async createFloor(data: Prisma.FloorCreateInput) {
    return this.prisma.floor.create({
      data,
      include: { rooms: true },
    });
  }

  async updateFloor(id: string, data: Prisma.FloorUpdateInput) {
    return this.prisma.floor.update({
      where: { id },
      data,
    });
  }

  async deleteFloor(id: string) {
    return this.prisma.floor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Rooms
  async findRoomById(roomId: string) {
    return this.prisma.room.findFirst({
      where: { id: roomId, deletedAt: null },
      include: { building: true, floor: true },
    });
  }

  async createRoom(data: Prisma.RoomCreateInput) {
    return this.prisma.room.create({ data });
  }

  async updateRoom(id: string, data: Prisma.RoomUpdateInput) {
    return this.prisma.room.update({
      where: { id },
      data,
    });
  }

  async deleteRoom(id: string) {
    return this.prisma.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findFloorByNumber(buildingId: string, floorNumber: number) {
    return this.prisma.floor.findFirst({
      where: { buildingId, floorNumber, deletedAt: null },
    });
  }

  async findRoomByNumber(buildingId: string, roomNumber: string) {
    return this.prisma.room.findFirst({
      where: { buildingId, roomNumber, deletedAt: null },
    });
  }
}
