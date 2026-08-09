'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { generateBreadcrumbs } from '../../navigation/navigation.utils';
import GlobalSearchBar from '../GlobalSearchBar';
import NotificationDropdown from '../NotificationDropdown';
import {
  Menu,
  ChevronRight,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface AppHeaderProps {
  onToggleMobileSidebar: () => void;
  isDesktopCollapsed?: boolean;
  onToggleDesktopCollapse?: () => void;
}

export default function AppHeader({
  onToggleMobileSidebar,
  isDesktopCollapsed = false,
  onToggleDesktopCollapse,
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const breadcrumbs = generateBreadcrumbs(pathname || '/');
  const userRole =
    typeof user?.role === 'object' && user?.role
      ? (user.role as any).name
      : String(user?.role || '');

  const pageTitle =
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 1].label : 'Overview';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3 transition-all duration-200 flex items-center justify-between gap-4 shadow-sm">
      {/* Left: Mobile Toggle, Desktop Collapse Toggle & Page Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile Navigation Drawer Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700/80 md:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>



        <div className="hidden sm:block space-y-0.5">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-[11px] text-slate-400">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                {b.route && idx < breadcrumbs.length - 1 ? (
                  <Link href={b.route} className="hover:text-indigo-400 transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-200">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          <h1 className="text-lg font-extrabold text-white tracking-tight leading-none">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Global Search, Notifications & User Avatar Menu */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        {user && <GlobalSearchBar />}

        {/* Real-time Notifications */}
        {user && <NotificationDropdown />}

        {/* User Profile Avatar Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1.5 bg-slate-950 border border-slate-800/90 rounded-xl hover:border-slate-700 transition-all text-left group shadow-sm"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 overflow-hidden shrink-0">
                <div className="h-full w-full bg-slate-950 rounded-[6px] flex items-center justify-center text-xs font-bold text-cyan-400">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User" className="h-full w-full object-cover" />
                  ) : (
                    <span>{user.firstName ? user.firstName[0] : 'U'}</span>
                  )}
                </div>
              </div>

              <div className="hidden lg:block text-xs text-left">
                <span className="font-bold text-white block leading-none">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[10px] text-indigo-400 font-semibold">{userRole}</span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setIsProfileMenuOpen(false)}
              >
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-xs font-bold text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Role: {userRole}
                  </span>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="p-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors block"
                >
                  <User className="w-4 h-4 text-indigo-400" />
                  My Profile & Settings
                </Link>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full p-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
