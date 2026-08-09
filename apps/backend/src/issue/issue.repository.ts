import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, IssueStatus, IssuePriority } from '@prisma/client';
import { CreateIssueDto } from './dto/create-issue.dto';
import { QueryIssueDto } from './dto/query-issue.dto';

@Injectable()
export class IssueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFirstCategory() {
    return this.prisma.issueCategory.findFirst({
      where: { deletedAt: null },
    });
  }

  async findAllCategories() {
    return this.prisma.issueCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createDefaultCategory(name: string, code: string, description: string) {
    return this.prisma.issueCategory.create({
      data: {
        name,
        code,
        description,
        defaultPriority: IssuePriority.MEDIUM,
      },
    });
  }

  async createIssue(ticketNumber: string, reportedById: string, dto: CreateIssueDto, categoryId: string) {
    const {
      title,
      description,
      priority = IssuePriority.MEDIUM,
      buildingId,
      roomId,
      assetId,
      images = [],
      attachments = [],
    } = dto;

    return this.prisma.issueReport.create({
      data: {
        ticketNumber,
        title,
        description,
        priority,
        status: IssueStatus.OPEN,
        reportedById,
        categoryId,
        buildingId: buildingId || null,
        roomId: roomId || null,
        assetId: assetId || null,
        images: {
          create: images.map((img) => ({
            url: img.url,
            caption: img.caption || null,
            uploadedById: reportedById,
          })),
        },
        attachments: {
          create: attachments.map((att) => ({
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileType: att.fileType,
            fileSize: att.fileSize || 0,
            uploadedById: reportedById,
          })),
        },
      },
      include: {
        category: true,
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        building: true,
        room: {
          include: { building: true, floor: true },
        },
        asset: {
          include: { category: true, building: true, floor: true, room: true },
        },
        images: { where: { deletedAt: null } },
        attachments: { where: { deletedAt: null } },
      },
    });
  }

  async findIssues(queryDto: QueryIssueDto) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      buildingId,
      roomId,
      assetId,
      reportedById,
      search,
    } = queryDto;

    const skip = (page - 1) * limit;

    const where: Prisma.IssueReportWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(buildingId ? { buildingId } : {}),
      ...(roomId ? { roomId } : {}),
      ...(assetId ? { assetId } : {}),
      ...(reportedById ? { reportedById } : {}),
      ...(search
        ? {
            OR: [
              { ticketNumber: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.issueReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          reportedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          building: true,
          room: {
            include: { building: true, floor: true },
          },
          asset: {
            include: { category: true, building: true, floor: true, room: true },
          },
          images: { where: { deletedAt: null } },
          attachments: { where: { deletedAt: null } },
        },
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

  async findIssueById(id: string) {
    return this.prisma.issueReport.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        building: true,
        room: {
          include: { building: true, floor: true },
        },
        asset: {
          include: { category: true, building: true, floor: true, room: true },
        },
        images: { where: { deletedAt: null } },
        attachments: { where: { deletedAt: null } },
        maintenanceTasks: {
          where: { deletedAt: null },
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateIssueStatus(id: string, status: IssueStatus) {
    const updateData: Prisma.IssueReportUpdateInput = {
      status,
      ...(status === IssueStatus.RESOLVED ? { resolvedAt: new Date() } : {}),
      ...(status === IssueStatus.CLOSED ? { closedAt: new Date() } : {}),
    };

    return this.prisma.issueReport.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        building: true,
        room: {
          include: { building: true, floor: true },
        },
        asset: {
          include: { category: true, building: true, floor: true, room: true },
        },
        images: { where: { deletedAt: null } },
        attachments: { where: { deletedAt: null } },
      },
    });
  }

  async findIssuesByRole(queryDto: QueryIssueDto, userId: string, userRole: string) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      buildingId,
      roomId,
      assetId,
      search,
    } = queryDto;

    const skip = (page - 1) * limit;

    // ============================================================
    // Build base WHERE: role-scoped at the DATABASE QUERY level
    // Never expose unauthorized records through pagination/search/filters
    // ============================================================
    let roleWhere: Prisma.IssueReportWhereInput = {};

    if (userRole === 'ADMIN') {
      // Administrator: unrestricted access to all issues
      roleWhere = {};
    } else if (userRole === 'STUDENT' || userRole === 'FACULTY') {
      // Student / Faculty: only issues they personally reported
      roleWhere = { reportedById: userId };
    } else if (userRole === 'TECHNICIAN') {
      // Maintenance Staff: only issues with a maintenance task assigned to them
      roleWhere = {
        maintenanceTasks: {
          some: {
            assignedToId: userId,
            deletedAt: null,
          },
        },
      };
    } else if (userRole === 'VENDOR') {
      // Vendor: look up vendor record via the user's email address
      // (Vendor model has no userId; match is done by email)
      const userRecord = await this.prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { email: true },
      });

      if (!userRecord) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }

      const vendorRecord = await this.prisma.vendor.findFirst({
        where: { email: userRecord.email, deletedAt: null },
        select: { id: true },
      });

      if (!vendorRecord) {
        // No vendor record found for this user — return empty result set
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }

      roleWhere = {
        maintenanceTasks: {
          some: {
            vendorAssignments: {
              some: {
                vendorId: vendorRecord.id,
                deletedAt: null,
              },
            },
            deletedAt: null,
          },
        },
      };
    } else {
      // Unknown role: deny by default (empty result)
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    // ============================================================
    // Merge role WHERE with filter/search WHERE (both must apply)
    // ============================================================
    const filterWhere: Prisma.IssueReportWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(buildingId ? { buildingId } : {}),
      ...(roomId ? { roomId } : {}),
      ...(assetId ? { assetId } : {}),
      ...(search
        ? {
            OR: [
              { ticketNumber: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const where: Prisma.IssueReportWhereInput = {
      AND: [roleWhere, filterWhere],
    };

    const [data, total] = await Promise.all([
      this.prisma.issueReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          reportedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          building: true,
          room: {
            include: { building: true, floor: true },
          },
          asset: {
            include: { category: true, building: true, floor: true, room: true },
          },
          images: { where: { deletedAt: null } },
          attachments: { where: { deletedAt: null } },
          maintenanceTasks: {
            where: { deletedAt: null },
            include: {
              assignedTo: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
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

  async checkIssueAccess(issueId: string, userId: string, userRole: string): Promise<boolean> {
    if (userRole === 'ADMIN') return true;

    if (userRole === 'STUDENT' || userRole === 'FACULTY') {
      const issue = await this.prisma.issueReport.findFirst({
        where: { id: issueId, reportedById: userId, deletedAt: null },
        select: { id: true },
      });
      return !!issue;
    }

    if (userRole === 'TECHNICIAN') {
      const issue = await this.prisma.issueReport.findFirst({
        where: {
          id: issueId,
          deletedAt: null,
          maintenanceTasks: {
            some: { assignedToId: userId, deletedAt: null },
          },
        },
        select: { id: true },
      });
      return !!issue;
    }

    if (userRole === 'VENDOR') {
      // Look up vendor by user's email
      const userRecord = await this.prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { email: true },
      });
      if (!userRecord) return false;

      const vendorRecord = await this.prisma.vendor.findFirst({
        where: { email: userRecord.email, deletedAt: null },
        select: { id: true },
      });
      if (!vendorRecord) return false;

      const issue = await this.prisma.issueReport.findFirst({
        where: {
          id: issueId,
          deletedAt: null,
          maintenanceTasks: {
            some: {
              deletedAt: null,
              vendorAssignments: {
                some: { vendorId: vendorRecord.id, deletedAt: null },
              },
            },
          },
        },
        select: { id: true },
      });
      return !!issue;
    }

    return false;
  }
}
