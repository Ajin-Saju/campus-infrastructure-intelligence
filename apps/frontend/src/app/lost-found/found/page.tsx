'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AppLayoutWrapper from '../../../components/navigation/AppLayoutWrapper';
import {
  fetchLostFoundItems,
  LostFoundItem,
} from '../../../lib/lost-found-client';
import {
  Search,
  Plus,
  Clock,
  MapPin,
  Tag,
  ArrowRight,
  Package,
  CheckCircle2,
} from 'lucide-react';

export default function FoundItemsListPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadItems();
  }, [search]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetchLostFoundItems({
        type: 'FOUND',
        search: search || undefined,
        limit: 30,
      });
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load found items', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY', 'STUDENT', 'TECHNICIAN', 'VENDOR']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                Public Found Items List
              </h1>
              <p className="text-xs text-slate-400">
                Browse items discovered across campus waiting to be claimed by their owners.
              </p>
            </div>

            <Link
              href="/lost-found/report/found"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Report Found Item
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search found items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-900/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No found items reported matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  <div className="relative h-40 bg-slate-950">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0].url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-black uppercase rounded bg-emerald-500 text-slate-950">
                      FOUND
                    </span>
                  </div>

                  <div className="p-5 space-y-2 flex-1">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      {item.category?.name}
                    </div>
                    <h3 className="text-base font-bold text-white line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Found on {new Date(item.dateOccurred).toLocaleDateString()}
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
        </div>
    </ProtectedRoute>
  );
}
