import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorAssignmentStatus, Prisma } from '@prisma/client';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { AssignVendorDto } from './dto/assign-vendor.dto';

@Injectable()
export class VendorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createVendor(dto: CreateVendorDto) {
    return this.prisma.vendor.create({
      data: {
        companyName: dto.companyName,
        contactName: dto.contactName || null,
        email: dto.email,
        phone: dto.phone,
        address: dto.address || null,
        taxId: dto.taxId || null,
        serviceTypes: dto.serviceTypes ? (dto.serviceTypes as Prisma.InputJsonValue) : Prisma.JsonNull,
        rating: dto.rating || 5.0,
      },
    });
  }

  async findAllVendors() {
    return this.prisma.vendor.findMany({
      where: { deletedAt: null },
      orderBy: { companyName: 'asc' },
      include: {
        vendorAssignments: {
          where: { deletedAt: null },
          include: { task: true },
        },
      },
    });
  }

  async findVendorById(id: string) {
    return this.prisma.vendor.findFirst({
      where: { id, deletedAt: null },
      include: {
        vendorAssignments: {
          where: { deletedAt: null },
          include: {
            task: {
              include: {
                asset: true,
                issueReport: true,
              },
            },
            assignedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        repairHistories: {
          where: { deletedAt: null },
          include: { asset: true },
          orderBy: { repairDate: 'desc' },
        },
      },
    });
  }

  async createAssignment(dto: AssignVendorDto, assignedById: string) {
    return this.prisma.vendorAssignment.create({
      data: {
        vendorId: dto.vendorId,
        taskId: dto.taskId,
        assignedById,
        contractAmount: dto.contractAmount ? new Prisma.Decimal(dto.contractAmount) : null,
        notes: dto.notes || null,
        status: VendorAssignmentStatus.REQUESTED,
      },
      include: {
        vendor: true,
        task: true,
      },
    });
  }

  async findAllAssignments(
    status?: VendorAssignmentStatus,
    userRole?: string,
    userEmail?: string,
  ) {
    let vendorWhere: any = { deletedAt: null };
    if (status) {
      vendorWhere.status = status;
    }
    if (userRole === 'VENDOR' && userEmail) {
      vendorWhere.vendor = { email: userEmail };
    }

    return this.prisma.vendorAssignment.findMany({
      where: vendorWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: true,
        task: {
          include: {
            asset: {
              include: { building: true, room: true },
            },
            issueReport: true,
          },
        },
        assignedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findAssignmentById(id: string, userRole?: string, userEmail?: string) {
    let vendorWhere: any = { id, deletedAt: null };
    if (userRole === 'VENDOR' && userEmail) {
      vendorWhere.vendor = { email: userEmail };
    }

    return this.prisma.vendorAssignment.findFirst({
      where: vendorWhere,
      include: {
        vendor: true,
        task: {
          include: {
            asset: true,
            issueReport: true,
          },
        },
        assignedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async updateAssignmentQuotation(
    id: string,
    quotationAmount: number,
    quotationUrl?: string,
    quotationNotes?: string,
  ) {
    return this.prisma.vendorAssignment.update({
      where: { id },
      data: {
        quotationAmount: new Prisma.Decimal(quotationAmount),
        quotationUrl: quotationUrl || null,
        quotationNotes: quotationNotes || null,
        quotationSubmittedAt: new Date(),
        status: VendorAssignmentStatus.QUOTATION_SUBMITTED,
      },
    });
  }

  async updateAssignmentRepairImages(id: string, imageUrls: string[]) {
    return this.prisma.vendorAssignment.update({
      where: { id },
      data: {
        repairImageUrls: imageUrls as Prisma.InputJsonValue,
        status: VendorAssignmentStatus.IN_PROGRESS,
      },
    });
  }

  async updateAssignmentCompletionReport(
    id: string,
    completionNotes: string,
    completionReportUrl?: string,
  ) {
    return this.prisma.vendorAssignment.update({
      where: { id },
      data: {
        completionNotes,
        completionReportUrl: completionReportUrl || null,
        completedAt: new Date(),
        status: VendorAssignmentStatus.COMPLETED,
      },
    });
  }

  async updateAssignmentInvoice(
    id: string,
    invoiceNumber: string,
    invoiceAmount: number,
    invoiceUrl?: string,
    paymentStatus = 'PENDING',
  ) {
    return this.prisma.vendorAssignment.update({
      where: { id },
      data: {
        invoiceNumber,
        invoiceAmount: new Prisma.Decimal(invoiceAmount),
        invoiceUrl: invoiceUrl || null,
        invoicedAt: new Date(),
        paymentStatus,
        status: VendorAssignmentStatus.INVOICED,
      },
    });
  }
}
