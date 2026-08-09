'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import {
  fetchVendors,
  fetchVendorAssignments,
  createVendor,
  uploadQuotation,
  uploadRepairImages,
  uploadCompletionReport,
  uploadInvoice,
  VendorItem,
  VendorAssignmentItem,
} from '../../lib/vendor-client';
import {
  Building2,
  PlusCircle,
  Search,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  Briefcase,
  Upload,
  Image as ImageIcon,
  CheckSquare,
  Receipt,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Star,
  ExternalLink,
  Loader2,
  X,
  Wrench,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function VendorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'VENDOR']}>
      <VendorDashboardPageContent />
    </ProtectedRoute>
  );
}

function VendorDashboardPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [assignments, setAssignments] = useState<VendorAssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'vendors' | 'assigned' | 'completed' | 'invoices'>('vendors');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<VendorAssignmentItem | null>(null);

  // Action Modals
  const [modalType, setModalType] = useState<'quotation' | 'repair-images' | 'completion' | 'invoice' | null>(null);

  // Form Fields for Registration
  const [regCompany, setRegCompany] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regTaxId, setRegTaxId] = useState('');
  const [regServiceTypes, setRegServiceTypes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action Modal Form Fields
  const [quotationAmount, setQuotationAmount] = useState('');
  const [quotationNotes, setQuotationNotes] = useState('');
  const [repairImageUrlInput, setRepairImageUrlInput] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PENDING');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [vData, aData] = await Promise.all([
        fetchVendors(),
        fetchVendorAssignments(),
      ]);
      setVendors(vData);
      setAssignments(aData);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendor data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCompany.trim() || !regEmail.trim() || !regPhone.trim()) return;

    setIsSubmitting(true);
    try {
      await createVendor({
        companyName: regCompany.trim(),
        contactName: regContact.trim() || undefined,
        email: regEmail.trim(),
        phone: regPhone.trim(),
        address: regAddress.trim() || undefined,
        taxId: regTaxId.trim() || undefined,
        serviceTypes: regServiceTypes ? regServiceTypes.split(',').map((s) => s.trim()) : [],
      });
      setIsRegisterModalOpen(false);
      setRegCompany('');
      setRegContact('');
      setRegEmail('');
      setRegPhone('');
      setRegAddress('');
      setRegTaxId('');
      setRegServiceTypes('');
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to register vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !modalType) return;

    setIsSubmitting(true);
    try {
      if (modalType === 'quotation') {
        await uploadQuotation(selectedAssignment.id, {
          quotationAmount: parseFloat(quotationAmount) || 0,
          quotationNotes: quotationNotes.trim() || undefined,
          quotationUrl: 'https://example.com/quotation-document.pdf',
        });
      } else if (modalType === 'repair-images') {
        const urls = repairImageUrlInput
          ? repairImageUrlInput.split(',').map((s) => s.trim())
          : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'];
        await uploadRepairImages(selectedAssignment.id, { imageUrls: urls });
      } else if (modalType === 'completion') {
        await uploadCompletionReport(selectedAssignment.id, {
          completionNotes: completionNotes.trim() || 'Repair completed successfully.',
          completionReportUrl: 'https://example.com/completion-report.pdf',
        });
      } else if (modalType === 'invoice') {
        await uploadInvoice(selectedAssignment.id, {
          invoiceNumber: invoiceNumber.trim() || `INV-${Date.now().toString().slice(-6)}`,
          invoiceAmount: parseFloat(invoiceAmount) || selectedAssignment.contractAmount || 0,
          invoiceUrl: 'https://example.com/invoice-doc.pdf',
          paymentStatus,
        });
      }

      setModalType(null);
      setSelectedAssignment(null);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAssignmentStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">Requested</span>;
      case 'QUOTATION_SUBMITTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">Quotation Submitted</span>;
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">In Progress</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">Completed</span>;
      case 'INVOICED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">Invoiced</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  const totalInvoicedAmount = assignments.reduce((acc, a) => acc + Number(a.invoiceAmount || a.contractAmount || 0), 0);
  const completedCount = assignments.filter((a) => a.status === 'COMPLETED' || a.status === 'INVOICED').length;
  const activeAssignments = assignments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'INVOICED');

  const filteredVendors = vendors.filter(
    (v) =>
      v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.contactName && v.contactName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Loading Vendor Management Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xs font-medium text-slate-400 hover:text-indigo-400">
                Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-semibold text-indigo-400">Vendor Management</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-400" />
              Vendor Management Hub
            </h1>
            <p className="text-xs text-slate-400">
              Contractor registration, task assignments, quotations, repair images, completion reports & invoicing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Register Vendor
            </button>
            <Link
              href="/vendors/assign"
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Wrench className="w-4 h-4" />
              Assign Vendor Task
            </Link>
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Registered Vendors
            </span>
            <p className="text-2xl font-bold text-white">{vendors.length}</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Active Repairs
            </span>
            <p className="text-2xl font-bold text-amber-300">{activeAssignments.length}</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Completed Repairs
            </span>
            <p className="text-2xl font-bold text-emerald-300">{completedCount}</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-purple-400" />
              Total Invoiced
            </span>
            <p className="text-2xl font-bold text-purple-300">${totalInvoicedAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('vendors')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'vendors'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Registered Vendors ({vendors.length})
              </button>
              <button
                onClick={() => setActiveTab('assigned')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'assigned'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Assigned Repairs ({activeAssignments.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'completed'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Completed Repairs ({completedCount})
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'invoices'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Invoices & Financials
              </button>
            </div>

            {activeTab === 'vendors' && (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* TAB 1: Registered Vendors */}
          {activeTab === 'vendors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVendors.length === 0 ? (
                <p className="text-xs text-slate-400 p-4">No registered vendors found.</p>
              ) : (
                filteredVendors.map((v) => (
                  <div
                    key={v.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">
                          {v.companyName}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          {v.contactName || 'Primary Representative'}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <Star className="w-3 h-3 fill-amber-400" /> {v.rating || '5.0'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{v.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{v.phone}</span>
                      </div>
                      {v.taxId && (
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>Tax ID / GST: {v.taxId}</span>
                        </div>
                      )}
                    </div>

                    {v.serviceTypes && Array.isArray(v.serviceTypes) && v.serviceTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {v.serviceTypes.map((st, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono font-medium px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-md"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {v.vendorAssignments?.length || 0} Total Repairs
                      </span>
                      <Link
                        href={`/vendors/${v.id}`}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Assigned Repairs */}
          {activeTab === 'assigned' && (
            <div className="space-y-3">
              {activeAssignments.length === 0 ? (
                <p className="text-xs text-slate-400 p-4">No active vendor repair assignments.</p>
              ) : (
                activeAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          {a.task?.taskNumber || 'TASK'}
                        </span>
                        {getAssignmentStatusBadge(a.status)}
                        <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                          {a.vendor?.companyName}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{a.task?.title}</h4>
                      {a.task?.asset && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-amber-400" />
                          Asset: {a.task.asset.name} ({a.task.asset.assetTag})
                        </p>
                      )}
                    </div>

                    {/* Action Controls for Vendors */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedAssignment(a);
                          setQuotationAmount(a.quotationAmount?.toString() || a.contractAmount?.toString() || '');
                          setQuotationNotes(a.quotationNotes || '');
                          setModalType('quotation');
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        Quotation
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAssignment(a);
                          setModalType('repair-images');
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                        Repair Images
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAssignment(a);
                          setCompletionNotes(a.completionNotes || '');
                          setModalType('completion');
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        Completion Report
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAssignment(a);
                          setInvoiceAmount(a.invoiceAmount?.toString() || a.contractAmount?.toString() || '');
                          setInvoiceNumber(a.invoiceNumber || '');
                          setModalType('invoice');
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                      >
                        <Receipt className="w-3.5 h-3.5 text-purple-400" />
                        Invoice
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Completed Repairs */}
          {activeTab === 'completed' && (
            <div className="space-y-3">
              {assignments.filter((a) => a.status === 'COMPLETED' || a.status === 'INVOICED').length === 0 ? (
                <p className="text-xs text-slate-400 p-4">No completed vendor repairs yet.</p>
              ) : (
                assignments
                  .filter((a) => a.status === 'COMPLETED' || a.status === 'INVOICED')
                  .map((a) => (
                    <div key={a.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-emerald-400">{a.task?.taskNumber}</span>
                          <span className="text-xs font-bold text-white">{a.vendor?.companyName}</span>
                          {getAssignmentStatusBadge(a.status)}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          Completed: {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : 'Yes'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{a.task?.title}</h4>
                      {a.completionNotes && (
                        <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <span className="font-semibold text-emerald-400 block mb-0.5">Completion Report Notes:</span>
                          {a.completionNotes}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* TAB 4: Invoices & Financials */}
          {activeTab === 'invoices' && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Vendor</th>
                      <th className="p-3">Task #</th>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Contract / Amount</th>
                      <th className="p-3">Payment Status</th>
                      <th className="p-3">Invoiced Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-semibold text-white">{a.vendor?.companyName}</td>
                        <td className="p-3 font-mono text-indigo-400">{a.task?.taskNumber}</td>
                        <td className="p-3 font-mono text-purple-400">{a.invoiceNumber || 'N/A'}</td>
                        <td className="p-3 font-bold text-emerald-400">
                          ${Number(a.invoiceAmount || a.contractAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {a.paymentStatus || 'PENDING'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono">
                          {a.invoicedAt ? new Date(a.invoicedAt).toLocaleDateString() : 'Pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Vendor Registration */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                Register New Contractor / Vendor
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterVendor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  placeholder="e.g. Apex HVAC Solutions"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={regContact}
                    onChange={(e) => setRegContact(e.target.value)}
                    placeholder="e.g. John Miller"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Tax ID / GSTIN</label>
                  <input
                    type="text"
                    value={regTaxId}
                    onChange={(e) => setRegTaxId(e.target.value)}
                    placeholder="TAX-889412"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="service@vendor.com"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1-555-0199"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Service Specialties (comma separated)</label>
                <input
                  type="text"
                  value={regServiceTypes}
                  onChange={(e) => setRegServiceTypes(e.target.value)}
                  placeholder="HVAC, Electrical, CCTV, Plumbing"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address</label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="100 Tech Industrial Park, Campus Road"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg"
                >
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal (Quotation / Repair Images / Completion Report / Invoice) */}
      {modalType && selectedAssignment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white capitalize">
                {modalType.replace('-', ' ')} Upload - {selectedAssignment.task?.taskNumber}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-3 text-xs">
              {modalType === 'quotation' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Quotation Amount ($) *</label>
                    <input
                      type="number"
                      required
                      value={quotationAmount}
                      onChange={(e) => setQuotationAmount(e.target.value)}
                      placeholder="1250"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Quotation Notes</label>
                    <textarea
                      rows={3}
                      value={quotationNotes}
                      onChange={(e) => setQuotationNotes(e.target.value)}
                      placeholder="Labor, diagnostic & replacement module estimate..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                </>
              )}

              {modalType === 'repair-images' && (
                <div>
                  <label className="block text-slate-400 mb-1">Image URLs (comma separated)</label>
                  <input
                    type="text"
                    value={repairImageUrlInput}
                    onChange={(e) => setRepairImageUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..., https://..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              )}

              {modalType === 'completion' && (
                <div>
                  <label className="block text-slate-400 mb-1">Completion Notes *</label>
                  <textarea
                    rows={4}
                    required
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Describe repair actions performed..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              )}

              {modalType === 'invoice' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Invoice Number *</label>
                    <input
                      type="text"
                      required
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="INV-2026-0891"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Invoice Amount ($) *</label>
                    <input
                      type="number"
                      required
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(e.target.value)}
                      placeholder="1250"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl"
                >
                  {isSubmitting ? 'Uploading...' : 'Submit Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
