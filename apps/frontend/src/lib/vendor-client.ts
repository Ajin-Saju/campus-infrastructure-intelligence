import { apiRequest } from './auth-client';

export interface VendorItem {
  id: string;
  companyName: string;
  contactName?: string | null;
  email: string;
  phone: string;
  address?: string | null;
  taxId?: string | null;
  serviceTypes?: string[] | null;
  rating?: number | null;
  isActive: boolean;
  createdAt: string;
  vendorAssignments?: VendorAssignmentItem[];
  repairHistories?: any[];
}

export interface VendorAssignmentItem {
  id: string;
  vendorId: string;
  taskId: string;
  assignedById: string;
  status: 'REQUESTED' | 'QUOTATION_SUBMITTED' | 'ACCEPTED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED' | 'INVOICED' | 'CANCELLED';
  assignedAt: string;
  completedAt?: string | null;
  contractAmount?: number | null;
  notes?: string | null;

  // Quotation
  quotationAmount?: number | null;
  quotationUrl?: string | null;
  quotationNotes?: string | null;
  quotationSubmittedAt?: string | null;

  // Repair Images
  repairImageUrls?: string[] | null;

  // Completion Report
  completionReportUrl?: string | null;
  completionNotes?: string | null;

  // Invoice
  invoiceNumber?: string | null;
  invoiceAmount?: number | null;
  invoiceUrl?: string | null;
  invoicedAt?: string | null;
  paymentStatus?: string | null;

  vendor?: VendorItem;
  task?: {
    id: string;
    taskNumber: string;
    title: string;
    status: string;
    priority: string;
    asset?: {
      id: string;
      assetTag: string;
      name: string;
      building?: { name: string };
      room?: { roomNumber: string };
    } | null;
    issueReport?: {
      id: string;
      ticketNumber: string;
      title: string;
    } | null;
  };
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface CreateVendorPayload {
  companyName: string;
  contactName?: string;
  email: string;
  phone: string;
  address?: string;
  taxId?: string;
  serviceTypes?: string[];
  rating?: number;
}

export interface AssignVendorPayload {
  vendorId: string;
  taskId: string;
  contractAmount?: number;
  notes?: string;
}

export interface UploadQuotationPayload {
  quotationAmount: number;
  quotationUrl?: string;
  quotationNotes?: string;
}

export interface UploadRepairImagesPayload {
  imageUrls: string[];
}

export interface UploadCompletionReportPayload {
  completionReportUrl?: string;
  completionNotes: string;
}

export interface UploadInvoicePayload {
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceUrl?: string;
  paymentStatus?: string;
}

export async function fetchVendors(): Promise<VendorItem[]> {
  return apiRequest<VendorItem[]>('/vendors');
}

export async function fetchVendorById(id: string): Promise<VendorItem> {
  return apiRequest<VendorItem>(`/vendors/${id}`);
}

export async function createVendor(payload: CreateVendorPayload): Promise<VendorItem> {
  return apiRequest<VendorItem>('/vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchVendorAssignments(status?: string): Promise<VendorAssignmentItem[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequest<VendorAssignmentItem[]>(`/vendors/assignments${query}`);
}

export async function fetchVendorAssignmentById(id: string): Promise<VendorAssignmentItem> {
  return apiRequest<VendorAssignmentItem>(`/vendors/assignments/${id}`);
}

export async function assignVendorToTask(payload: AssignVendorPayload): Promise<VendorAssignmentItem> {
  return apiRequest<VendorAssignmentItem>('/vendors/assignments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadQuotation(id: string, payload: UploadQuotationPayload): Promise<VendorAssignmentItem> {
  return apiRequest<VendorAssignmentItem>(`/vendors/assignments/${id}/quotation`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadRepairImages(id: string, payload: UploadRepairImagesPayload): Promise<VendorAssignmentItem> {
  return apiRequest<VendorAssignmentItem>(`/vendors/assignments/${id}/repair-images`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadCompletionReport(id: string, payload: UploadCompletionReportPayload): Promise<VendorAssignmentItem> {
  return apiRequest<VendorAssignmentItem>(`/vendors/assignments/${id}/completion-report`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadInvoice(id: string, payload: UploadInvoicePayload): Promise<VendorAssignmentItem> {
  return apiRequest<VendorAssignmentItem>(`/vendors/assignments/${id}/invoice`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
