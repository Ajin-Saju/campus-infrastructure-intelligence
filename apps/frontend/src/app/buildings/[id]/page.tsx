'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import {
  fetchBuildingById,
  createFloor,
  updateFloor,
  deleteFloor,
  createRoom,
  updateRoom,
  deleteRoom,
  BuildingItem,
  FloorItem,
  RoomItem,
} from '../../../lib/buildings-client';
import {
  Building2,
  Layers,
  DoorOpen,
  MapPin,
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react';

export default function BuildingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const buildingId = resolvedParams.id;
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();

  const [building, setBuilding] = useState<BuildingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);

  // Modals state
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<FloorItem | null>(null);
  const [floorData, setFloorData] = useState({ floorNumber: 1, name: '', mapUrl: '' });

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [roomData, setRoomData] = useState({
    roomNumber: '',
    name: '',
    type: 'CLASSROOM',
    capacity: 30,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBuilding = useCallback(async () => {
    try {
      const b = await fetchBuildingById(buildingId);
      setBuilding(b);
      if (b.floors && b.floors.length > 0 && !selectedFloorId) {
        setSelectedFloorId(b.floors[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch building hierarchy.');
      if (err.message?.includes('token') || err.message?.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [buildingId, selectedFloorId, router]);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/login');
      } else {
        loadBuilding();
      }
    }
  }, [authLoading, currentUser, router, loadBuilding]);

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  // Floor Handlers
  const handleOpenAddFloor = () => {
    setEditingFloor(null);
    const nextFloorNum = (building?.floors?.length || 0) + 1;
    setFloorData({ floorNumber: nextFloorNum, name: `Floor ${nextFloorNum}`, mapUrl: '' });
    setFloorModalOpen(true);
  };

  const handleOpenEditFloor = (floor: FloorItem) => {
    setEditingFloor(floor);
    setFloorData({ floorNumber: floor.floorNumber, name: floor.name, mapUrl: floor.mapUrl || '' });
    setFloorModalOpen(true);
  };

  const handleSaveFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        floorNumber: Number(floorData.floorNumber),
        name: floorData.name,
        mapUrl: floorData.mapUrl.trim() !== '' ? floorData.mapUrl.trim() : undefined,
      };

      if (editingFloor) {
        await updateFloor(editingFloor.id, payload);
        setSuccess('Floor updated successfully.');
      } else {
        const newFloor = await createFloor(buildingId, payload);
        setSelectedFloorId(newFloor.id);
        setSuccess('Floor added successfully.');
      }
      setFloorModalOpen(false);
      loadBuilding();
    } catch (err: any) {
      setError(err.message || 'Failed to save floor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!confirm('Are you sure you want to delete this floor and its rooms?')) return;
    try {
      await deleteFloor(floorId);
      setSuccess('Floor deleted successfully.');
      if (selectedFloorId === floorId) {
        setSelectedFloorId(null);
      }
      loadBuilding();
    } catch (err: any) {
      setError(err.message || 'Failed to delete floor.');
    }
  };

  // Room Handlers
  const handleOpenAddRoom = () => {
    if (!selectedFloorId) return;
    setEditingRoom(null);
    setRoomData({ roomNumber: '', name: '', type: 'CLASSROOM', capacity: 30 });
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: RoomItem) => {
    setEditingRoom(room);
    setRoomData({
      roomNumber: room.roomNumber,
      name: room.name || '',
      type: room.type,
      capacity: room.capacity || 30,
    });
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloorId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, roomData);
        setSuccess('Room updated successfully.');
      } else {
        await createRoom(buildingId, selectedFloorId, roomData);
        setSuccess('Room added successfully.');
      }
      setRoomModalOpen(false);
      loadBuilding();
    } catch (err: any) {
      setError(err.message || 'Failed to save room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await deleteRoom(roomId);
      setSuccess('Room deleted successfully.');
      loadBuilding();
    } catch (err: any) {
      setError(err.message || 'Failed to delete room.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span>Loading building hierarchy...</span>
        </div>
      </div>
    );
  }

  if (error && !building) {
    return (
      <div className="min-h-screen p-6 bg-slate-950 text-slate-200 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Building Not Found</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <Link
            href="/buildings"
            className="inline-block py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-xl transition-all"
          >
            Return to Buildings
          </Link>
        </div>
      </div>
    );
  }

  const activeFloor = building?.floors?.find((f) => f.id === selectedFloorId);

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <Link
              href="/buildings"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
                <div className="h-full w-full bg-slate-950 rounded-[12px] flex items-center justify-center text-cyan-400">
                  <Building2 className="h-7 w-7" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    {building?.code}
                  </span>
                  <h1 className="text-xl font-bold text-white">{building?.name}</h1>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  {building?.address || 'No campus address specified'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddFloor}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus className="h-4 w-4" /> Add Floor
            </button>

            <Link
              href={`/buildings/${buildingId}/edit`}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
              title="Edit Building Details"
            >
              <Edit className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Feedback Notifications */}
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

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-xs underline hover:text-emerald-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Floor Hierarchy Navigation Tabs */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Floors in Building ({building?.floors?.length || 0})
            </h3>
          </div>

          {!building?.floors || building.floors.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <p className="text-sm">No floors have been created for this building yet.</p>
              <button
                onClick={handleOpenAddFloor}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-all"
              >
                + Add First Floor
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {building.floors.map((floor) => {
                const isActive = floor.id === selectedFloorId;
                return (
                  <div key={floor.id} className="flex items-center">
                    <button
                      onClick={() => setSelectedFloorId(floor.id)}
                      className={`py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shrink-0 border ${
                        isActive
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <span>{floor.name}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                        {floor.rooms?.length || 0} rooms
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Floor Room Management Grid */}
        {activeFloor && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white">{activeFloor.name}</h2>
                  <span className="text-xs font-mono text-slate-400">
                    Floor #{activeFloor.floorNumber}
                  </span>
                </div>
                {activeFloor.mapUrl && (
                  <a
                    href={activeFloor.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline mt-0.5 inline-block"
                  >
                    View Floor Blueprint / Map
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditFloor(activeFloor)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit Floor
                </button>

                <button
                  onClick={() => handleDeleteFloor(activeFloor.id)}
                  className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-xl border border-rose-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Floor
                </button>

                <button
                  onClick={handleOpenAddRoom}
                  className="py-2 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Room
                </button>
              </div>
            </div>

            {/* Room List Grid */}
            {!activeFloor.rooms || activeFloor.rooms.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <DoorOpen className="h-10 w-10 mx-auto text-slate-600" />
                <p className="text-base font-semibold text-slate-300">No rooms on this floor</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click &quot;Add Room&quot; to assign classrooms, labs, offices, or auditoriums to
                  this floor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFloor.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 space-y-3 shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-sm font-bold text-cyan-400">
                          Room {room.roomNumber}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-200 mt-0.5">
                          {room.name || `Room ${room.roomNumber}`}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        {room.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-500" /> Capacity:{' '}
                        {room.capacity || 'N/A'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditRoom(room)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                          title="Edit Room"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Delete Room"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floor Modal */}
      {floorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingFloor ? 'Edit Floor' : 'Add New Floor'}
            </h3>

            <form onSubmit={handleSaveFloor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Floor Number
                </label>
                <input
                  type="number"
                  required
                  value={floorData.floorNumber}
                  onChange={(e) =>
                    setFloorData({ ...floorData, floorNumber: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Floor Display Name
                </label>
                <input
                  type="text"
                  required
                  value={floorData.name}
                  onChange={(e) => setFloorData({ ...floorData, name: e.target.value })}
                  placeholder="e.g. Ground Floor, 2nd Floor Labs"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Blueprint / Map URL (Optional)
                </label>
                <input
                  type="url"
                  value={floorData.mapUrl}
                  onChange={(e) => setFloorData({ ...floorData, mapUrl: e.target.value })}
                  placeholder="https://example.com/map.jpg"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setFloorModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </h3>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    required
                    value={roomData.roomNumber}
                    onChange={(e) => setRoomData({ ...roomData, roomNumber: e.target.value })}
                    placeholder="e.g. 101, 204B"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={roomData.capacity}
                    onChange={(e) => setRoomData({ ...roomData, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Room Name / Description (Optional)
                </label>
                <input
                  type="text"
                  value={roomData.name}
                  onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
                  placeholder="e.g. Physics Laboratory, Dean Office"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Room Type
                </label>
                <select
                  value={roomData.type}
                  onChange={(e) => setRoomData({ ...roomData, type: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="CLASSROOM">Classroom</option>
                  <option value="LAB">Laboratory</option>
                  <option value="OFFICE">Office</option>
                  <option value="AUDITORIUM">Auditorium</option>
                  <option value="CONFERENCE">Conference Room</option>
                  <option value="STORAGE">Storage / Utility</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
