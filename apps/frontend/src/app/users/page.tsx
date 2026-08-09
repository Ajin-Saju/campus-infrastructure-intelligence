'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { fetchUsers, deleteUser, UserItem, PaginatedUsersResponse } from '../../lib/users-client';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function UserListPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <UserListPageContent />
    </ProtectedRoute>
  );
}

function UserListPageContent() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();

  const [usersData, setUsersData] = useState<PaginatedUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  // Deletion modal state
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isActiveFilter =
        selectedStatus === 'ACTIVE' ? true : selectedStatus === 'INACTIVE' ? false : undefined;

      const response = await fetchUsers({
        search: search.trim() || undefined,
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
        isActive: isActiveFilter,
        page,
        limit: 10,
      });
      setUsersData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load user list.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedRole, selectedStatus, page]);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/login');
      } else {
        loadUsers();
      }
    }
  }, [authLoading, currentUser, router, loadUsers]);

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  const handleDeleteConfirmed = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setSuccessMsg(
        `User "${userToDelete.firstName} ${userToDelete.lastName}" soft-deleted successfully.`,
      );
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeClass = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return 'bg-purple-500/20 border-purple-500/30 text-purple-300';
      case 'FACULTY':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      case 'TECHNICIAN':
      case 'MAINTENANCE_STAFF':
        return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
      case 'VENDOR':
        return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
      default:
        return 'bg-slate-500/20 border-slate-500/30 text-slate-300';
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                User Management
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Manage accounts, assigned roles, permissions, and active status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => loadUsers()}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
              title="Refresh list"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/users/new"
              className="py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4" />
              Create User
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs underline hover:text-rose-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-xs underline hover:text-emerald-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4">
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, or phone..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="sm:col-span-3 relative">
            <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="TECHNICIAN">Maintenance Staff</option>
              <option value="VENDOR">Vendor</option>
            </select>
          </div>

          <div className="sm:col-span-4 relative">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="h-8 w-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm">Loading users...</p>
            </div>
          ) : !usersData || usersData.data.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Users className="h-10 w-10 mx-auto text-slate-600" />
              <p className="text-base font-semibold text-slate-300">No users found</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Try adjusting your search keywords or role filters to find user accounts.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">User</th>
                    <th className="py-3.5 px-6">Role</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Joined Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {usersData.data.map((u) => {
                    const roleName = typeof u.role === 'object' ? u.role.name : String(u.role);
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.firstName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="font-semibold text-cyan-400 text-sm">
                                  {u.firstName[0]}
                                  {u.lastName[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-200">
                                {u.firstName} {u.lastName}
                              </div>
                              <div className="text-xs text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeClass(
                              roleName,
                            )}`}
                          >
                            {roleName}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <XCircle className="h-3.5 w-3.5" /> Inactive
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-slate-400 text-xs font-mono">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/users/${u.id}`}
                              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            <Link
                              href={`/users/${u.id}/edit`}
                              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>

                            <button
                              onClick={() => setUserToDelete(u)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {usersData && usersData.meta.totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-sm text-slate-400">
              <div>
                Showing Page{' '}
                <span className="font-semibold text-slate-200">{usersData.meta.page}</span> of{' '}
                <span className="font-semibold text-slate-200">{usersData.meta.totalPages}</span> (
                {usersData.meta.total} Total Users)
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= usersData.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete User</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Are you sure you want to soft-delete user{' '}
                  <span className="font-semibold text-slate-200">
                    &quot;{userToDelete.firstName} {userToDelete.lastName}&quot;
                  </span>
                  ? This will deactivate their account.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
