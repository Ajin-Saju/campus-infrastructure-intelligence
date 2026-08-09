'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NotificationItem,
} from '../../lib/notification-client';
import {
  Bell,
  CheckCheck,
  Search,
  Wrench,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Filter,
} from 'lucide-react';

export default function NotificationCenterPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'assigned' | 'status' | 'vendor' | 'priority'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const list = await fetchUserNotifications(100);
      setNotifications(list);
    } catch (err) {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      // Error
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      // Error
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      // Error
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'unread':
        return !n.read;
      case 'assigned':
        return n.type === 'ISSUE_ASSIGNED' || n.type === 'TASK_ASSIGNMENT';
      case 'status':
        return n.type === 'STATUS_CHANGED' || n.type === 'ISSUE_COMPLETED';
      case 'vendor':
        return n.type === 'VENDOR_ASSIGNED';
      case 'priority':
        return n.type === 'PRIORITY_CHANGED';
      default:
        return true;
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ISSUE_ASSIGNED':
      case 'TASK_ASSIGNMENT':
        return <Wrench className="w-5 h-5 text-indigo-400" />;
      case 'STATUS_CHANGED':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'ISSUE_COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'VENDOR_ASSIGNED':
        return <Briefcase className="w-5 h-5 text-purple-400" />;
      case 'PRIORITY_CHANGED':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-cyan-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Loading Notification Center...</span>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xs font-medium text-slate-400 hover:text-indigo-400">
                Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-semibold text-indigo-400">Notification Center</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-400" />
              Notification Center
            </h1>
            <p className="text-xs text-slate-400">
              Real-time alert history for issue assignments, status updates, completion & vendor tasks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All as Read ({unreadCount})
              </button>
            )}
          </div>
        </div>

        {/* Filters & Tabs */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All ({notifications.length})
              </button>

              <button
                onClick={() => setActiveTab('unread')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'unread'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Unread ({unreadCount})
              </button>

              <button
                onClick={() => setActiveTab('assigned')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'assigned'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Assignments
              </button>

              <button
                onClick={() => setActiveTab('status')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'status'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Status Changes
              </button>

              <button
                onClick={() => setActiveTab('vendor')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'vendor'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Vendor
              </button>

              <button
                onClick={() => setActiveTab('priority')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'priority'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Priority
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Bell className="w-10 h-10 mx-auto text-slate-700 opacity-50" />
                <p className="text-xs font-medium">No notifications matching your filter criteria.</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    !n.read
                      ? 'bg-indigo-950/20 border-indigo-500/30'
                      : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                      {getTypeIcon(n.type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{n.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {n.link && (
                      <Link
                        href={n.link}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-lg"
                      >
                        Mark read
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
