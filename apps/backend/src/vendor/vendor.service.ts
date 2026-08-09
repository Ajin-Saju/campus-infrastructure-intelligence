import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { VendorRepository } from './vendor.repository';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { AssignVendorDto } from './dto/assign-vendor.dto';
import { UploadQuotationDto } from './dto/upload-quotation.dto';
import { UploadRepairImagesDto } from './dto/upload-repair-images.dto';
import { UploadCompletionReportDto } from './dto/upload-completion-report.dto';
import { UploadInvoiceDto } from './dto/upload-invoice.dto';
import { VendorAssignmentStatus } from '@prisma/client';

import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class VendorService {
  constructor(
    private readonly repository: VendorRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async createVendor(dto: CreateVendorDto) {
    return this.repository.createVendor(dto);
  }

  async getAllVendors() {
    return this.repository.findAllVendors();
  }

  async getVendorById(id: string) {
    const vendor = await this.repository.findVendorById(id);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID "${id}" not found`);
    }
    return vendor;
  }

  async assignVendorToTask(dto: AssignVendorDto, assignedById: string) {
    const vendor = await this.repository.findVendorById(dto.vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID "${dto.vendorId}" not found`);
    }

    const assignment = await this.repository.createAssignment(dto, assignedById);

    // Trigger VENDOR_ASSIGNED Notification to creator / assigned user
    await this.notificationService.sendNotification(
      assignedById,
      `Vendor Assigned: ${vendor.companyName}`,
      `Contractor "${vendor.companyName}" was assigned to task ${assignment.task?.taskNumber || ''}.`,
      NotificationType.VENDOR_ASSIGNED,
      `/vendors`,
    );

    return assignment;
  }

  async getAllAssignments(
    status?: VendorAssignmentStatus,
    userRole?: string,
    userEmail?: string,
  ) {
    return this.repository.findAllAssignments(status, userRole, userEmail);
  }

  async getAssignmentById(id: string, userRole?: string, userEmail?: string) {
    const assignment = await this.repository.findAssignmentById(id, userRole, userEmail);
    if (!assignment) {
      throw new NotFoundException(`Vendor Assignment with ID "${id}" not found`);
    }
    return assignment;
  }

  async uploadQuotation(
    id: string,
    dto: UploadQuotationDto,
    userRole?: string,
    userEmail?: string,
  ) {
    await this.getAssignmentById(id, userRole, userEmail);
    return this.repository.updateAssignmentQuotation(
      id,
      dto.quotationAmount,
      dto.quotationUrl,
      dto.quotationNotes,
    );
  }

  async uploadRepairImages(
    id: string,
    dto: UploadRepairImagesDto,
    userRole?: string,
    userEmail?: string,
  ) {
    await this.getAssignmentById(id, userRole, userEmail);
    return this.repository.updateAssignmentRepairImages(id, dto.imageUrls);
  }

  async uploadCompletionReport(
    id: string,
    dto: UploadCompletionReportDto,
    userRole?: string,
    userEmail?: string,
  ) {
    await this.getAssignmentById(id, userRole, userEmail);
    return this.repository.updateAssignmentCompletionReport(
      id,
      dto.completionNotes,
      dto.completionReportUrl,
    );
  }

  async uploadInvoice(
    id: string,
    dto: UploadInvoiceDto,
    userRole?: string,
    userEmail?: string,
  ) {
    await this.getAssignmentById(id, userRole, userEmail);
    return this.repository.updateAssignmentInvoice(
      id,
      dto.invoiceNumber,
      dto.invoiceAmount,
      dto.invoiceUrl,
      dto.paymentStatus || 'PENDING',
    );
  }
}
