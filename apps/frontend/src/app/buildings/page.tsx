'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import {
  fetchBuildings,
  deleteBuilding,
  BuildingItem,
  PaginatedBuildingsResponse,
} from '../../lib/buildings-client';
import {
  Building2,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Layers,
  DoorOpen,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function BuildingListPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [buildingsData, setBuildingsData] = useState<PaginatedBuildingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [buildingToDelete, setBuildingToDelete] = useState<BuildingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBuildings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchBuildings({
        search: search.trim() || undefined,
        page,
        limit: 9,
      });
      setBuildingsData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load building list.');
      if (err.message?.includes('token') || err.message?.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [search, page, router]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadBuildings();
      }
    }
  }, [authLoading, user, router, loadBuildings]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  const handleDeleteConfirmed = async () => {
    if (!buildingToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBuilding(buildingToDelete.id);
      setSuccessMsg(`Building "${buildingToDelete.name}" soft-deleted successfully.`);
      setBuildingToDelete(null);
      loadBuildings();
    } catch (err: any) {
      setError(err.message || 'Failed to delete building.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                Building Management
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Campus physical infrastructure hierarchy (Buildings ➔ Floors ➔ Rooms)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => loadBuildings()}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
              title="Refresh list"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/buildings/new"
              className="py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Create Building
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs underline hover:text-rose-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-xs underline hover:text-emerald-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search building by name, code (e.g. STC-01), or address..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Building Grid */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="h-8 w-8 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-sm">Loading buildings...</p>
          </div>
        ) : !buildingsData || buildingsData.data.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <Building2 className="h-12 w-12 mx-auto text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No buildings found</p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              No campus buildings match your search query. Click &quot;Create Building&quot; to add
              your first building.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildingsData.data.map((b) => (
              <div
                key={b.id}
                className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        {b.code}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2 group-hover:text-cyan-300 transition-colors">
                        {b.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5 line-clamp-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    {b.address || 'No campus address specified'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-xs">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 text-sm">
                          {b._count?.floors ?? b.totalFloors}
                        </div>
                        <div className="text-slate-500">Floors</div>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <DoorOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 text-sm">
                          {b._count?.rooms ?? 0}
                        </div>
                        <div className="text-slate-500">Rooms</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/buildings/${b.id}`}
                    className="flex-1 py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Hierarchy
                  </Link>

                  <Link
                    href={`/buildings/${b.id}/edit`}
                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                    title="Edit Building"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => setBuildingToDelete(b)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                    title="Delete Building"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {buildingsData && buildingsData.meta.totalPages > 1 && (
          <div className="p-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl flex items-center justify-between text-sm text-slate-400">
            <div>
              Showing Page{' '}
              <span className="font-semibold text-slate-200">{buildingsData.meta.page}</span> of{' '}
              <span className="font-semibold text-slate-200">{buildingsData.meta.totalPages}</span>{' '}
              ({buildingsData.meta.total} Total Buildings)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= buildingsData.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {buildingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Building</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Are you sure you want to soft-delete building{' '}
                  <span className="font-semibold text-slate-200">
                    &quot;{buildingToDelete.name}&quot;
                  </span>
                  ? This will remove access to its nested floor and room records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setBuildingToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
