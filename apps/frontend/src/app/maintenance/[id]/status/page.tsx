'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Wrench,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  ImageIcon,
  AlertTriangle,
  Send,
  Layers,
} from 'lucide-react';
import {
  fetchMaintenanceTaskById,
  updateMaintenanceTaskStatus,
  MaintenanceTaskItem,
  TaskStatusType,
} from '../../../../lib/maintenance-client';

const ALLOWED_NEXT_STATUSES: Record<TaskStatusType, { status: TaskStatusType; label: string }[]> = {
  PENDING: [
    { status: 'AI_CATEGORIZED', label: 'AI Categorized' },
    { status: 'ADMIN_REVIEW', label: 'Admin Review' },
    { status: 'ASSIGNED', label: 'Assigned' },
    { status: 'CANCELLED', label: 'Cancelled' },
  ],
  AI_CATEGORIZED: [
    { status: 'ADMIN_REVIEW', label: 'Admin Review' },
    { status: 'ASSIGNED', label: 'Assigned' },
    { status: 'CANCELLED', label: 'Cancelled' },
  ],
  ADMIN_REVIEW: [
    { status: 'ASSIGNED', label: 'Assigned' },
    { status: 'CANCELLED', label: 'Cancelled' },
  ],
  ASSIGNED: [
    { status: 'ACCEPTED', label: 'Accepted' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'CANCELLED', label: 'Cancelled' },
  ],
  ACCEPTED: [
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'WAITING_FOR_PARTS', label: 'Waiting For Parts' },
    { status: 'CANCELLED', label: 'Cancelled' },
  ],
  IN_PROGRESS: [
    { status: 'WAITING_FOR_PARTS', label: 'Waiting For Parts' },
    { status: 'COMPLETED', label: 'Completed' },
    { status: 'CANCELLED', label: 'Cancelled' },
  ],
  WAITING_FOR_PARTS: [
    { status: 'IN_PROGRESS', label: 'Resume In Progress' },
    { status: 'COMPLETED', label: 'Completed' },
    { status: 'CANCELLED', label: 'Cancelled' },
  ],
  COMPLETED: [{ status: 'CLOSED', label: 'Closed' }],
  CLOSED: [],
  CANCELLED: [],
};

export default function UpdateMaintenanceStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [task, setTask] = useState<MaintenanceTaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [targetStatus, setTargetStatus] = useState<TaskStatusType | ''>('');
  const [notes, setNotes] = useState('');
  const [progressPercentage, setProgressPercentage] = useState<number>(50);
  const [costIncurred, setCostIncurred] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [downtimeHours, setDowntimeHours] = useState('');
  const [repairImageUrl, setRepairImageUrl] = useState('');

  useEffect(() => {
    loadTask();
  }, [id]);

  async function loadTask() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMaintenanceTaskById(id);
      setTask(data);
      const options = ALLOWED_NEXT_STATUSES[data.status] || [];
      if (options.length > 0) {
        setTargetStatus(options[0].status);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetStatus) return;

    setIsSubmitting(true);
    try {
      await updateMaintenanceTaskStatus(id, {
        status: targetStatus,
        notes: notes.trim() || undefined,
        progressPercentage: Number(progressPercentage),
        costIncurred: costIncurred ? parseFloat(costIncurred) : undefined,
        partsReplaced: partsReplaced.trim() || undefined,
        downtimeHours: downtimeHours ? parseFloat(downtimeHours) : undefined,
        repairImageUrl: repairImageUrl.trim() || undefined,
      });

      router.push(`/maintenance/${id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Loading task status page...</span>
        </div>
      </main>
    );
  }

  if (error || !task) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center gap-4">
        <div className="p-6 bg-rose-950/20 border border-rose-500/30 text-rose-400 rounded-2xl max-w-md text-center">
          <p className="font-semibold">{error || 'Task not found'}</p>
        </div>
        <Link href="/maintenance" className="text-xs text-indigo-400 hover:underline">
          Return to Maintenance Dashboard
        </Link>
      </main>
    );
  }

  const allowedOptions = ALLOWED_NEXT_STATUSES[task.status] || [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center gap-4">
          <Link
            href={`/maintenance/${task.id}`}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                {task.taskNumber}
              </span>
              <h1 className="text-xl font-bold text-slate-100">Update Workflow Status</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Current Status:{' '}
              <span className="font-bold text-indigo-400">{task.status}</span>
            </p>
          </div>
        </div>

        {/* Update Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {allowedOptions.length === 0 ? (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-teal-400 mx-auto" />
              <p className="font-bold text-slate-200">Workflow Finalized</p>
              <p className="text-xs text-slate-400">
                This task is in state <span className="text-indigo-400 font-semibold">{task.status}</span> and cannot be transitioned further.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              {/* Select Next Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Transition Status To *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allowedOptions.map((opt) => (
                    <button
                      key={opt.status}
                      type="button"
                      onClick={() => setTargetStatus(opt.status)}
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        targetStatus === opt.status
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-semibold text-xs">{opt.label}</span>
                      <span className="text-[10px] font-mono opacity-60">{opt.status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Work Log */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Update Notes / Work Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe progress made, inspection notes, or reasons for status update..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                  <span>Task Completion Progress</span>
                  <span className="text-indigo-400">{progressPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-950 border border-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Cost & Replaced Parts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Cost Incurred ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costIncurred}
                    onChange={(e) => setCostIncurred(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-amber-400" /> Downtime (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 2.5"
                    value={downtimeHours}
                    onChange={(e) => setDowntimeHours(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Parts Replaced (for Repair History log) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-orange-400" /> Parts Replaced (Auto-logs Repair History)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Capacitor 45uF, 2x Copper Valves"
                  value={partsReplaced}
                  onChange={(e) => setPartsReplaced(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Upload Repair Image URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-cyan-400" /> Upload Repair Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/repair-photo.jpg"
                  value={repairImageUrl}
                  onChange={(e) => setRepairImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <Link
                  href={`/maintenance/${task.id}`}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || !targetStatus}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Update Status'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
