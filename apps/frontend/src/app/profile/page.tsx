'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { updateUserAvatar } from '../../lib/users-client';
import {
  User,
  Shield,
  LogOut,
  CheckCircle,
  Clock,
  Users,
  Building2,
  Camera,
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout, setUser } = useAuth();

  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrlInput(user.avatarUrl);
      setPreviewUrl(user.avatarUrl);
    }
  }, [user]);

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

  const openAvatarModal = () => {
    setAvatarUrlInput(user.avatarUrl || '');
    setPreviewUrl(user.avatarUrl || '');
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditingAvatar(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP, GIF)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 2MB');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrlInput(result);
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async (urlToSave: string) => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      await updateUserAvatar(user.id, urlToSave);
      setUser({
        ...user,
        avatarUrl: urlToSave,
      });
      setSuccessMsg('Profile picture updated successfully!');
      setTimeout(() => {
        setIsEditingAvatar(false);
        setSuccessMsg('');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile picture');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    await handleSaveAvatar('');
  };

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 overflow-hidden">
                <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400 font-bold text-2xl overflow-hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {user.firstName ? user.firstName[0] : 'U'}
                      {user.lastName ? user.lastName[0] : ''}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={openAvatarModal}
                className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border-2 border-slate-950 transition-all shadow-md hover:scale-105"
                title="Edit profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-3">
                {user.firstName} {user.lastName}
                <span className="px-3 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                  {displayRole}
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
              <button
                onClick={openAvatarModal}
                className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Change Profile Image
              </button>
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

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/users"
            className="p-5 bg-slate-900/80 hover:bg-slate-800/80 backdrop-blur-xl border border-slate-800 rounded-2xl flex items-center justify-between group transition-all shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                  User Management
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage accounts, roles, and status</p>
              </div>
            </div>
          </Link>

          <Link
            href="/buildings"
            className="p-5 bg-slate-900/80 hover:bg-slate-800/80 backdrop-blur-xl border border-slate-800 rounded-2xl flex items-center justify-between group transition-all shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Building Hierarchy
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage Buildings, Floors, and Rooms</p>
              </div>
            </div>
          </Link>
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

      {/* Edit Avatar Modal */}
      {isEditingAvatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                Update Profile Picture
              </h2>
              <button
                onClick={() => setIsEditingAvatar(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar Preview */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/20 overflow-hidden">
                <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400 font-bold text-3xl overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Avatar Preview"
                      className="h-full w-full object-cover"
                      onError={() => setErrorMsg('Failed to load image from URL')}
                    />
                  ) : (
                    <span>
                      {user.firstName ? user.firstName[0] : 'U'}
                      {user.lastName ? user.lastName[0] : ''}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-400">Image Preview</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                {successMsg}
              </div>
            )}

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Choose Preset
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatarUrlInput(url);
                      setPreviewUrl(url);
                      setErrorMsg('');
                    }}
                    className={`h-11 w-11 rounded-xl overflow-hidden border-2 transition-all ${
                      previewUrl === url
                        ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/20'
                        : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Preset ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload & URL Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Upload Image File
                </label>
                <label className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl cursor-pointer text-xs text-slate-300 transition-colors">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  Choose File from Computer
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Or Image Web URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={avatarUrlInput}
                    onChange={(e) => {
                      setAvatarUrlInput(e.target.value);
                      setPreviewUrl(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <ImageIcon className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {user.avatarUrl ? (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isSaving}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-xl border border-rose-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingAvatar(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAvatar(avatarUrlInput)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
