'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { updateUserAvatar, updateUser } from '../../lib/users-client';
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
  Eye,
  Edit,
  Phone,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout, setUser } = useAuth();

  // Avatar Modal State
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isViewingImage, setIsViewingImage] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarErrorMsg, setAvatarErrorMsg] = useState('');
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState('');

  // Profile Info Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      if (user.avatarUrl) {
        setAvatarUrlInput(user.avatarUrl);
        setPreviewUrl(user.avatarUrl);
      }
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
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

  // Open Avatar Modal
  const openAvatarModal = () => {
    setAvatarUrlInput(user.avatarUrl || '');
    setPreviewUrl(user.avatarUrl || '');
    setAvatarErrorMsg('');
    setAvatarSuccessMsg('');
    setIsEditingAvatar(true);
  };

  // Upload Local File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarErrorMsg('Please select a valid image file (PNG, JPG, WebP, GIF)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setAvatarErrorMsg('Image size should be less than 3MB');
      return;
    }

    setAvatarErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrlInput(result);
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Save Avatar Update
  const handleSaveAvatar = async (urlToSave: string) => {
    setIsSavingAvatar(true);
    setAvatarErrorMsg('');
    try {
      await updateUserAvatar(user.id, urlToSave);
      setUser({
        ...user,
        avatarUrl: urlToSave,
      });
      setAvatarSuccessMsg('Profile picture updated successfully!');
      setTimeout(() => {
        setIsEditingAvatar(false);
        setAvatarSuccessMsg('');
      }, 1000);
    } catch (err: any) {
      setAvatarErrorMsg(err.message || 'Failed to update profile picture');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Save Profile Info Update
  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileErrorMsg('');
    try {
      const updated = await updateUser(user.id, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone || undefined,
      });
      setUser({
        ...user,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
      });
      setProfileSuccessMsg('Profile details updated successfully!');
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSuccessMsg('');
      }, 1000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile details');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl gap-4">
          <div className="flex items-center gap-5">
            {/* Avatar Frame with Controls */}
            <div className="relative group">
              <div
                onClick={() => user.avatarUrl && setIsViewingImage(true)}
                className={`h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 overflow-hidden ${user.avatarUrl ? 'cursor-pointer' : ''
                  }`}
                title={user.avatarUrl ? 'Click to view full image' : 'Profile Picture'}
              >
                <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400 font-bold text-2xl overflow-hidden relative">
                  {user.avatarUrl ? (
                    <>
                      <img
                        src={user.avatarUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <span>
                      {user.firstName ? user.firstName[0] : 'U'}
                      {user.lastName ? user.lastName[0] : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Camera Action Button */}
              <button
                onClick={openAvatarModal}
                className="absolute -bottom-1.5 -right-1.5 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border-2 border-slate-950 transition-all shadow-md hover:scale-110"
                title="Edit profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile User Info */}
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-3">
                {user.firstName} {user.lastName}
                <span className="px-3 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                  {displayRole}
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>

              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={openAvatarModal}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {user.avatarUrl ? 'Change Picture' : 'Upload Picture'}
                </button>

                {user.avatarUrl && (
                  <>
                    <span className="text-slate-700">•</span>
                    <button
                      onClick={() => setIsViewingImage(true)}
                      className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Image
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-medium text-sm rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              <Edit className="h-4 w-4 text-indigo-400" />
              Edit Profile
            </button>

            <button
              onClick={() => logout()}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 font-medium text-sm rounded-xl flex items-center gap-2 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>


        {/* User Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-400" />
                Account Details
              </h3>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Edit
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">User ID</span>
                <span className="font-mono text-xs text-slate-200">{user.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Full Name</span>
                <span className="text-slate-200 font-medium">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Email Address</span>
                <span className="text-slate-200">{user.email}</span>
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

      {/* ========================================== */}
      {/* MODAL 1: EDIT PROFILE DETAILS              */}
      {/* ========================================== */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Edit className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Edit Profile Details</h3>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileErrorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfileInfo} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">First Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Last Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: EDIT AVATAR / PROFILE PICTURE     */}
      {/* ========================================== */}
      {isEditingAvatar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Update Profile Picture</h3>
              </div>
              <button
                onClick={() => setIsEditingAvatar(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {avatarErrorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{avatarErrorMsg}</span>
              </div>
            )}

            {avatarSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{avatarSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Preset Avatars Selection */}
              <div>
                <label className="block text-slate-400 mb-2 font-semibold">Choose Preset Avatar</label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAvatarUrlInput(url);
                        setPreviewUrl(url);
                      }}
                      className={`h-12 w-12 rounded-xl overflow-hidden border-2 transition-all ${previewUrl === url ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30' : 'border-slate-800 hover:border-slate-600'
                        }`}
                    >
                      <img src={url} alt="Preset" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload File */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Or Upload Local Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              {/* Custom Image URL */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Or Image URL</label>
                <input
                  type="text"
                  value={avatarUrlInput}
                  onChange={(e) => {
                    setAvatarUrlInput(e.target.value);
                    setPreviewUrl(e.target.value);
                  }}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                  <img src={previewUrl} alt="Preview" className="h-12 w-12 rounded-xl object-cover border border-slate-700" />
                  <span className="text-slate-400 text-xs">Preview of new profile picture</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingAvatar(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingAvatar || !previewUrl}
                  onClick={() => handleSaveAvatar(previewUrl)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {isSavingAvatar ? 'Saving...' : 'Apply Picture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================== */}
      {/* MODAL 3: VIEW FULL PROFILE IMAGE           */}
      {/* ========================================== */}
      {isViewingImage && user.avatarUrl && (
        <div
          onClick={() => setIsViewingImage(false)}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 px-2">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  {user.firstName} {user.lastName}'s Profile Picture
                </h3>
              </div>
              <button
                onClick={() => setIsViewingImage(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-square max-h-[70vh] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <img
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400">
              <span>Full Resolution View</span>
              <button
                onClick={() => {
                  setIsViewingImage(false);
                  openAvatarModal();
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                Change Picture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
