import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { AssignVendorDto } from './dto/assign-vendor.dto';
import { UploadQuotationDto } from './dto/upload-quotation.dto';
import { UploadRepairImagesDto } from './dto/upload-repair-images.dto';
import { UploadCompletionReportDto } from './dto/upload-completion-report.dto';
import { UploadInvoiceDto } from './dto/upload-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VendorAssignmentStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Roles('ADMIN')
  @Post()
  async registerVendor(@Body() dto: CreateVendorDto) {
    return this.vendorService.createVendor(dto);
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Get()
  async getAllVendors() {
    return this.vendorService.getAllVendors();
  }

  @Roles('ADMIN', 'VENDOR', 'TECHNICIAN')
  @Get('assignments')
  async getAllAssignments(
    @Query('status') status?: VendorAssignmentStatus,
    @Request() req?: any,
  ) {
    const userRole = req?.user?.role?.name;
    const userEmail = req?.user?.email;
    return this.vendorService.getAllAssignments(status, userRole, userEmail);
  }

  @Roles('ADMIN', 'VENDOR', 'TECHNICIAN')
  @Get('assignments/:id')
  async getAssignmentById(@Param('id') id: string, @Request() req?: any) {
    const userRole = req?.user?.role?.name;
    const userEmail = req?.user?.email;
    return this.vendorService.getAssignmentById(id, userRole, userEmail);
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Get(':id')
  async getVendorById(@Param('id') id: string) {
    return this.vendorService.getVendorById(id);
  }

  @Roles('ADMIN')
  @Post('assignments')
  async assignVendorToTask(@Body() dto: AssignVendorDto, @Request() req: any) {
    const assignedById = req.user.id;
    return this.vendorService.assignVendorToTask(dto, assignedById);
  }

  @Roles('ADMIN', 'VENDOR')
  @Post('assignments/:id/quotation')
  async uploadQuotation(
    @Param('id') id: string,
    @Body() dto: UploadQuotationDto,
    @Request() req?: any,
  ) {
    const userRole = req?.user?.role?.name;
    const userEmail = req?.user?.email;
    return this.vendorService.uploadQuotation(id, dto, userRole, userEmail);
  }

  @Roles('ADMIN', 'VENDOR')
  @Post('assignments/:id/repair-images')
  async uploadRepairImages(
    @Param('id') id: string,
    @Body() dto: UploadRepairImagesDto,
    @Request() req?: any,
  ) {
    const userRole = req?.user?.role?.name;
    const userEmail = req?.user?.email;
    return this.vendorService.uploadRepairImages(id, dto, userRole, userEmail);
  }

  @Roles('ADMIN', 'VENDOR')
  @Post('assignments/:id/completion-report')
  async uploadCompletionReport(
    @Param('id') id: string,
    @Body() dto: UploadCompletionReportDto,
    @Request() req?: any,
  ) {
    const userRole = req?.user?.role?.name;
    const userEmail = req?.user?.email;
    return this.vendorService.uploadCompletionReport(id, dto, userRole, userEmail);
  }

  @Roles('ADMIN', 'VENDOR')
  @Post('assignments/:id/invoice')
  async uploadInvoice(
    @Param('id') id: string,
    @Body() dto: UploadInvoiceDto,
    @Request() req?: any,
  ) {
    const userRole = req?.user?.role?.name;
    const userEmail = req?.user?.email;
    return this.vendorService.uploadInvoice(id, dto, userRole, userEmail);
  }
}
