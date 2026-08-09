'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchVendors, assignVendorToTask, VendorItem } from '../../../lib/vendor-client';
import { fetchMaintenanceTasks, MaintenanceTaskItem } from '../../../lib/maintenance-client';
import {
  Briefcase,
  ArrowLeft,
  Wrench,
  DollarSign,
  FileText,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export default function VendorAssignmentPage() {
  const router = useRouter();

  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [vData, tData] = await Promise.all([
        fetchVendors(),
        fetchMaintenanceTasks({ limit: 100 }),
      ]);
      const taskList = Array.isArray(tData) ? tData : (tData as any)?.data || [];
      setVendors(vData);
      setTasks(taskList);
      if (vData.length > 0) setSelectedVendorId(vData[0].id);
      if (taskList.length > 0) setSelectedTaskId(taskList[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load options for vendor assignment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId || !selectedTaskId) return;

    setIsSubmitting(true);
    try {
      await assignVendorToTask({
        vendorId: selectedVendorId,
        taskId: selectedTaskId,
        contractAmount: contractAmount ? parseFloat(contractAmount) : undefined,
        notes: notes.trim() || undefined,
      });
      router.push('/vendors');
    } catch (err: any) {
      alert(err.message || 'Failed to assign vendor to task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Loading Vendor Assignment Form...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
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
                <span className="text-xs font-semibold text-indigo-400">New Task Assignment</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mt-0.5">
                Assign Vendor to Maintenance Task
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Vendor *</label>
              <select
                required
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName} ({v.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Maintenance Task *</label>
              <select
                required
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.taskNumber}: {t.title} ({t.priority})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Estimated Contract Amount ($)</label>
              <input
                type="number"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
                placeholder="1500"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Assignment Scope & Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide contract details, service scope, expected timeline..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Link
                href="/vendors"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isSubmitting ? 'Assigning...' : 'Confirm Vendor Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
