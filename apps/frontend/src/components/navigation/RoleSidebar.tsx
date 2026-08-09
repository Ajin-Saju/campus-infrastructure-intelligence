'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { getNavForRole, isRouteActive } from '../../navigation/navigation.utils';
import {
  LayoutDashboard,
  ShieldCheck,
  Wrench,
  Building2,
  Box,
  Briefcase,
  Users,
  Bell,
  TrendingUp,
  Search,
  FileText,
  Settings,
  Home,
  QrCode,
  PlusCircle,
  Clock,
  User,
  CheckCircle2,
  DollarSign,
  ChevronDown,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface RoleSidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  ShieldCheck,
  Wrench,
  Building2,
  Box,
  Briefcase,
  Users,
  Bell,
  TrendingUp,
  Search,
  FileText,
  Settings,
  Home,
  QrCode,
  PlusCircle,
  Clock,
  User,
  CheckCircle2,
  DollarSign,
};

export default function RoleSidebar({
  isOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: RoleSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const userRole =
    typeof user?.role === 'object' && user?.role
      ? (user.role as any).name
      : String(user?.role || 'STUDENT');
  const navItems = getNavForRole(userRole);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName || !ICON_MAP[iconName]) return <ShieldCheck className="w-4 h-4 shrink-0" />;
    const IconComp = ICON_MAP[iconName];
    return <IconComp className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-2xl border-r border-slate-800/80 p-3 transition-all duration-300 flex flex-col justify-between shadow-2xl ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <div className="space-y-5">
          {/* Sidebar Header Brand */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
            <Link
              href="/"
              onClick={onCloseMobile}
              className={`flex items-center gap-3 overflow-hidden transition-all ${
                isCollapsed ? 'md:justify-center' : ''
              }`}
              title="Campus Infrastructure Intelligence"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
                <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                </div>
              </div>

              {!isCollapsed && (
                <div className="hidden md:block text-left truncate">
                  <span className="font-extrabold text-sm text-white block tracking-tight leading-none">
                    Campus Infra
                  </span>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mt-0.5">
                    {userRole} Mode
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Expand / Collapse Toggle Button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all border border-slate-800"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-indigo-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-400" />
                )}
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white md:hidden rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-160px)] pr-0.5">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                Main Menu
              </span>
            )}

            {navItems.map((item) => {
              const active = isRouteActive(pathname || '/', item.route);
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItems[item.id] || active;

              return (
                <div key={item.id} className="space-y-1 relative group">
                  <div className="flex items-center justify-between">
                    <Link
                      href={item.route}
                      onClick={() => {
                        if (!hasChildren) onCloseMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`relative flex-1 flex items-center ${
                        isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2.5'
                      } rounded-xl text-xs font-semibold transition-all duration-200 ${
                        active
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-cyan-400 shadow-sm" />
                      )}

                      <span className={active ? 'text-white' : 'text-slate-400'}>
                        {renderIcon(item.icon)}
                      </span>

                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>

                    {hasChildren && !isCollapsed && (
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="p-2 text-slate-500 hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Sub-navigation Menu */}
                  {hasChildren && isExpanded && !isCollapsed && (
                    <div className="ml-5 pl-3 border-l border-slate-800/80 space-y-1 pt-1">
                      {item.children!.map((sub) => {
                        const subActive = pathname === sub.route.split('?')[0];
                        return (
                          <Link
                            key={sub.id}
                            href={sub.route}
                            onClick={onCloseMobile}
                            className={`block px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                              subActive
                                ? 'text-indigo-400 font-bold bg-indigo-500/10'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
