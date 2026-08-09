'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchFilteredSearch, FilterSearchResult } from '../../lib/search-client';
import { fetchIssueCategories } from '../../lib/issues-client';
import { fetchBuildings } from '../../lib/buildings-client';
import { fetchVendors } from '../../lib/vendor-client';
import { fetchAssets } from '../../lib/assets-client';
import {
  Search,
  Filter,
  RotateCcw,
  Building2,
  MapPin,
  FileText,
  Briefcase,
  Box,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

function SearchAndFilterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQ = searchParams?.get('q') || '';

  // Filter Form State
  const [queryStr, setQueryStr] = useState(initialQ);
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Dropdown Lists Data
  const [categories, setCategories] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [assetsList, setAssetsList] = useState<any[]>([]);

  // Results State
  const [searchResult, setSearchResult] = useState<FilterSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFilterDropdowns();
  }, []);

  useEffect(() => {
    executeFilterSearch();
  }, [queryStr, status, categoryId, priority, buildingId, roomId, vendorId, assetId, startDate, endDate, sortBy, sortOrder, page]);

  const loadFilterDropdowns = async () => {
    try {
      const [cats, bldRes, vList, astRes] = await Promise.all([
        fetchIssueCategories(),
        fetchBuildings({ limit: 100 }),
        fetchVendors(),
        fetchAssets({ limit: 100 }),
      ]);
      setCategories(cats);
      setBuildings(bldRes.data || []);
      setVendors(vList);
      setAssetsList(astRes.data || []);
    } catch (err) {
      // Ignore
    }
  };

  const executeFilterSearch = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetchFilteredSearch({
        q: queryStr.trim() || undefined,
        status: status || undefined,
        categoryId: categoryId || undefined,
        priority: priority || undefined,
        buildingId: buildingId || undefined,
        roomId: roomId || undefined,
        vendorId: vendorId || undefined,
        assetId: assetId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 15,
      });
      setSearchResult(res);
    } catch (err: any) {
      setError(err.message || 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setQueryStr('');
    setStatus('');
    setCategoryId('');
    setPriority('');
    setBuildingId('');
    setRoomId('');
    setVendorId('');
    setAssetId('');
    setStartDate('');
    setEndDate('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">MEDIUM</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-slate-800 text-slate-300">LOW</span>;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs font-medium text-slate-400 hover:text-indigo-400">
              Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-indigo-400">Search & Filter Center</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-400" />
            Global Search & Multi-Criteria Filtering
          </h1>
          <p className="text-xs text-slate-400">
            Search and filter by Status, Category, Priority, Building, Room, Vendor, Asset & Date Range with server pagination & sorting.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ========================================== */}
          {/* FILTER PANEL SIDEBAR                       */}
          {/* ========================================== */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 lg:col-span-1 h-fit">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                Filter Options
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Keyword Search */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Search Keyword</label>
                <input
                  type="text"
                  value={queryStr}
                  onChange={(e) => {
                    setQueryStr(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Ticket #, title, notes..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Building Filter */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Building</label>
                <select
                  value={buildingId}
                  onChange={(e) => {
                    setBuildingId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Buildings</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Filter */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Vendor</label>
                <select
                  value={vendorId}
                  onChange={(e) => {
                    setVendorId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Vendors</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset Filter */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Asset</label>
                <select
                  value={assetId}
                  onChange={(e) => {
                    setAssetId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Assets</option>
                  {assetsList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.assetTag})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Sorting Controls */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-slate-400 font-semibold flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" /> Sort By
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                    <option value="title">Title</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="desc">Desc (Newest)</option>
                    <option value="asc">Asc (Oldest)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* RESULTS SECTION                            */}
          {/* ========================================== */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Found{' '}
                <strong className="text-white font-bold">{searchResult?.meta.total || 0}</strong>{' '}
                matching records
              </span>

              {searchResult && searchResult.meta.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-400 font-mono">
                    Page {page} of {searchResult.meta.totalPages}
                  </span>
                  <button
                    disabled={page === searchResult.meta.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="p-16 text-center text-slate-400 flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span>Executing multi-criteria search...</span>
              </div>
            ) : searchResult && searchResult.data.length === 0 ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
                <Search className="w-10 h-10 mx-auto text-slate-700 opacity-50" />
                <p className="text-xs font-medium">No issue reports matched the selected filter criteria.</p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg mt-2 inline-block"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResult?.data.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-indigo-400">{item.ticketNumber}</span>
                        {getPriorityBadge(item.priority)}
                        <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-300 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-950 text-xs text-slate-400">
                      <div className="flex flex-wrap items-center gap-3">
                        {item.building && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                            {item.building.name}
                          </span>
                        )}
                        {item.room && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            Room {item.room.roomNumber}
                          </span>
                        )}
                        {item.asset && (
                          <span className="flex items-center gap-1">
                            <Box className="w-3.5 h-3.5 text-amber-400" />
                            {item.asset.name}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/issues/${item.id}`}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        View Full Details <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchAndFilterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading search results...</span>
          </div>
        </main>
      }
    >
      <SearchAndFilterContent />
    </Suspense>
  );
}
