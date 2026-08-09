'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppLayoutWrapper from '../../components/navigation/AppLayoutWrapper';
import {
  fetchLostFoundItems,
  fetchLostFoundCategories,
  LostFoundItem,
  LostFoundCategory,
  LostFoundType,
} from '../../lib/lost-found-client';
import {
  Search,
  Filter,
  Plus,
  HelpCircle,
  Clock,
  MapPin,
  Tag,
  Eye,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function LostFoundBrowsePage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [categories, setCategories] = useState<LostFoundCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<LostFoundType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems();
  }, [search, selectedType, selectedCategory, page]);

  const loadCategories = async () => {
    try {
      const cats = await fetchLostFoundCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetchLostFoundItems({
        type: selectedType === 'ALL' ? undefined : selectedType,
        categoryId: selectedCategory || undefined,
        search: search || undefined,
        page,
        limit: 12,
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load lost & found items', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        );
      case 'POSSIBLE_MATCH':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Possible Match
          </span>
        );
      case 'CLAIMED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Claimed
          </span>
        );
      case 'RESOLVED':
      case 'RETURNED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY', 'STUDENT', 'TECHNICIAN', 'VENDOR']}>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-slate-800 p-8 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Campus Lost & Found Portal
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Lost something? Found an item?
                </h1>
                <p className="text-slate-400 text-sm max-w-xl">
                  Report lost belongings or help reunite found items with their owners across campus buildings.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/lost-found/report/lost"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Report Lost Item
                </Link>

                <Link
                  href="/lost-found/report/found"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Report Found Item
                </Link>
              </div>
            </div>
          </div>

          {/* Search & Filtering Control Bar */}
          <div className="p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Type Switcher Tabs */}
              <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 w-full md:w-auto">
                <button
                  onClick={() => {
                    setSelectedType('ALL');
                    setPage(1);
                  }}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedType === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => {
                    setSelectedType('LOST');
                    setPage(1);
                  }}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedType === 'LOST'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lost Only
                </button>
                <button
                  onClick={() => {
                    setSelectedType('FOUND');
                    setPage(1);
                  }}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedType === 'FOUND'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Found Only
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search item title, description, location..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-thin">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Categories:
              </span>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                  selectedCategory === ''
                    ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white border border-indigo-500 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-72 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <Package className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No items found</h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your search filters or report a new lost item.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Image & Type Header */}
                  <div className="relative h-44 bg-slate-950 overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0].url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950">
                        <Package className="w-10 h-10 mb-1" />
                        <span className="text-[10px] font-semibold">No Image Provided</span>
                      </div>
                    )}

                    {/* Type Tag Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md ${
                          item.type === 'LOST'
                            ? 'bg-rose-500 text-white'
                            : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">{getStatusBadge(item.status)}</div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-indigo-400 font-semibold">
                        <Tag className="w-3.5 h-3.5" />
                        {item.category?.name || 'General'}
                      </div>

                      <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {item.building?.name || item.locationDescription || 'Campus area'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {new Date(item.dateOccurred).toLocaleDateString()}
                          {item.timeOccurred ? ` • ${item.timeOccurred}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Reported by {item.reporter?.firstName || 'Campus User'}
                    </span>
                    <Link
                      href={`/lost-found/${item.id}`}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-400 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
    </ProtectedRoute>
  );
}
