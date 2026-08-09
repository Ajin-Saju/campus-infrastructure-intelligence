'use client';

import Link from 'next/link';
import { useAuth } from '../context/auth-context';
import {
  ShieldCheck,
  LogIn,
  UserPlus,
  KeyRound,
  Users,
  Building2,
  Box,
  QrCode,
  User,
  LogOut,
  Lock,
  ArrowRight,
  Wrench,
  Briefcase,
  LayoutDashboard,
  PackageSearch,
} from 'lucide-react';

import NotificationDropdown from '../components/NotificationDropdown';
import GlobalSearchBar from '../components/GlobalSearchBar';

export default function HomePage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  // Authenticated View: Full-width responsive dashboard layout inside AppLayoutWrapper
  if (user) {
    const userRoleStr =
      typeof user.role === 'object' ? (user.role as any)?.name : user.role || 'STUDENT';

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Signed In as {user.firstName} {user.lastName} ({userRoleStr})
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                Access campus infrastructure tools, manage asset lifecycles, inspect maintenance workflows, and report issues seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Modules Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-indigo-400" />
              Infrastructure Management Hub
            </h2>
            <span className="text-xs text-slate-400">Available Modules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* 1. User Management (ADMIN Only) */}
            {(userRoleStr === 'ADMIN') && (
              <Link
                href="/users"
                className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-indigo-500/30 hover:border-indigo-500/60 flex flex-col justify-between gap-4 transition-all group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors block">
                    User Management
                  </span>
                  <span className="text-xs text-slate-400">Manage Accounts & Roles</span>
                </div>
              </Link>
            )}

            {/* 2. Building Hierarchy (ADMIN & TECHNICIAN Only) */}
            {['ADMIN', 'TECHNICIAN'].includes(userRoleStr) && (
              <Link
                href="/buildings"
                className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-cyan-500/30 hover:border-cyan-500/60 flex flex-col justify-between gap-4 transition-all group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors block">
                    Building Hierarchy
                  </span>
                  <span className="text-xs text-slate-400">Buildings, Floors & Rooms</span>
                </div>
              </Link>
            )}

            {/* 3. Asset Management (ADMIN & TECHNICIAN Only) */}
            {['ADMIN', 'TECHNICIAN'].includes(userRoleStr) && (
              <Link
                href="/assets"
                className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-emerald-500/30 hover:border-emerald-500/60 flex flex-col justify-between gap-4 transition-all group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                    <Box className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors block">
                    Asset Management
                  </span>
                  <span className="text-xs text-slate-400">Categories, Images & Lifecycle</span>
                </div>
              </Link>
            )}

            {/* 4. QR Code Hub */}
            <Link
              href="/qr-code"
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-amber-500/30 hover:border-amber-500/60 flex flex-col justify-between gap-4 transition-all group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                  <QrCode className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors block">
                  QR Code Hub
                </span>
                <span className="text-xs text-slate-400">Generate, Download & Scan</span>
              </div>
            </Link>

            {/* 5. My Issue Reports */}
            <Link
              href="/issues"
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-rose-500/30 hover:border-rose-500/60 flex flex-col justify-between gap-4 transition-all group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-100 group-hover:text-rose-300 transition-colors block">
                  My Issue Reports
                </span>
                <span className="text-xs text-slate-400">Track & View Reported Issues</span>
              </div>
            </Link>

            {/* 6. Report Issue */}
            <Link
              href="/issues/report"
              className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 hover:from-rose-900/40 text-slate-200 border border-rose-500/40 hover:border-rose-400 flex flex-col justify-between gap-4 transition-all group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
                  <QrCode className="h-6 w-6 text-amber-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-rose-300 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <span className="font-bold text-sm text-rose-300 group-hover:text-rose-200 transition-colors block">
                  Report Issue
                </span>
                <span className="text-xs text-slate-400">Scan QR or Submit Report</span>
              </div>
            </Link>

            {/* 7. Executive Dashboard */}
            <Link
              href="/dashboard"
              className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 hover:from-indigo-900/40 text-slate-200 border border-indigo-500/40 hover:border-indigo-400 flex flex-col justify-between gap-4 transition-all group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="h-6 w-6 text-indigo-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <span className="font-bold text-sm text-indigo-300 group-hover:text-indigo-200 transition-colors block">
                  Executive Dashboard
                </span>
                <span className="text-xs text-slate-400">Recharts Visual Analytics</span>
              </div>
            </Link>

            {/* 8. Maintenance Hub (ADMIN & TECHNICIAN Only) */}
            {['ADMIN', 'TECHNICIAN'].includes(userRoleStr) && (
              <Link
                href="/maintenance"
                className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-indigo-500/40 hover:border-indigo-400 flex flex-col justify-between gap-4 transition-all group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors block">
                    Maintenance Hub
                  </span>
                  <span className="text-xs text-slate-400">Workflow & Tasks</span>
                </div>
              </Link>
            )}

            {/* 9. Vendor Management (ADMIN & VENDOR Only) */}
            {['ADMIN', 'VENDOR'].includes(userRoleStr) && (
              <Link
                href="/vendors"
                className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-purple-500/40 hover:border-purple-400 flex flex-col justify-between gap-4 transition-all group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors block">
                    Vendor Management
                  </span>
                  <span className="text-xs text-slate-400">Quotations & Invoices</span>
                </div>
              </Link>
            )}

            {/* 10. Lost & Found Hub (All Roles) */}
            <Link
              href="/lost-found"
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-teal-500/30 hover:border-teal-500/60 flex flex-col justify-between gap-4 transition-all group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400 group-hover:scale-110 transition-transform">
                  <PackageSearch className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-100 group-hover:text-teal-300 transition-colors block">
                  Lost & Found Hub
                </span>
                <span className="text-xs text-slate-400">Report & Claim Lost Items</span>
              </div>
            </Link>

            {/* 11. My Profile */}
            <Link
              href="/profile"
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 flex flex-col justify-between gap-4 transition-all group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-700/30 rounded-xl text-slate-300 group-hover:scale-110 transition-transform">
                  <User className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors block">
                  My Profile
                </span>
                <span className="text-xs text-slate-400">View & Edit Profile</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated Guest View: Full-screen landing card
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-4xl w-full text-center space-y-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-indigo-950/40 relative">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 mb-4 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Campus Infrastructure Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise AI-Powered Campus Infrastructure System
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-center gap-2.5 text-center">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              Please <strong>Sign In</strong> to access User Management & Building Hierarchy.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/login"
              className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all group"
            >
              Sign In
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/register"
              className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <UserPlus className="h-4 w-4 text-indigo-400" />
              Register Account
            </Link>
          </div>

          <div className="pt-2 flex justify-center text-xs text-slate-400">
            <Link
              href="/forgot-password"
              className="hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
