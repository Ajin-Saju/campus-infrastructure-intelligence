'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import AppLayoutWrapper from '../../../../components/navigation/AppLayoutWrapper';
import {
  fetchLostFoundItems,
  updateLostFoundItem,
  deleteLostFoundItem,
  LostFoundItem,
  LostFoundStatus,
} from '../../../../lib/lost-found-client';
import {
  ShieldCheck,
  Search,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';

export default function AdminManageItemsPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadItems();
  }, [search, statusFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetchLostFoundItems({
        search: search || undefined,
        status: (statusFilter as LostFoundStatus) || undefined,
        limit: 50,
      });
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load items', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: LostFoundStatus) => {
    try {
      await updateLostFoundItem(id, { status });
      loadItems();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this report?')) return;
    try {
      await deleteLostFoundItem(id);
      loadItems();
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Administrator Controls
              </div>
              <h1 className="text-2xl font-black text-white">Lost & Found Items Management</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/lost-found/admin/matches"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Match Requests
              </Link>
              <Link
                href="/lost-found/admin/categories"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Manage Categories
              </Link>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search items or reporter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="POSSIBLE_MATCH">POSSIBLE MATCH</option>
              <option value="CLAIMED">CLAIMED</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Item</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Reporter Details</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Loading management records...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-bold text-white max-w-xs truncate">{item.title}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                              item.type === 'LOST' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">{item.category?.name}</td>
                        <td className="p-4">
                          <div className="font-semibold text-white">
                            {item.reporter?.firstName} {item.reporter?.lastName}
                          </div>
                          <div className="text-[10px] text-slate-500">{item.reporter?.email || 'N/A'}</div>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(item.dateOccurred).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as LostFoundStatus)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="POSSIBLE_MATCH">POSSIBLE_MATCH</option>
                            <option value="CLAIMED">CLAIMED</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="RETURNED">RETURNED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/lost-found/${item.id}`}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 bg-rose-950/50 hover:bg-rose-900 text-rose-400 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </ProtectedRoute>
  );
}
