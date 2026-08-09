'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import {
  fetchLostFoundCategories,
  createFoundItemReport,
  LostFoundCategory,
} from '../../../../lib/lost-found-client';
import { fetchBuildings, fetchBuildingById, BuildingItem, FloorItem, RoomItem } from '../../../../lib/buildings-client';
import { ArrowLeft, CheckCircle2, Upload, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

export default function ReportFoundItemPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<LostFoundCategory[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().split('T')[0]);
  const [timeOccurred, setTimeOccurred] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [foundBy, setFoundBy] = useState('');
  const [contactPreference, setContactPreference] = useState('EMAIL');

  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFormOptions();
  }, []);

  const loadFormOptions = async () => {
    try {
      const [cats, bldsRes] = await Promise.all([
        fetchLostFoundCategories(),
        fetchBuildings({ limit: 100 }),
      ]);
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
      setBuildings(bldsRes.data);
    } catch (err) {
      console.error('Failed to load categories/buildings', err);
    }
  };

  const handleBuildingChange = async (bId: string) => {
    setBuildingId(bId);
    setFloorId('');
    setRoomId('');
    setFloors([]);
    setRooms([]);

    if (!bId) return;

    setLoadingLocations(true);
    try {
      const fullBld = await fetchBuildingById(bId);
      if (fullBld && fullBld.floors) {
        setFloors(fullBld.floors);
      }
    } catch (err) {
      console.error('Failed to load building floors', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleFloorChange = (fId: string) => {
    setFloorId(fId);
    setRoomId('');

    const selectedFloor = floors.find((f) => f.id === fId);
    if (selectedFloor && selectedFloor.rooms) {
      setRooms(selectedFloor.rooms);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('Please select valid image files.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('Image file size must be under 50MB per file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const created = await createFoundItemReport({
        title,
        categoryId,
        description,
        dateOccurred,
        timeOccurred: timeOccurred || undefined,
        buildingId: buildingId || undefined,
        floorId: floorId || undefined,
        roomId: roomId || undefined,
        locationDescription: locationDescription || undefined,
        foundBy: foundBy || undefined,
        contactPreference,
        images,
      });

      router.push(`/lost-found/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit Found Item report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY', 'STUDENT', 'TECHNICIAN', 'VENDOR']}>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <Link
          href="/lost-found"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl">
          <div className="space-y-1 pb-6 border-b border-slate-800">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Report Found Item
            </div>
            <h1 className="text-2xl font-black text-white">Create a Found Item Report</h1>
            <p className="text-xs text-slate-400">
              Help return a discovered item to its rightful owner by publishing details.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-400 rounded-2xl text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Item Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Black Leather Wallet with Student ID"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Category *</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Detailed Description *</label>
              <textarea
                required
                rows={4}
                placeholder="Describe color, brand, condition, where it is being stored or handed over..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Date & Time Found */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Date Found *</label>
                <input
                  type="date"
                  required
                  value={dateOccurred}
                  onChange={(e) => setDateOccurred(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Approximate Time Found</label>
                <input
                  type="time"
                  value={timeOccurred}
                  onChange={(e) => setTimeOccurred(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Found By (Person / Staff)</label>
                <input
                  type="text"
                  placeholder="e.g. Security / Maintenance Staff"
                  value={foundBy}
                  onChange={(e) => setFoundBy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Location Selection */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Location Found</h3>
                {loadingLocations && (
                  <span className="text-[10px] text-emerald-400 animate-pulse">Loading floors & rooms...</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Building</label>
                  <select
                    value={buildingId}
                    onChange={(e) => handleBuildingChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Building --</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Floor</label>
                  <select
                    disabled={!buildingId || loadingLocations}
                    value={floorId}
                    onChange={(e) => handleFloorChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Floor --</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} (Floor {f.floorNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Room</label>
                  <select
                    disabled={!floorId || loadingLocations}
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Room --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} {r.name ? `(${r.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Location Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Handed to Library Reception desk"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Images Upload */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 block">Add Item Images</label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Upload Picker */}
                <div className="p-4 bg-slate-950 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl text-center flex flex-col items-center justify-center space-y-2 cursor-pointer transition-colors relative">
                  <Upload className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Upload from Computer / Device</span>
                  <span className="text-[10px] text-slate-500">PNG, JPG, WEBP up to 50MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {/* URL Input Fallback */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-300">Or Paste Image URL</span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
                      <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-lg shadow-md hover:bg-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-indigo-600/25 disabled:opacity-40"
              >
                {submitting ? 'Submitting Report...' : 'Publish Found Item Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
