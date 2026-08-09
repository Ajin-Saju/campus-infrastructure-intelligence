'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Package,
  CheckCheck,
  XCircle,
  FileText,
  User,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  fetchMaintenanceTasks,
  createMaintenanceTask,
  MaintenanceTaskItem,
  TaskStatusType,
  IssuePriorityType,
  TaskType,
} from '../../lib/maintenance-client';
import { fetchUsers, UserItem } from '../../lib/users-client';

const WORKFLOW_STEPS: { key: TaskStatusType | 'ALL'; label: string; color: string }[] = [
  { key: 'ALL', label: 'All Tasks', color: 'bg-slate-700 text-slate-200' },
  { key: 'PENDING', label: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { key: 'AI_CATEGORIZED', label: 'AI Categorized', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { key: 'ADMIN_REVIEW', label: 'Admin Review', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { key: 'ASSIGNED', label: 'Assigned', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { key: 'ACCEPTED', label: 'Accepted', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { key: 'WAITING_FOR_PARTS', label: 'Waiting For Parts', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { key: 'COMPLETED', label: 'Completed', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  { key: 'CLOSED', label: 'Closed', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
];

function MaintenanceDashboardContent() {
  const searchParams = useSearchParams();
  const assignedParam = searchParams.get('assigned') === 'true';

  const [tasks, setTasks] = useState<MaintenanceTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [activeTab, setActiveTab] = useState<TaskStatusType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as IssuePriorityType,
    type: 'CORRECTIVE' as TaskType,
    assignedToId: '',
    estimatedCost: '',
  });

  useEffect(() => {
    loadTasks();
  }, [activeTab, page, priorityFilter, assignedParam]);

  useEffect(() => {
    fetchUsers()
      .then((res) => setUsers(res.data || []))
      .catch(() => {});
  }, []);

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMaintenanceTasks({
        page,
        limit: 10,
        status: activeTab === 'ALL' ? undefined : activeTab,
        priority: priorityFilter === 'ALL' ? undefined : (priorityFilter as IssuePriorityType),
        search: searchQuery || undefined,
        assigned: assignedParam ? true : undefined,
      });
      setTasks(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load maintenance tasks');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadTasks();
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.title.trim()) return;

    setIsSubmitting(true);
    try {
      await createMaintenanceTask({
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        priority: createForm.priority,
        type: createForm.type,
        assignedToId: createForm.assignedToId || undefined,
        estimatedCost: createForm.estimatedCost ? parseFloat(createForm.estimatedCost) : undefined,
      });
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        type: 'CORRECTIVE',
        assignedToId: '',
        estimatedCost: '',
      });
      setPage(1);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  }

  function getStatusBadge(status: TaskStatusType) {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1"><Clock className="h-3 w-3"/> Pending</span>;
      case 'AI_CATEGORIZED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1"><Layers className="h-3 w-3"/> AI Categorized</span>;
      case 'ADMIN_REVIEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1"><FileText className="h-3 w-3"/> Admin Review</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1"><UserCheck className="h-3 w-3"/> Assigned</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Accepted</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 animate-pulse"><Wrench className="h-3 w-3"/> In Progress</span>;
      case 'WAITING_FOR_PARTS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1"><Package className="h-3 w-3"/> Waiting For Parts</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1"><CheckCheck className="h-3 w-3"/> Completed</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30 flex items-center gap-1"><CheckCheck className="h-3 w-3"/> Closed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1"><XCircle className="h-3 w-3"/> Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">{status}</span>;
    }
  }

  function getPriorityBadge(priority: IssuePriorityType) {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-700 text-slate-300">LOW</span>;
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="h-6 w-6 text-indigo-400" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Maintenance Management
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Multi-stage workflow task control, technician assignment & repair history
              </p>
              {assignedParam && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5" /> Filter: Assigned Tasks Only
                  <Link href="/maintenance" className="ml-1 underline hover:text-white">Show All Tasks</Link>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="h-4 w-4" /> Create Task
          </button>
        </div>

        {/* Workflow Stepper Bar Visualizer */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max text-xs font-semibold">
            {[
              'Pending',
              'AI Categorized',
              'Admin Review',
              'Assigned',
              'Accepted',
              'In Progress',
              'Waiting For Parts',
              'Completed',
              'Closed',
            ].map((stepName, idx, arr) => (
              <div key={stepName} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  {stepName}
                </span>
                {idx < arr.length - 1 && <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Filters & Workflow Tabs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {WORKFLOW_STEPS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all border ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Priority Filter Controls */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search task number, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span>Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900">All</option>
                  <option value="CRITICAL" className="bg-slate-900">Critical</option>
                  <option value="HIGH" className="bg-slate-900">High</option>
                  <option value="MEDIUM" className="bg-slate-900">Medium</option>
                  <option value="LOW" className="bg-slate-900">Low</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 transition-colors"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        {/* Task List Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
              <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <span>Loading maintenance tasks...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 bg-rose-950/20">
              <p className="font-semibold">{error}</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Wrench className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="font-medium text-slate-300">No maintenance tasks found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No tasks match the active filters. Create a new task or switch status tabs.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Task #</th>
                    <th className="p-4">Title & Connected Ref</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Workflow Status</th>
                    <th className="p-4">Assigned Technician</th>
                    <th className="p-4">Created</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono text-xs text-indigo-400 font-bold">
                        {task.taskNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-100">{task.title}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          {task.asset && (
                            <span className="text-emerald-400 font-mono text-[11px]">
                              Asset: {task.asset.assetTag}
                            </span>
                          )}
                          {task.issueReport && (
                            <span className="text-cyan-400 font-mono text-[11px]">
                              Issue: {task.issueReport.ticketNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{getPriorityBadge(task.priority)}</td>
                      <td className="p-4">{getStatusBadge(task.status)}</td>
                      <td className="p-4 text-xs">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <User className="h-3.5 w-3.5 text-indigo-400" />
                            <span>
                              {task.assignedTo.firstName} {task.assignedTo.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/maintenance/${task.id}`}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors flex items-center gap-1"
                          >
                            Details <ArrowRight className="h-3 w-3" />
                          </Link>
                          <Link
                            href={`/maintenance/${task.id}/status`}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Update
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
              <span>
                Showing page {page} of {totalPages} ({totalCount} total tasks)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" /> Create Maintenance Task
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Replace HVAC Filter in Lab 102"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed work instructions or requirements..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, priority: e.target.value as IssuePriorityType })
                    }
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Task Type
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, type: e.target.value as TaskType })
                    }
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CORRECTIVE">Corrective</option>
                    <option value="PREVENTIVE">Preventive</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Assign Technician
                  </label>
                  <select
                    value={createForm.assignedToId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, assignedToId: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.role?.name || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Estimated Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={createForm.estimatedCost}
                    onChange={(e) => setCreateForm({ ...createForm, estimatedCost: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-xs shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MaintenanceDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading maintenance dashboard...</span>
          </div>
        </main>
      }
    >
      <MaintenanceDashboardContent />
    </Suspense>
  );
}
