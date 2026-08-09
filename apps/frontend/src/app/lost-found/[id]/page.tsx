'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AppLayoutWrapper from '../../../components/navigation/AppLayoutWrapper';
import { useAuth } from '../../../context/auth-context';
import {
  fetchLostFoundItemById,
  fetchMyLostFoundItems,
  closeLostFoundItem,
  deleteLostFoundItem,
  createMatchRequest,
  LostFoundItem,
} from '../../../lib/lost-found-client';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Tag,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Package,
  X,
  Send,
  Trash2,
  Lock,
} from 'lucide-react';

export default function LostFoundItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = String(params?.id || '');

  const [item, setItem] = useState<LostFoundItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Match Modal State
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [userItems, setUserItems] = useState<LostFoundItem[]>([]);
  const [selectedMatchingItemId, setSelectedMatchingItemId] = useState('');
  const [matchNotes, setMatchNotes] = useState('');
  const [submittingMatch, setSubmittingMatch] = useState(false);
  const [matchSuccess, setMatchSuccess] = useState(false);

  const userRole = typeof user?.role === 'object' && user?.role ? (user.role as any).name : String(user?.role || 'STUDENT');
  const isAdmin = userRole === 'ADMIN';

  useEffect(() => {
    if (id) {
      loadItemDetail();
    }
  }, [id]);

  const loadItemDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLostFoundItemById(id);
      setItem(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMatchModal = async () => {
    setIsMatchModalOpen(true);
    try {
      const myItems = await fetchMyLostFoundItems();
      // Filter items of opposite type
      const oppositeType = item?.type === 'LOST' ? 'FOUND' : 'LOST';
      setUserItems(myItems.filter((i) => i.type === oppositeType && i.status === 'ACTIVE'));
    } catch (err) {
      console.error('Failed to load user items for match modal', err);
    }
  };

  const handleSubmitMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchingItemId) return;

    setSubmittingMatch(true);
    try {
      const lostItemId = item?.type === 'LOST' ? item.id : selectedMatchingItemId;
      const foundItemId = item?.type === 'FOUND' ? item.id : selectedMatchingItemId;

      await createMatchRequest({
        lostItemId,
        foundItemId,
        matchNotes,
      });

      setMatchSuccess(true);
      setTimeout(() => {
        setIsMatchModalOpen(false);
        setMatchSuccess(false);
        loadItemDetail();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit match request');
    } finally {
      setSubmittingMatch(false);
    }
  };

  const handleCloseReport = async () => {
    if (!confirm('Are you sure you want to close this report?')) return;
    try {
      await closeLostFoundItem(id);
      loadItemDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to close report');
    }
  };

  const handleDeleteReport = async () => {
    if (!confirm('Administrator Action: Delete this report permanently?')) return;
    try {
      await deleteLostFoundItem(id);
      router.push('/lost-found');
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
    }
  };

  const isOwner = user?.id === item?.reporterId;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY', 'STUDENT', 'TECHNICIAN', 'VENDOR']}>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
          {/* Top Nav Back */}
          <Link
            href="/lost-found"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Lost & Found
          </Link>

          {loading ? (
            <div className="h-96 bg-slate-900/50 border border-slate-800 rounded-3xl animate-pulse" />
          ) : error || !item ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h2 className="text-lg font-bold text-white">Item Not Found</h2>
              <p className="text-xs text-slate-400">{error || 'The requested item report does not exist.'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Images Banner Grid */}
                {item.images && item.images.length > 0 ? (
                  <div className="bg-slate-950 p-4 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {item.images.map((img, index) => (
                      <div key={img.id || index} className="relative rounded-2xl overflow-hidden h-64 bg-slate-900">
                        <img src={img.url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 bg-slate-950 border-b border-slate-800 flex flex-col items-center justify-center text-slate-600 space-y-1">
                    <Package className="w-12 h-12" />
                    <span className="text-xs font-medium">No Images Uploaded</span>
                  </div>
                )}

                {/* Details Content */}
                <div className="p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg shadow-md ${
                          item.type === 'LOST' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {item.type} ITEM
                      </span>

                      <span className="px-3 py-1 text-xs font-bold bg-slate-800 text-indigo-400 rounded-lg border border-slate-700">
                        Category: {item.category?.name}
                      </span>
                    </div>

                    <span className="px-3 py-1 text-xs font-bold bg-slate-950 text-slate-300 rounded-full border border-slate-800">
                      Status: {item.status}
                    </span>
                  </div>

                  <h1 className="text-2xl font-black text-white">{item.title}</h1>

                  <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h3>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{item.description}</p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Date {item.type === 'LOST' ? 'Lost' : 'Found'}
                      </span>
                      <p className="font-bold text-white">
                        {new Date(item.dateOccurred).toLocaleDateString()}
                        {item.timeOccurred ? ` at ${item.timeOccurred}` : ''}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        Location
                      </span>
                      <p className="font-bold text-white truncate">
                        {item.building?.name ? `${item.building.name}` : ''}
                        {item.floor?.name ? ` • ${item.floor.name}` : ''}
                        {item.room?.roomNumber ? ` • Room ${item.room.roomNumber}` : ''}
                        {!item.building && !item.room ? (item.locationDescription || 'Campus area') : ''}
                      </p>
                    </div>

                    {item.foundBy && (
                      <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-1">
                        <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          Found By
                        </span>
                        <p className="font-bold text-white">{item.foundBy}</p>
                      </div>
                    )}

                    <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Reporter Info (Privacy Protected)
                      </span>
                      <p className="font-bold text-white">
                        {item.reporter?.firstName} {item.reporter?.lastName}
                      </p>
                      {item.reporter?.email ? (
                        <p className="text-[11px] text-slate-400">{item.reporter.email}</p>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Contact details hidden for privacy
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    {/* Match Action */}
                    {item.status === 'ACTIVE' && (
                      <button
                        onClick={handleOpenMatchModal}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Report Possible Match / Claim
                      </button>
                    )}

                    <div className="flex items-center gap-3 ml-auto">
                      {(isOwner || isAdmin) && item.status === 'ACTIVE' && (
                        <button
                          onClick={handleCloseReport}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all"
                        >
                          Close Report
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={handleDeleteReport}
                          className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Match Request Modal */}
          {isMatchModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
                <button
                  onClick={() => setIsMatchModalOpen(false)}
                  className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-400" />
                    Report Possible Match
                  </h3>
                  <p className="text-xs text-slate-400">
                    Connect this report with a matching item to request verification.
                  </p>
                </div>

                {matchSuccess ? (
                  <div className="p-6 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h4 className="font-bold text-white">Match Request Submitted!</h4>
                    <p className="text-xs text-slate-300">
                      The item owner and administrators have been notified to review your match report.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitMatch} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        Select your matching {item?.type === 'LOST' ? 'Found' : 'Lost'} item report:
                      </label>
                      {userItems.length === 0 ? (
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                          You haven't reported any active {item?.type === 'LOST' ? 'Found' : 'Lost'} items yet.{' '}
                          <Link href={`/lost-found/report/${item?.type === 'LOST' ? 'found' : 'lost'}`} className="text-indigo-400 underline font-bold">
                            Create one now
                          </Link>
                        </div>
                      ) : (
                        <select
                          required
                          value={selectedMatchingItemId}
                          onChange={(e) => setSelectedMatchingItemId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- Choose your report --</option>
                          {userItems.map((uItem) => (
                            <option key={uItem.id} value={uItem.id}>
                              {uItem.title} ({new Date(uItem.dateOccurred).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">Match Details / Notes (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Provide details proving ownership or explaining why these items match..."
                        value={matchNotes}
                        onChange={(e) => setMatchNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsMatchModalOpen(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingMatch || !selectedMatchingItemId}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-40"
                      >
                        {submittingMatch ? 'Submitting...' : 'Submit Match Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
    </ProtectedRoute>
  );
}
