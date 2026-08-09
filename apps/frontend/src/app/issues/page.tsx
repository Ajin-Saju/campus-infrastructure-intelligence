'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';
import { fetchAllIssues, IssueReportItem } from '../../lib/issues-client';
import {
  AlertCircle,
  Plus,
  Search,
  Building2,
  MapPin,
  Box,
  Calendar,
  Clock,
  ChevronRight,
  ImageIcon,
  Film,
  Loader2,
  Filter,
  CheckCircle,
  Layers,
} from 'lucide-react';

export default function MyReportsPage() {
  const { isLoading: authLoading, user } = useAuth();

  // Derive role for UI display decisions
  const userRole: string = (user as any)?.role?.name ?? '';
  const isAdmin = userRole === 'ADMIN';
  const isTechnician = userRole === 'TECHNICIAN';
  const isVendor = userRole === 'VENDOR';

  const [reports, setReports] = useState<IssueReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMyReports();
  }, [page, statusFilter]);

  const loadMyReports = async () => {
    setIsLoading(true);
    try {
      // GET /issues is now RBAC-scoped on the backend:
      // Admin → all issues, Student/Faculty → own, Technician → assigned, Vendor → assigned
      const res = await fetchAllIssues({
        page,
        limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
      });
      setReports(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadMyReports();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            IN PROGRESS
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            RESOLVED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400">
            CLOSED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link href="/" className="text-xs font-medium text-slate-400 hover:text-cyan-400">
                  Dashboard
                </Link>
                <span className="text-slate-600">/</span>
                <span className="text-xs font-semibold text-rose-400">
                  {isAdmin ? 'All Issues' : isTechnician ? 'Assigned Issues' : isVendor ? 'Vendor Issues' : 'My Reports'}
                </span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mt-0.5">
                {isAdmin ? 'Issue Reports — All Campus' : isTechnician ? 'My Assigned Issues' : isVendor ? 'Assigned Vendor Issues' : 'Issue Reports Hub'}
              </h1>
              <p className="text-xs text-slate-400">
                {isAdmin
                  ? 'View, manage and act on all campus infrastructure issue reports.'
                  : isTechnician
                  ? 'Issues assigned to you via maintenance tasks.'
                  : isVendor
                  ? 'Issues assigned to your vendor for repair.'
                  : 'Track status updates and details of infrastructure issues submitted by you.'}
              </p>
            </div>
          </div>

          {/* Only Student / Faculty can submit new reports */}
          {!isAdmin && !isTechnician && !isVendor && (
            <Link
              href="/issues/report"
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Report New Issue</span>
            </Link>
          )}
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket # or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Reports Cards List */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
            <span className="text-xs">Fetching issue reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-700 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No issue reports found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAdmin
                ? 'No issue reports match your current filter criteria.'
                : isTechnician
                ? 'No issues are currently assigned to you.'
                : isVendor
                ? 'No issues are currently assigned to your vendor.'
                : "You haven't submitted any infrastructure issue reports matching your current filter."}
            </p>
            {!isAdmin && !isTechnician && !isVendor && (
              <div className="pt-2">
                <Link
                  href="/issues/report"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Submit a Report
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/issues/${report.id}`}
                className="block bg-slate-900/80 hover:bg-slate-900 backdrop-blur-xl border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                      {report.ticketNumber}
                    </span>
                    {getStatusBadge(report.status)}
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      Priority: {report.priority}
                    </span>
                    {/* Admin: show reporter name badge */}
                    {(isAdmin || isTechnician) && report.reportedBy && (
                      <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/30 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {report.reportedBy.firstName} {report.reportedBy.lastName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="py-3 space-y-2">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{report.description}</p>
                </div>

                {/* Location Badges & Media counts */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/50 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {report.building && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[11px]">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                        {report.building.name}
                      </span>
                    )}

                    {report.room && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        Room {report.room.roomNumber}
                      </span>
                    )}

                    {report.asset && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-indigo-300 text-[11px]">
                        <Box className="w-3.5 h-3.5 text-amber-400" />
                        {report.asset.name} ({report.asset.assetTag})
                      </span>
                    )}

                    {report.category && (
                      <span className="px-2 py-0.5 bg-slate-950 text-slate-400 rounded-md text-[10px]">
                        {report.category.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {report.images && report.images.length > 0 && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        {report.images.length} photos
                      </span>
                    )}

                    {report.attachments && report.attachments.length > 0 && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-amber-400" />
                        {report.attachments.length} video
                      </span>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            ))}

            {/* Pagination Row */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 text-xs">
                <span className="text-slate-400">
                  Showing page {page} of {totalPages} ({total} total reports)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 disabled:opacity-40 rounded-lg text-slate-300"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 disabled:opacity-40 rounded-lg text-slate-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
