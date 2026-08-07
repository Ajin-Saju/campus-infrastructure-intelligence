'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import { fetchUserById, UserItem } from '../../../lib/users-client';
import {
  User,
  Shield,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const [user, setUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const u = await fetchUserById(userId);
        setUser(u);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Loading user details...</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen p-6 bg-slate-950 text-slate-200 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">User Not Found</h2>
          <p className="text-sm text-slate-400">
            {error || 'The requested user could not be found.'}
          </p>
          <Link
            href="/users"
            className="inline-block py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all"
          >
            Return to User List
          </Link>
        </div>
      </div>
    );
  }

  const roleName = typeof user.role === 'object' ? user.role.name : String(user.role);

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <Link
              href="/users"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
                <div className="h-full w-full bg-slate-950 rounded-[12px] flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-cyan-400 text-lg">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-3">
                  {user.firstName} {user.lastName}
                  <span className="px-3 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                    {roleName}
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
              </div>
            </div>
          </div>

          <Link
            href={`/users/${user.id}/edit`}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>

        {/* User Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-400" />
              Personal & Contact Details
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">User ID</span>
                <span className="font-mono text-xs text-slate-200">{user.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Email Address</span>
                <span className="text-slate-200">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Phone Number</span>
                <span className="text-slate-200">{user.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-200">{user.department?.name || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              Role & Account Status
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Role</span>
                <span className="font-semibold text-cyan-400">{roleName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Account Status</span>
                {user.isActive ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-rose-400 text-xs font-medium">
                    <XCircle className="h-3.5 w-3.5" /> Inactive
                  </span>
                )}
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Email Verified</span>
                {user.isEmailVerified ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5" /> Pending
                  </span>
                )}
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Created At</span>
                <span className="text-slate-200 text-xs font-mono">
                  {new Date(user.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs Timeline */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            Recent Activity Logs
          </h3>

          {!user.activityLogs || user.activityLogs.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-2">
              No activity logs recorded for this user.
            </p>
          ) : (
            <div className="space-y-3">
              {user.activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                    <span className="font-semibold text-slate-200 font-mono">{log.action}</span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
