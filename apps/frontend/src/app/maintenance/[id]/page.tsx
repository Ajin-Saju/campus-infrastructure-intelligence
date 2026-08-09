'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Wrench,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  History,
  Send,
  Plus,
  Box,
  Building2,
  User,
  ShieldCheck,
  CheckCheck,
  Package,
  XCircle,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import {
  fetchMaintenanceTaskById,
  assignTechnician,
  addMaintenanceTaskComment,
  MaintenanceTaskItem,
  TaskStatusType,
} from '../../../lib/maintenance-client';
import { fetchUsers, UserItem } from '../../../lib/users-client';

const WORKFLOW_SEQUENCE: { status: TaskStatusType; label: string }[] = [
  { status: 'PENDING', label: 'Pending' },
  { status: 'AI_CATEGORIZED', label: 'AI Categorized' },
  { status: 'ADMIN_REVIEW', label: 'Admin Review' },
  { status: 'ASSIGNED', label: 'Assigned' },
  { status: 'ACCEPTED', label: 'Accepted' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'WAITING_FOR_PARTS', label: 'Waiting For Parts' },
  { status: 'COMPLETED', label: 'Completed' },
  { status: 'CLOSED', label: 'Closed' },
];

export default function MaintenanceTaskDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [task, setTask] = useState<MaintenanceTaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Assign Tech modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadTask();
  }, [id]);

  async function loadTask() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMaintenanceTaskById(id);
      setTask(data);
      if (data.assignedToId) {
        setSelectedTechId(data.assignedToId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenAssignModal() {
    setShowAssignModal(true);
    if (users.length === 0) {
      try {
        const res = await fetchUsers();
        setUsers(res.data || []);
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    }
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTechId) return;

    setIsAssigning(true);
    try {
      const updated = await assignTechnician(id, selectedTechId);
      setTask(updated);
      setShowAssignModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to assign technician');
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const updated = await addMaintenanceTaskComment(id, newComment.trim());
      setTask(updated);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  }

  function getStepIndex(status: TaskStatusType) {
    const idx = WORKFLOW_SEQUENCE.findIndex((s) => s.status === status);
    return idx >= 0 ? idx : 0;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Loading task details...</span>
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

  const currentStepIdx = getStepIndex(task.status);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-4">
            <Link
              href="/maintenance"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                  {task.taskNumber}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
                  {task.title}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Created {new Date(task.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAssignModal}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              <UserCheck className="h-4 w-4 text-indigo-400" /> Assign Technician
            </button>
            <Link
              href={`/maintenance/${task.id}/status`}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Wrench className="h-4 w-4" /> Update Status
            </Link>
          </div>
        </div>

        {/* Visual Workflow Stepper */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" /> Workflow Pipeline Progress
          </h2>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center min-w-max gap-2 text-xs">
              {WORKFLOW_SEQUENCE.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isCancelled = task.status === 'CANCELLED';

                return (
                  <div key={step.status} className="flex items-center gap-2">
                    <div
                      className={`px-3 py-2 rounded-xl border flex items-center gap-2 font-medium transition-all ${
                        isCurrent
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/30'
                          : isPassed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : isCancelled
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 opacity-60'
                          : 'bg-slate-950/60 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCurrent
                            ? 'bg-indigo-500 text-white'
                            : isPassed
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPassed ? '✓' : idx + 1}
                      </div>
                      <span>{step.label}</span>
                    </div>

                    {idx < WORKFLOW_SEQUENCE.length - 1 && (
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 ${
                          isPassed ? 'text-emerald-500' : 'text-slate-700'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Task Overview & Activity Logs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Task Information
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {task.description || 'No additional description provided.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Priority</span>
                  <span className="font-bold text-slate-200">{task.priority}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Task Type</span>
                  <span className="font-medium text-slate-300">{task.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Est. / Act. Cost</span>
                  <span className="font-semibold text-emerald-400">
                    ${task.estimatedCost || '0'} / ${task.actualCost || '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Workflow Activity Timeline */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-400" /> Maintenance Activity Logs
              </h2>

              {!task.updates || task.updates.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No status updates logged yet.</p>
              ) : (
                <div className="space-y-4 border-l-2 border-slate-800 pl-4">
                  {task.updates.map((update) => (
                    <div key={update.id} className="relative space-y-1">
                      <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-slate-900" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-300">
                          {update.statusFrom ? `${update.statusFrom} → ` : ''}
                          {update.statusTo}
                        </span>
                        <span className="text-slate-500">
                          {new Date(update.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{update.notes}</p>
                      {update.updatedBy && (
                        <span className="text-[11px] text-slate-400 block">
                          Logged by {update.updatedBy.firstName} {update.updatedBy.lastName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Repair Images */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-cyan-400" /> Repair Images & Attachments
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {task.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center"
                    >
                      <img
                        src={att.fileUrl}
                        alt={att.fileName}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                      <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 px-2 py-0.5 rounded text-slate-300">
                        {att.fileName}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-400" /> Task Comments
              </h2>

              <div className="space-y-3">
                {task.issueReport?.comments?.map((comment) => (
                  <div key={comment.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">
                        {comment.user.firstName} {comment.user.lastName}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{comment.content}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Type a comment or update note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="h-3 w-3" /> Send
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Connected Relations & Repair History */}
          <div className="space-y-6">
            {/* Technician Info */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Assigned Technician
              </h2>
              {task.assignedTo ? (
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-100 text-sm">
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </p>
                  <p className="text-slate-400">{task.assignedTo.email}</p>
                  {task.assignedTo.phone && (
                    <p className="text-slate-400">{task.assignedTo.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No technician assigned yet.</p>
              )}
            </div>

            {/* Asset Information */}
            {task.asset && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Box className="h-4 w-4 text-emerald-400" /> Target Asset
                </h2>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-100">{task.asset.name}</p>
                  <p className="font-mono text-emerald-400">Tag: {task.asset.assetTag}</p>
                  {task.asset.building && (
                    <p className="text-slate-400">
                      Location: {task.asset.building.name} {task.asset.room ? `, Room ${task.asset.room.roomNumber}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Connected Issue Report */}
            {task.issueReport && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-rose-400" /> Issue Report
                </h2>
                <div className="text-xs space-y-1">
                  <p className="font-mono text-rose-400 font-bold">{task.issueReport.ticketNumber}</p>
                  <p className="font-semibold text-slate-200">{task.issueReport.title}</p>
                </div>
              </div>
            )}

            {/* Repair History Logs */}
            {task.repairHistories && task.repairHistories.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="h-4 w-4 text-amber-400" /> Repair History
                </h2>
                <div className="space-y-3 divide-y divide-slate-800/60">
                  {task.repairHistories.map((rh) => (
                    <div key={rh.id} className="pt-2 text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-slate-300">
                        <span>{new Date(rh.repairDate).toLocaleDateString()}</span>
                        <span className="text-emerald-400">${rh.cost}</span>
                      </div>
                      <p className="text-slate-400">{rh.description}</p>
                      {rh.partsReplaced && (
                        <p className="text-[11px] text-amber-300">Replaced: {rh.partsReplaced}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Technician Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-400" /> Assign Technician
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Select User / Technician
                </label>
                <select
                  required
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose User --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !selectedTechId}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
