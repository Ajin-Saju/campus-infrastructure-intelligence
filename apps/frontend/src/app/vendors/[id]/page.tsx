'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchVendorById, VendorItem } from '../../../lib/vendor-client';
import {
  Briefcase,
  ArrowLeft,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  Receipt,
  Wrench,
  Loader2,
  AlertCircle,
  FileText,
  DollarSign,
} from 'lucide-react';

export default function VendorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params?.id as string;

  const [vendor, setVendor] = useState<VendorItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendorId) {
      loadVendorDetails();
    }
  }, [vendorId]);

  const loadVendorDetails = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchVendorById(vendorId);
      setVendor(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendor details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Loading Vendor Details...</span>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Vendor Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'The requested vendor profile does not exist.'}</p>
          <Link
            href="/vendors"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vendor Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const assignments = vendor.vendorAssignments || [];
  const completedAssignments = assignments.filter((a) => a.status === 'COMPLETED' || a.status === 'INVOICED');
  const totalBilled = assignments.reduce((acc, a) => acc + Number(a.invoiceAmount || a.contractAmount || 0), 0);

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/vendors"
                className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Link href="/vendors" className="text-xs font-medium text-slate-400 hover:text-indigo-400">
                    Vendor Dashboard
                  </Link>
                  <span className="text-slate-600">/</span>
                  <span className="text-xs font-semibold text-indigo-400">{vendor.companyName}</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mt-0.5">
                  {vendor.companyName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-xl">
                <Star className="w-4 h-4 fill-amber-400" /> {vendor.rating || 5.0} Performance Rating
              </span>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Primary Contact
              </span>
              <p className="font-bold text-white">{vendor.contactName || 'Representative'}</p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email
              </span>
              <p className="font-bold text-white truncate">{vendor.email}</p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone
              </span>
              <p className="font-bold text-white">{vendor.phone}</p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Tax ID / GSTIN
              </span>
              <p className="font-bold text-white">{vendor.taxId || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Stats Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
            <span className="text-slate-400">Total Repair Tasks</span>
            <p className="text-2xl font-bold text-white">{assignments.length}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
            <span className="text-slate-400">Completed Jobs</span>
            <p className="text-2xl font-bold text-emerald-400">{completedAssignments.length}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
            <span className="text-slate-400">Total Billed / Contracts</span>
            <p className="text-2xl font-bold text-purple-400">${totalBilled.toLocaleString()}</p>
          </div>
        </div>

        {/* Assignment History Section */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-400" />
            Vendor Task Assignment History ({assignments.length})
          </h2>

          <div className="space-y-3">
            {assignments.length === 0 ? (
              <p className="text-xs text-slate-400">No repair assignments recorded for this vendor.</p>
            ) : (
              assignments.map((a) => (
                <div key={a.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-400">{a.task?.taskNumber}</span>
                      <span className="font-semibold text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {a.status}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-400">
                      ${Number(a.contractAmount || a.invoiceAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <p className="font-bold text-white text-sm">{a.task?.title}</p>
                  {a.task?.asset && (
                    <p className="text-slate-400">
                      Asset: {a.task.asset.name} ({a.task.asset.assetTag})
                    </p>
                  )}
                  {a.completionNotes && (
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 mt-2">
                      <span className="font-semibold text-emerald-400 block">Completion Notes:</span>
                      {a.completionNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
