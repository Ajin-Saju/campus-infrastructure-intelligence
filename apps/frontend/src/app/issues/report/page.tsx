'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import {
  createIssueReport,
  fetchIssueCategories,
  IssueCategoryItem,
} from '../../../lib/issues-client';
import { validateAndResolveQr, QrResolutionResult } from '../../../lib/qr-client';
import { fetchBuildings, fetchBuildingById, BuildingItem } from '../../../lib/buildings-client';
import { fetchAssets, AssetItem } from '../../../lib/assets-client';
import { analyzeIssueText, LiveTextAnalysisResponse } from '../../../lib/ai-client';
import {
  AlertCircle,
  Building2,
  MapPin,
  Box,
  Layers,
  Upload,
  Image as ImageIcon,
  Film,
  X,
  CheckCircle,
  ArrowLeft,
  Send,
  Loader2,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

function ReportIssueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: authLoading, user } = useAuth();

  // Query Params from QR scan or navigation
  const qrDataParam = searchParams.get('qrData') || '';
  const buildingIdParam = searchParams.get('buildingId') || '';
  const roomIdParam = searchParams.get('roomId') || '';
  const assetIdParam = searchParams.get('assetId') || '';

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  // Location / Target selection state
  const [buildingId, setBuildingId] = useState(buildingIdParam);
  const [roomId, setRoomId] = useState(roomIdParam);
  const [assetId, setAssetId] = useState(assetIdParam);

  // Live AI Assistance state
  const [aiAnalysis, setAiAnalysis] = useState<LiveTextAnalysisResponse | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Resolved Location Info Card
  const [resolvedInfo, setResolvedInfo] = useState<QrResolutionResult | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  // Dropdown Metadata for manual fallback
  const [categories, setCategories] = useState<IssueCategoryItem[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);

  // Media state
  const [images, setImages] = useState<{ url: string; caption?: string }[]>([]);
  const [video, setVideo] = useState<{ fileName: string; fileUrl: string; fileType: string; fileSize?: number } | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Submit status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    loadCategoriesAndLocations();
  }, []);

  useEffect(() => {
    if (qrDataParam) {
      resolveQrLocation(qrDataParam);
    }
  }, [qrDataParam]);

  // Debounced Live AI Analysis
  useEffect(() => {
    if (!title.trim() || title.length < 3) {
      setAiAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAiAnalyzing(true);
      try {
        const res = await analyzeIssueText({
          title,
          description: description || title,
          buildingId,
          roomId,
          assetId,
        });
        setAiAnalysis(res);
        if (res.categorization?.code) {
          const matchCat = categories.find((c) => c.code === res.categorization.code);
          if (matchCat) setCategoryId(matchCat.id);
        }
        if (res.priority?.priority) {
          setPriority(res.priority.priority);
        }
      } catch (err: any) {
        if (err.message?.includes('token') || err.message?.includes('Unauthorized')) {
          router.push('/login');
        } else {
          console.error('Live AI analysis error:', err);
        }
      } finally {
        setIsAiAnalyzing(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description, buildingId, roomId, assetId, categories]);

  const loadCategoriesAndLocations = async () => {
    try {
      const [catList, bldRes, astRes] = await Promise.all([
        fetchIssueCategories(),
        fetchBuildings({ limit: 100 }),
        fetchAssets({ limit: 100 }),
      ]);
      setCategories(catList);
      setAssets(astRes.data);

      if (catList.length > 0 && !categoryId) {
        setCategoryId(catList[0].id);
      }

      // Fetch full building details including floors & rooms
      const fullBuildings = await Promise.all(
        bldRes.data.map((b) => fetchBuildingById(b.id).catch(() => b)),
      );
      setBuildings(fullBuildings);
    } catch (err) {
      console.error('Failed to load initial metadata:', err);
    }
  };

  const resolveQrLocation = async (payloadStr: string) => {
    setIsResolvingLocation(true);
    try {
      const result = await validateAndResolveQr(payloadStr);
      setResolvedInfo(result);
      if (result.building?.id) setBuildingId(result.building.id);
      if (result.room?.id) setRoomId(result.room.id);
      if (result.asset?.id) setAssetId(result.asset.id);
    } catch (err) {
      console.error('Failed to resolve location from QR payload:', err);
    } finally {
      setIsResolvingLocation(false);
    }
  };

  // Extract all available rooms with building reference
  const allRooms = buildings.flatMap((b) =>
    (b.floors || []).flatMap((f) =>
      (f.rooms || []).map((r) => ({
        ...r,
        buildingId: b.id,
        buildingName: b.name,
        floorName: f.name,
      })),
    ),
  );

  // Filter rooms based on selected building
  const availableRooms = allRooms.filter((r) =>
    buildingId ? r.buildingId === buildingId : true,
  );

  // Filter assets based on selected building and room
  const availableAssets = assets.filter((a) => {
    if (buildingId && a.buildingId && a.buildingId !== buildingId) return false;
    if (roomId && a.roomId && a.roomId !== roomId) return false;
    return true;
  });

  // Handle Multi-Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError('');

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files (JPG, PNG, WebP) are allowed for image uploads.');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setUploadError('Image size should be less than 50MB per file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [
            ...prev,
            { url: event.target!.result as string, caption: file.name },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Video Upload (Optional)
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError('');

    const file = files[0];
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Video file size must be under 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideo({
          fileName: file.name,
          fileUrl: event.target!.result as string,
          fileType: file.type,
          fileSize: file.size,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeVideo = () => {
    setVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setSubmitError('Please enter a brief issue title.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Please provide a description of the issue.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const created = await createIssueReport({
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || undefined,
        priority,
        buildingId: buildingId || undefined,
        roomId: roomId || undefined,
        assetId: assetId || undefined,
        images,
        attachments: video ? [video] : [],
      });

      router.push(`/issues/${created.id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit issue report. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/issues"
              className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link href="/" className="text-xs font-medium text-slate-400 hover:text-cyan-400">
                  Dashboard
                </Link>
                <span className="text-slate-600">/</span>
                <Link href="/issues" className="text-xs font-medium text-slate-400 hover:text-cyan-400">
                  My Reports
                </Link>
                <span className="text-slate-600">/</span>
                <span className="text-xs font-semibold text-rose-400">Report Issue</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mt-0.5">
                Submit Infrastructure Issue
              </h1>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            Reporter: <span className="font-semibold text-indigo-400">{user?.email || 'Student'}</span>
          </div>
        </div>

        {/* Location Banner (Pre-populated from QR code) */}
        {(resolvedInfo || isResolvingLocation || buildingId || roomId || assetId) && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Target Location & Asset Metadata
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                BOUND TO REPORT
              </span>
            </div>

            {isResolvingLocation ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Resolving location parameters...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Building */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium block flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    Building
                  </span>
                  <p className="font-semibold text-white mt-1">
                    {resolvedInfo?.building?.name ||
                      buildings.find((b) => b.id === buildingId)?.name ||
                      'Selected Building'}
                  </p>
                </div>

                {/* Room */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium block flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Room / Floor
                  </span>
                  <p className="font-semibold text-white mt-1">
                    {resolvedInfo?.room
                      ? `Room ${resolvedInfo.room.roomNumber} (${resolvedInfo.floor?.name || 'Floor'})`
                      : allRooms.find((r) => r.id === roomId)
                      ? `Room ${allRooms.find((r) => r.id === roomId)?.roomNumber} (${allRooms.find((r) => r.id === roomId)?.buildingName})`
                      : 'General Location'}
                  </p>
                </div>

                {/* Asset */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium block flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-amber-400" />
                    Identified Asset
                  </span>
                  <p className="font-semibold text-indigo-300 mt-1">
                    {resolvedInfo?.asset
                      ? `${resolvedInfo.asset.name} (${resolvedInfo.asset.assetTag})`
                      : assets.find((a) => a.id === assetId)
                      ? `${assets.find((a) => a.id === assetId)?.name} (${assets.find((a) => a.id === assetId)?.assetTag})`
                      : 'N/A (Room Issue)'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Issue Form Card */}
        <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {submitError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* AI Duplicate Detection Warning Alert */}
          {aiAnalysis?.duplicateDetection?.isDuplicate && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>AI Duplicate Warning Detected</span>
              </div>
              <p className="text-[11px] text-amber-200/90">
                {aiAnalysis.duplicateDetection.reasoning}
              </p>
            </div>
          )}

          {/* AI Live Predictions Banner */}
          {(aiAnalysis || isAiAnalyzing) && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-950/50 via-slate-950 to-slate-950 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                <span className="font-bold text-slate-200">AI Assistant:</span>
                {isAiAnalyzing ? (
                  <span className="text-slate-400">Analyzing issue text semantics...</span>
                ) : (
                  <span className="text-cyan-300">
                    Suggested Category: <strong>{aiAnalysis?.categorization?.categoryName}</strong> ({Math.round((aiAnalysis?.categorization?.confidenceScore || 0) * 100)}% confidence) | Priority: <strong>{aiAnalysis?.priority?.priority}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Title & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                Issue Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Broken Projector / Water Leak from AC unit..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-rose-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="sm:col-span-3 space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                Detailed Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe what is broken, precise location details, or any potential hazard..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">Priority Level</label>
              <div className="space-y-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`w-full py-2 px-3 text-left rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all ${
                      priority === p
                        ? p === 'CRITICAL'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : p === 'HIGH'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : p === 'MEDIUM'
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800 border-slate-600 text-slate-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{p}</span>
                    {priority === p && <CheckCircle className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Manual Location Selectors (if not set via QR) */}
          {!qrDataParam && (
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3 text-xs">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[11px]">
                Manual Location Override (Optional if QR not scanned)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Building</label>
                  <select
                    value={buildingId}
                    onChange={(e) => {
                      const newBldId = e.target.value;
                      setBuildingId(newBldId);
                      // Clear room if it doesn't belong to the newly selected building
                      if (roomId) {
                        const targetRoom = allRooms.find((r) => r.id === roomId);
                        if (targetRoom && targetRoom.buildingId !== newBldId) {
                          setRoomId('');
                        }
                      }
                      // Clear asset if it doesn't belong to the newly selected building
                      if (assetId) {
                        const targetAsset = assets.find((a) => a.id === assetId);
                        if (targetAsset && targetAsset.buildingId && targetAsset.buildingId !== newBldId) {
                          setAssetId('');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                  >
                    <option value="">-- Select Building --</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    Room {buildingId ? `(${availableRooms.length} available)` : ''}
                  </label>
                  <select
                    value={roomId}
                    onChange={(e) => {
                      const newRoomId = e.target.value;
                      setRoomId(newRoomId);
                      const targetRoom = allRooms.find((r) => r.id === newRoomId);
                      if (targetRoom && targetRoom.buildingId) {
                        setBuildingId(targetRoom.buildingId);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                  >
                    <option value="">-- Select Room --</option>
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} - {r.buildingName} ({r.floorName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    Asset {buildingId || roomId ? `(${availableAssets.length} available)` : ''}
                  </label>
                  <select
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                  >
                    <option value="">-- Select Asset --</option>
                    {availableAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.assetTag} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Media Attachments Section */}
          <div className="space-y-4 border-t border-slate-800 pt-5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              Upload Evidence Media
            </h3>

            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                {uploadError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Image Upload Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    Upload Photos (Multiple)
                  </span>
                  <span className="text-slate-500">{images.length} added</span>
                </div>

                <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 text-center bg-slate-950/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 text-xs text-slate-400">
                    <Upload className="w-5 h-5 text-indigo-400 mx-auto" />
                    <p className="font-medium text-slate-300">Click or drag images to upload</p>
                    <p className="text-[10px] text-slate-500">PNG, JPG, WebP up to 10MB each</p>
                  </div>
                </div>

                {/* Image Thumbnails Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-square">
                        <img src={img.url} alt="Uploaded evidence" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload Box (Optional) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    Upload Video (Optional)
                  </span>
                  <span className="text-slate-500">{video ? '1 added' : '0 added'}</span>
                </div>

                {!video ? (
                  <div className="relative border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-4 text-center bg-slate-950/40 transition-colors">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1 text-xs text-slate-400">
                      <Film className="w-5 h-5 text-amber-400 mx-auto" />
                      <p className="font-medium text-slate-300">Click to upload video recording</p>
                      <p className="text-[10px] text-slate-500">MP4, WebM, MOV up to 50MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-300 truncate max-w-[200px]">
                        {video.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <video src={video.fileUrl} controls className="w-full max-h-32 rounded-lg bg-black" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action Row */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Link
              href="/issues"
              className="px-5 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition-all"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Issue...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Issue Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReportIssuePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading issue report form...</span>
          </div>
        </main>
      }
    >
      <ReportIssueContent />
    </Suspense>
  );
}
