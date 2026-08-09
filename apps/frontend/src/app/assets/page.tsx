'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import {
  fetchAssets,
  fetchAllAssetCategories,
  deleteAsset,
  AssetItem,
  AssetCategoryItem,
  AssetStatus,
} from '../../lib/assets-client';
import { fetchBuildings, BuildingItem } from '../../lib/buildings-client';
import {
  Box,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Building2,
  MapPin,
  Tag,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';

const STATUS_COLORS: Record<AssetStatus, { bg: string; text: string; border: string }> = {
  [AssetStatus.OPERATIONAL]: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  [AssetStatus.NEEDS_REPAIR]: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  [AssetStatus.IN_MAINTENANCE]: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
  },
  [AssetStatus.DECOMMISSIONED]: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
  [AssetStatus.SCRAPPED]: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
};

export default function AssetListPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [categories, setCategories] = useState<AssetCategoryItem[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete modal state
  const [deletingAsset, setDeletingAsset] = useState<AssetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategoriesAndBuildings();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [search, selectedCategory, selectedBuilding, selectedStatus, page]);

  const loadCategoriesAndBuildings = async () => {
    try {
      const [cats, blds] = await Promise.all([
        fetchAllAssetCategories(),
        fetchBuildings({ limit: 100 }),
      ]);
      setCategories(cats);
      setBuildings(blds.data);
    } catch (err: any) {
      console.error('Failed to load filter metadata:', err);
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchAssets({
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
        buildingId: selectedBuilding || undefined,
        status: (selectedStatus as AssetStatus) || undefined,
        page,
        limit: 9,
      });
      setAssets(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalCount(response.meta.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return;
    setIsDeleting(true);
    try {
      await deleteAsset(deletingAsset.id);
      setDeletingAsset(null);
      loadAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <Box className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  Dashboard
                </Link>
                <span className="text-slate-600">/</span>
                <span className="text-xs font-semibold text-indigo-400">Asset Management</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mt-0.5">
                Assets Directory
              </h1>
              <p className="text-xs text-slate-400">
                Track, search, and manage all infrastructure assets across campus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/assets/categories"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <span>Asset Categories</span>
            </Link>
            <Link
              href="/assets/new"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Asset</span>
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search Asset ID, Name, Vendor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Building Filter */}
            <div className="relative">
              <select
                value={selectedBuilding}
                onChange={(e) => {
                  setSelectedBuilding(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
              >
                <option value="">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="NEEDS_REPAIR">NEEDS_REPAIR</option>
                <option value="IN_MAINTENANCE">IN_MAINTENANCE</option>
                <option value="DECOMMISSIONED">DECOMMISSIONED</option>
                <option value="SCRAPPED">SCRAPPED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Asset Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
            <div className="h-6 w-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs">Fetching asset records...</span>
          </div>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 space-y-3">
            <Box className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Assets Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No assets match your search and filter criteria. Try resetting filters or create a new asset.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assets.map((asset) => {
              const primaryImg =
                asset.images && asset.images.length > 0 ? asset.images[0].url : null;
              const statusCfg = STATUS_COLORS[asset.status] || STATUS_COLORS[AssetStatus.OPERATIONAL];

              return (
                <div
                  key={asset.id}
                  className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all group flex flex-col justify-between shadow-xl"
                >
                  {/* Card Top / Image Banner */}
                  <div>
                    <div className="h-40 bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-800">
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-700">
                          <Box className="w-10 h-10 stroke-[1.5]" />
                          <span className="text-[10px] uppercase font-semibold tracking-wider">
                            No Preview Image
                          </span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-bold rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {asset.status}
                      </span>

                      {/* Tag Badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-slate-900/90 border border-slate-700 text-indigo-300">
                        {asset.assetTag}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {asset.name}
                        </h3>
                        <p className="text-xs text-indigo-400 font-medium mt-0.5">
                          {asset.category ? asset.category.name : 'Uncategorized'}
                        </p>
                      </div>

                      {/* Meta Information List */}
                      <div className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                        {/* Location */}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">
                            {asset.building ? asset.building.name : 'No Building'}
                            {asset.floor ? ` • ${asset.floor.name}` : ''}
                            {asset.room ? ` (Room ${asset.room.roomNumber})` : ''}
                          </span>
                        </div>

                        {/* Vendor */}
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            Vendor:{' '}
                            <strong className="text-slate-300 font-medium">
                              {asset.manufacturer || 'N/A'}
                            </strong>
                          </span>
                        </div>

                        {/* Warranty */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            Warranty:{' '}
                            <span className="text-slate-300">
                              {asset.warrantyExpiry
                                ? new Date(asset.warrantyExpiry).toLocaleDateString()
                                : 'No Expiry Set'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Link
                      href={`/assets/${asset.id}`}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/assets/${asset.id}/edit`}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                        title="Edit Asset"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setDeletingAsset(asset)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs text-slate-400">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount}{' '}
              assets total)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingAsset && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Confirm Asset Deletion</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete asset{' '}
              <strong className="text-slate-200 font-semibold">{deletingAsset.name}</strong> (Tag:{' '}
              <span className="font-mono text-indigo-400">{deletingAsset.assetTag}</span>)? This action
              will soft-delete the asset record.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingAsset(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteAsset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                {isDeleting && (
                  <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
