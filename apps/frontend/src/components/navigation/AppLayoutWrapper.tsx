'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import AppHeader from './AppHeader';
import RoleSidebar from './RoleSidebar';

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // If unauthenticated or on login page, render standard full-screen view
  const isAuthPage = pathname === '/login';

  if (isAuthPage || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Role-Based Sidebar */}
      <RoleSidebar
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isDesktopCollapsed}
        onToggleCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
      />

      {/* Main Content Layout Container */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isDesktopCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Common Header */}
        <AppHeader
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isDesktopCollapsed={isDesktopCollapsed}
          onToggleDesktopCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        />

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 transition-all">{children}</main>
      </div>
    </div>
  );
}
