'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import AppLayoutWrapper from '../../../../components/navigation/AppLayoutWrapper';
import {
  fetchMatchRequests,
  resolveMatchRequest,
  LostFoundMatch,
  LostFoundMatchStatus,
} from '../../../../lib/lost-found-client';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  User,
  Package,
} from 'lucide-react';

export default function AdminMatchRequestsPage() {
  const [matches, setMatches] = useState<LostFoundMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await fetchMatchRequests();
      setMatches(data);
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (matchId: string, status: LostFoundMatchStatus) => {
    const notes = prompt(`Optional resolution notes for ${status}:`) || undefined;
    try {
      await resolveMatchRequest(matchId, { status, resolvedNotes: notes });
      loadMatches();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve match request');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Match Verification
            </div>
            <h1 className="text-2xl font-black text-white">Lost & Found Match Requests</h1>
            <p className="text-xs text-slate-400">
              Review claim and match reports submitted by users and verify item returns.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 bg-slate-900/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No match requests pending or recorded.
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                    <div className="text-xs font-bold text-slate-400">
                      Match Report ID: <span className="text-white">{match.id.slice(0, 8)}...</span>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        match.status === 'APPROVED' || match.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : match.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      Status: {match.status}
                    </span>
                  </div>

                  {/* Connected Items Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/80 border border-rose-900/30 rounded-xl space-y-2">
                      <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase bg-rose-500 text-white">
                        LOST ITEM
                      </span>
                      <h4 className="text-sm font-bold text-white">{match.lostItem?.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{match.lostItem?.description}</p>
                    </div>

                    <div className="p-4 bg-slate-950/80 border border-emerald-900/30 rounded-xl space-y-2">
                      <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase bg-emerald-500 text-slate-950">
                        FOUND ITEM
                      </span>
                      <h4 className="text-sm font-bold text-white">{match.foundItem?.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{match.foundItem?.description}</p>
                    </div>
                  </div>

                  {/* Match Notes & Reported By */}
                  <div className="text-xs space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-400">
                      Reported by:{' '}
                      <span className="font-bold text-white">
                        {match.reportedBy?.firstName} {match.reportedBy?.lastName} ({match.reportedBy?.email})
                      </span>
                    </div>
                    {match.matchNotes && (
                      <div className="text-slate-300">
                        Notes: <span className="italic">{match.matchNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Resolve Actions */}
                  {match.status === 'PENDING' && (
                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        onClick={() => handleResolve(match.id, 'REJECTED')}
                        className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Reject Match
                      </button>

                      <button
                        onClick={() => handleResolve(match.id, 'APPROVED')}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve & Mark Returned
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
    </ProtectedRoute>
  );
}
