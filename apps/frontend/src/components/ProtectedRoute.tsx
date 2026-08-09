'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/auth-context';
import { ShieldAlert, ArrowLeft, Lock, Home } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Verifying role-based authorizations...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated user -> Redirect to login prompt
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Authentication Required</h2>
            <p className="text-xs text-slate-400">
              Please sign in to access this section of Campus Infrastructure Intelligence.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold text-xs rounded-xl shadow-lg hover:from-indigo-500 hover:to-cyan-500 transition-all block"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  const userRoleName = typeof user.role === 'object' && user.role ? (user.role as any).name : String(user.role || '');

  // Unauthorized role -> Access Denied Screen (403 Forbidden)
  if (!allowedRoles.includes(userRoleName)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-rose-950/20">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 inline-block">
              403 FORBIDDEN &bull; ACCESS DENIED
            </span>
            <h2 className="text-xl font-bold text-white">Unauthorized Page Access</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your logged-in role (<strong className="text-rose-300">{userRoleName}</strong>) does not have authorization to view this resource.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Home className="w-4 h-4" /> Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authorized -> Render page content
  return <>{children}</>;
}
