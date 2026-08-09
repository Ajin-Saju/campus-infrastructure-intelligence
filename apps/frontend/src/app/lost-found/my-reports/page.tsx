'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AppLayoutWrapper from '../../../components/navigation/AppLayoutWrapper';
import {
  fetchMyLostFoundItems,
  closeLostFoundItem,
  LostFoundItem,
} from '../../../lib/lost-found-client';
import {
  FileText,
  Clock,
  MapPin,
  Tag,
  ArrowRight,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function MyLostFoundReportsPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyReports();
  }, []);

  const loadMyReports = async () => {
    setLoading(true);
    try {
      const data = await fetchMyLostFoundItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load my reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm('Close this report?')) return;
    try {
      await closeLostFoundItem(id);
      loadMyReports();
    } catch (err: any) {
      alert(err.message || 'Failed to close report');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY', 'STUDENT', 'TECHNICIAN', 'VENDOR']}>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-400" />
                My Lost & Found Reports
              </h1>
              <p className="text-xs text-slate-400">
                View and manage your active and resolved lost or found reports.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/lost-found/report/lost"
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                + Report Lost
              </Link>
              <Link
                href="/lost-found/report/found"
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                + Report Found
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-900/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              You haven't published any lost or found reports yet.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-slate-700">
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0].url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                            item.type === 'LOST' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-xs text-indigo-400 font-semibold">{item.category?.name}</span>
                        <span className="text-xs text-slate-500">• Status: {item.status}</span>
                      </div>

                      <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                      <p className="text-xs text-slate-400 truncate">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {item.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleClose(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                      >
                        Close
                      </button>
                    )}

                    <Link
                      href={`/lost-found/${item.id}`}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </ProtectedRoute>
  );
}
