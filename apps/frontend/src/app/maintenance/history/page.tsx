'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import {
  fetchRepairHistory,
  fetchMaintenanceTasks,
  RepairHistoryItem,
  MaintenanceTaskItem,
} from '../../../lib/maintenance-client';
import {
  Wrench,
  Search,
  Clock,
  DollarSign,
  Box,
  FileText,
  Calendar,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function RepairHistoryPage() {
  const [historyList, setHistoryList] = useState<RepairHistoryItem[]>([]);
  const [completedTasks, setCompletedTasks] = useState<MaintenanceTaskItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'repairs' | 'completed-tasks'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (searchQuery = search) => {
    setLoading(true);
    try {
      const [historyData, tasksRes] = await Promise.all([
        fetchRepairHistory({ search: searchQuery }),
        fetchMaintenanceTasks({ limit: 100 }),
      ]);
      setHistoryList(historyData);
      setCompletedTasks(tasksRes.data.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED'));
    } catch (err) {
      console.error('Failed to load repair history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(search);
  };

  // Aggregated Stats
  const totalCost = historyList.reduce((acc, item) => acc + (Number(item.cost) || 0), 0) +
    completedTasks.reduce((acc, t) => acc + (Number(t.actualCost) || 0), 0);

  const totalDowntime = historyList.reduce((acc, item) => acc + (Number(item.downtimeHours) || 0), 0);

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'TECHNICIAN']}>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Header Banner */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                <Wrench className="w-3.5 h-3.5" /> Maintenance Intelligence
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Repair & Maintenance History</h1>
              <p className="text-xs text-slate-400 max-w-2xl">
                Comprehensive audit trail of completed maintenance tasks, equipment repairs, parts replaced, downtime logs, and financial expenditures across campus assets.
              </p>
            </div>
            <button
              onClick={() => loadData(search)}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Logs
            </button>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Repairs</span>
              <span className="text-2xl font-black text-white">{historyList.length} Logs</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Closed Tasks</span>
              <span className="text-2xl font-black text-white">{completedTasks.length} Tasks</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Cost</span>
              <span className="text-2xl font-black text-white">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Asset Downtime</span>
              <span className="text-2xl font-black text-white">{totalDowntime} Hours</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search history by asset, tag, description, or replaced parts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              All Records ({historyList.length + completedTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('repairs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'repairs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              Parts & Repair Logs ({historyList.length})
            </button>
            <button
              onClick={() => setActiveTab('completed-tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'completed-tasks' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              Completed Tasks ({completedTasks.length})
            </button>
          </div>
        </div>

        {/* Content Table / Cards */}
        {loading ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading maintenance repair history...</p>
          </div>
        ) : historyList.length === 0 && completedTasks.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <Wrench className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Maintenance History Records Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No repair logs or completed maintenance tasks match your query. Completed tasks and logged repairs automatically appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Repair History Logs Section */}
            {(activeTab === 'all' || activeTab === 'repairs') && historyList.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-indigo-400" /> Equipment Repair Logs
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {historyList.length} Entries
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-4">Repair Date</th>
                        <th className="p-4">Asset / Equipment</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Parts Replaced</th>
                        <th className="p-4">Performed By</th>
                        <th className="p-4 text-right">Cost ($)</th>
                        <th className="p-4 text-right">Downtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {historyList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-semibold text-white whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(item.repairDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </td>
                          <td className="p-4">
                            {item.asset ? (
                              <div>
                                <Link
                                  href={`/assets/${item.asset.id}`}
                                  className="font-bold text-white hover:text-indigo-400 transition-colors"
                                >
                                  {item.asset.name}
                                </Link>
                                <span className="block text-[10px] text-slate-500">
                                  Tag: {item.asset.assetTag}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Unlinked Asset</span>
                            )}
                          </td>
                          <td className="p-4 max-w-xs truncate" title={item.description}>
                            {item.description}
                          </td>
                          <td className="p-4">
                            {item.partsReplaced ? (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 text-[11px] font-mono border border-slate-700">
                                {item.partsReplaced}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-mono">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            {item.performedBy ? (
                              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                {item.performedBy.firstName} {item.performedBy.lastName}
                              </div>
                            ) : (
                              <span className="text-slate-500">System Admin</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-bold text-emerald-400">
                            ${Number(item.cost).toFixed(2)}
                          </td>
                          <td className="p-4 text-right font-bold text-cyan-400">
                            {item.downtimeHours ? `${item.downtimeHours} hrs` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Completed Tasks History Section */}
            {(activeTab === 'all' || activeTab === 'completed-tasks') && completedTasks.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Completed Work Orders
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {completedTasks.length} Completed
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-4">Task #</th>
                        <th className="p-4">Title</th>
                        <th className="p-4">Type / Priority</th>
                        <th className="p-4">Assigned Technician</th>
                        <th className="p-4">Completed Date</th>
                        <th className="p-4 text-right">Actual Cost</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {completedTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                            {task.taskNumber}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-white">{task.title}</div>
                            {task.asset && (
                              <span className="text-[10px] text-slate-400 block">
                                Asset: {task.asset.name} ({task.asset.assetTag})
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold uppercase text-slate-300">
                                {task.type}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.priority === 'CRITICAL' || task.priority === 'HIGH'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            {task.assignedTo ? (
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {new Date(task.updatedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-4 text-right font-bold text-emerald-400">
                            ${task.actualCost ? Number(task.actualCost).toFixed(2) : '0.00'}
                          </td>
                          <td className="p-4 text-right">
                            <Link
                              href={`/maintenance/${task.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              View Task <ArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
