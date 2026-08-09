'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import {
  createAsset,
  fetchAllAssetCategories,
  AssetCategoryItem,
  AssetStatus,
} from '../../../lib/assets-client';
import {
  fetchBuildings,
  fetchBuildingById,
  BuildingItem,
  FloorItem,
  RoomItem,
} from '../../../lib/buildings-client';
import {
  Box,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Building2,
  Calendar,
  Tag,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

export default function CreateAssetPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();

  const [categories, setCategories] = useState<AssetCategoryItem[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [selectedBuildingData, setSelectedBuildingData] = useState<BuildingItem | null>(null);

  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);

  const [formData, setFormData] = useState({
    assetTag: `AST-${Math.floor(100000 + Math.random() * 900000)}`,
    name: '',
    categoryId: '',
    description: '',
    buildingId: '',
    floorId: '',
    roomId: '',
    status: AssetStatus.OPERATIONAL,
    serialNumber: '',
    modelNumber: '',
    vendor: '',
    purchaseDate: '',
    purchaseCost: '',
    warrantyExpiry: '',
    expectedLifespanYears: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [cats, blds] = await Promise.all([
        fetchAllAssetCategories(),
        fetchBuildings({ limit: 100 }),
      ]);
      setCategories(cats);
      setBuildings(blds.data);
    } catch (err: any) {
      setErrorMsg('Failed to load category or building dropdown options.');
    }
  };

  // When building changes, fetch building details to populate floors
  const handleBuildingChange = async (buildingId: string) => {
    setFormData((prev) => ({ ...prev, buildingId, floorId: '', roomId: '' }));
    setFloors([]);
    setRooms([]);
    setSelectedBuildingData(null);

    if (!buildingId) return;

    try {
      const bld = await fetchBuildingById(buildingId);
      setSelectedBuildingData(bld);
      if (bld.floors) {
        setFloors(bld.floors);
      }
    } catch (err) {
      console.error('Failed to fetch building details:', err);
    }
  };

  // When floor changes, populate rooms
  const handleFloorChange = (floorId: string) => {
    setFormData((prev) => ({ ...prev, floorId, roomId: '' }));
    setRooms([]);

    if (!floorId || !selectedBuildingData?.floors) return;

    const floor = selectedBuildingData.floors.find((f) => f.id === floorId);
    if (floor && floor.rooms) {
      setRooms(floor.rooms);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetTag.trim() || !formData.name.trim() || !formData.categoryId) {
      setErrorMsg('Asset Tag, Asset Name, and Category are required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const created = await createAsset({
        assetTag: formData.assetTag.trim(),
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        description: formData.description.trim() || undefined,
        buildingId: formData.buildingId || undefined,
        floorId: formData.floorId || undefined,
        roomId: formData.roomId || undefined,
        status: formData.status,
        serialNumber: formData.serialNumber.trim() || undefined,
        modelNumber: formData.modelNumber.trim() || undefined,
        vendor: formData.vendor.trim() || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : undefined,
        warrantyExpiry: formData.warrantyExpiry || undefined,
        expectedLifespanYears: formData.expectedLifespanYears
          ? parseInt(formData.expectedLifespanYears, 10)
          : undefined,
      });

      router.push(`/assets/${created.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create asset');
    } finally {
      setIsSubmitting(false);
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <Link
              href="/assets"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-xs font-semibold text-indigo-400">Asset Management</span>
              <h1 className="text-xl font-bold text-white">Create New Asset</h1>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Creation Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Asset Info */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Box className="w-4 h-4 text-indigo-400" />
              General Asset Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Asset Tag / ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AST-100234"
                  value={formData.assetTag}
                  onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Performance Server Rack R740"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as AssetStatus })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPERATIONAL">OPERATIONAL</option>
                  <option value="NEEDS_REPAIR">NEEDS_REPAIR</option>
                  <option value="IN_MAINTENANCE">IN_MAINTENANCE</option>
                  <option value="DECOMMISSIONED">DECOMMISSIONED</option>
                  <option value="SCRAPPED">SCRAPPED</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">Description</label>
                <textarea
                  rows={3}
                  placeholder="Asset description and specifications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location Assignment */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Location Assignment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Building</label>
                <select
                  value={formData.buildingId}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Building</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Floor</label>
                <select
                  disabled={!formData.buildingId || floors.length === 0}
                  value={formData.floorId}
                  onChange={(e) => handleFloorChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                >
                  <option value="">Select Floor</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Floor {f.floorNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Room</label>
                <select
                  disabled={!formData.floorId || rooms.length === 0}
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                >
                  <option value="">Select Room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} {r.name ? `(${r.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Commercial & Procurement Info */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Vendor & Lifecycle Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. Dell Technologies Inc."
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Warranty Date</label>
                <input
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-8839210-X"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Model Number</label>
                <input
                  type="text"
                  placeholder="e.g. PowerEdge R740"
                  value={formData.modelNumber}
                  onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Purchase Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 4500.00"
                  value={formData.purchaseCost}
                  onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/assets"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save & Create Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
