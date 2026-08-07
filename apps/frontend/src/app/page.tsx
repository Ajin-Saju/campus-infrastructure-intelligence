'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/auth-context';
import {
  ShieldCheck,
  LogIn,
  UserPlus,
  KeyRound,
  Users,
  Building2,
  User,
  LogOut,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const { user, isLoading, logout } = useAuth();

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-xl w-full text-center space-y-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 shadow-2xl shadow-indigo-950/40">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 mb-4 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Campus Infrastructure Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-2">Campus Infrastructure Management Portal</p>
        </div>

        {isLoading ? (
          <div className="py-6 flex items-center justify-center gap-3 text-slate-400 text-sm">
            <div className="h-4 w-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            Loading authentication status...
          </div>
        ) : user ? (
          /* Logged In View */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-center text-cyan-400 font-bold overflow-hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-medium border border-rose-500/20 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/profile"
                className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 flex flex-col items-center justify-center gap-2 transition-all shadow-md"
              >
                <User className="h-5 w-5 text-indigo-400" />
                My Profile
              </Link>

              <Link
                href="/users"
                className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 flex flex-col items-center justify-center gap-2 transition-all shadow-md"
              >
                <Users className="h-5 w-5 text-indigo-400" />
                User Management
              </Link>

              <Link
                href="/buildings"
                className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 flex flex-col items-center justify-center gap-2 transition-all shadow-md"
              >
                <Building2 className="h-5 w-5 text-cyan-400" />
                Building Hierarchy
              </Link>
            </div>
          </div>
        ) : (
          /* Not Logged In View */
          <div className="space-y-6">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Sign in to access User Management & Building Hierarchy
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/login"
                className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 flex flex-col items-center justify-center gap-2 transition-all"
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </Link>

              <Link
                href="/login"
                className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-medium text-sm border border-slate-800 flex flex-col items-center justify-center gap-2 transition-all relative group"
              >
                <Lock className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                <span className="group-hover:text-slate-200 transition-colors">
                  User Management
                </span>
              </Link>

              <Link
                href="/login"
                className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-medium text-sm border border-slate-800 flex flex-col items-center justify-center gap-2 transition-all relative group"
              >
                <Lock className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <span className="group-hover:text-slate-200 transition-colors">
                  Building Hierarchy
                </span>
              </Link>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex justify-center gap-6 text-sm text-slate-400">
          {!user && (
            <Link
              href="/register"
              className="hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Register Account
            </Link>
          )}
          <Link
            href="/forgot-password"
            className="hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="h-4 w-4" />
            Forgot Password
          </Link>
        </div>
      </div>
    </main>
  );
}
