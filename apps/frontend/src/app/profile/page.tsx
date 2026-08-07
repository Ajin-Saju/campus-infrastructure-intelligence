'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { User, Shield, LogOut, CheckCircle, Clock } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  const displayRole =
    typeof user.role === 'object' && user.role !== null
      ? (user.role as any).name || 'User'
      : String(user.role || 'User');

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400 font-bold text-2xl">
                {user.firstName ? user.firstName[0] : 'U'}
                {user.lastName ? user.lastName[0] : ''}
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-3">
                {user.firstName} {user.lastName}
                <span className="px-3 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                  {displayRole}
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 font-medium text-sm rounded-xl flex items-center gap-2 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-400" />
              Account Details
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">User ID</span>
                <span className="font-mono text-xs text-slate-200">{user.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Full Name</span>
                <span className="text-slate-200">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Phone</span>
                <span className="text-slate-200">{user.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              Security & Role
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">RBAC Role</span>
                <span className="font-semibold text-cyan-400">{displayRole}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Email Status</span>
                {user.isEmailVerified ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    Pending Verification
                  </span>
                )}
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Session</span>
                <span className="text-emerald-400 text-xs font-medium">Active (JWT)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
