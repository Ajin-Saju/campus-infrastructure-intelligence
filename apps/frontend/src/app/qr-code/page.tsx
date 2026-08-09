'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import {
  generateRoomQr,
  fetchRoomQr,
  generateAssetQr,
  fetchAssetQr,
  validateAndResolveQr,
  QrCodeRecord,
  QrResolutionResult,
} from '../../lib/qr-client';
import { fetchBuildings, fetchBuildingById, BuildingItem } from '../../lib/buildings-client';
import { fetchAssets, AssetItem } from '../../lib/assets-client';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  QrCode as QrIcon,
  Camera,
  Download,
  RefreshCw,
  Search,
  Building2,
  MapPin,
  Box,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Upload,
  ArrowLeft,
  Eye,
  ShieldCheck,
  Tag,
  Calendar,
  Layers,
  Copy,
  Check,
} from 'lucide-react';

export default function QrCodeManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = roleName === 'ADMIN';

  // Active Tab: 'generator' | 'scanner'
  const [activeTab, setActiveTab] = useState<'generator' | 'scanner'>('scanner');

  // Generator State
  const [targetType, setTargetType] = useState<'ROOM' | 'ASSET'>('ASSET');
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);

  // Selection
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Generated QR result
  const [activeQrRecord, setActiveQrRecord] = useState<QrCodeRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanInputText, setScanInputText] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [scanResult, setScanResult] = useState<QrResolutionResult | null>(null);
  const [scanError, setScanError] = useState('');

  // Camera Ref
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = 'qr-reader-region';

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (isAdmin) {
        setActiveTab('generator');
        loadMetadata();
      } else {
        setActiveTab('scanner');
      }
    }
  }, [user, authLoading, router, isAdmin]);

  const loadMetadata = async () => {
    try {
      const [bldRes, astRes] = await Promise.all([
        fetchBuildings({ limit: 100 }),
        fetchAssets({ limit: 100 }),
      ]);
      setAssets(astRes.data);

      const fullBuildings = await Promise.all(
        bldRes.data.map((b) => fetchBuildingById(b.id).catch(() => b)),
      );
      setBuildings(fullBuildings);

      if (astRes.data.length > 0) {
        setSelectedAssetId(astRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load buildings/assets:', err);
    }
  };

  // Helper to extract rooms list from buildings
  const allRooms = buildings.flatMap((b) =>
    (b.floors || []).flatMap((f) =>
      (f.rooms || []).map((r) => ({
        ...r,
        buildingName: b.name,
        floorName: f.name,
      })),
    ),
  );

  // Auto-generate QR when selection changes in Generator (Admin only)
  useEffect(() => {
    if (activeTab === 'generator' && isAdmin) {
      if (targetType === 'ASSET' && selectedAssetId) {
        handleFetchOrGenerateAssetQr(selectedAssetId, false);
      } else if (targetType === 'ROOM' && selectedRoomId) {
        handleFetchOrGenerateRoomQr(selectedRoomId, false);
      }
    }
  }, [targetType, selectedAssetId, selectedRoomId, activeTab, isAdmin]);

  const handleFetchOrGenerateAssetQr = async (assetId: string, regenerate: boolean) => {
    if (!assetId) return;
    setIsGenerating(true);
    setGenError('');
    try {
      const record = regenerate
        ? await generateAssetQr(assetId, true)
        : await fetchAssetQr(assetId);
      setActiveQrRecord(record);
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate Asset QR Code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFetchOrGenerateRoomQr = async (roomId: string, regenerate: boolean) => {
    if (!roomId) return;
    setIsGenerating(true);
    setGenError('');
    try {
      const record = regenerate
        ? await generateRoomQr(roomId, true)
        : await fetchRoomQr(roomId);
      setActiveQrRecord(record);
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate Room QR Code');
    } finally {
      setIsGenerating(false);
    }
  };

  // Single Click Download PNG
  const handleDownloadPng = () => {
    if (!activeQrRecord?.qrImageUrl) return;
    const link = document.createElement('a');
    link.href = activeQrRecord.qrImageUrl;
    const filename =
      targetType === 'ASSET'
        ? `QR_ASSET_${activeQrRecord.asset?.assetTag || 'CODE'}.png`
        : `QR_ROOM_${activeQrRecord.room?.roomNumber || 'CODE'}.png`;
    link.download = filename;
    link.click();
  };

  // Single Click Download SVG
  const handleDownloadSvg = async () => {
    if (!activeQrRecord?.qrCodeData) return;
    try {
      const svgString = await QRCode.toString(activeQrRecord.qrCodeData, { type: 'svg' });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename =
        targetType === 'ASSET'
          ? `QR_ASSET_${activeQrRecord.asset?.assetTag || 'CODE'}.svg`
          : `QR_ROOM_${activeQrRecord.room?.roomNumber || 'CODE'}.svg`;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export SVG QR code');
    }
  };

  // Live Camera Scanner
  const startCameraScanner = async () => {
    setScanError('');
    setIsScanning(true);
    try {
      const html5QrCode = new Html5Qrcode(scannerRegionId);
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopCameraScanner();
          handleValidateQrString(decodedText);
        },
        () => {},
      );
    } catch (err: any) {
      setScanError('Unable to access camera. Please check camera permissions or upload an image.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear();
        } catch (err) {
          // Ignore scanner cleanup errors
        }
        scannerRef.current = null;
      }
    };
  }, []);

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Camera scanner stopped cleanly:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Handle File Upload Scan
  const handleFileUploadScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setScanError('');
    try {
      const html5QrCode = new Html5Qrcode('file-scanner-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleValidateQrString(decodedText);
    } catch (err) {
      setScanError('No valid QR code detected in the uploaded image.');
    }
  };

  // Automatic Location Identification Execution
  const handleValidateQrString = async (qrDataStr: string) => {
    if (!qrDataStr.trim()) return;
    setIsValidating(true);
    setScanError('');
    setScanResult(null);

    try {
      const result = await validateAndResolveQr(qrDataStr.trim());
      setScanResult(result);
    } catch (err: any) {
      setScanError(
        err.message ||
          'Failed to identify scanned QR code. Make sure it is a valid Room or Asset QR code.',
      );
    } finally {
      setIsValidating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Navigation Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 rounded-2xl text-cyan-400">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Dashboard
                </Link>
                <span className="text-slate-600">/</span>
                <span className="text-xs font-semibold text-cyan-400">
                  {isAdmin ? 'QR Code Management' : 'QR Scanner'}
                </span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mt-0.5">
                {isAdmin ? 'QR Code Hub & Generator' : 'Campus QR Code Scanner'}
              </h1>
              <p className="text-xs text-slate-400">
                {isAdmin
                  ? 'Generate, download, regenerate, and scan Room & Asset QR Codes with automatic location resolution.'
                  : 'Scan QR codes provided by Admin on campus assets or rooms for instant location identification and issue reporting.'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Generator is Admin Only) */}
          {isAdmin ? (
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                onClick={() => {
                  stopCameraScanner();
                  setActiveTab('generator');
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'generator'
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrIcon className="w-4 h-4" />
                <span>QR Generator</span>
              </button>
              <button
                onClick={() => setActiveTab('scanner')}
                className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'scanner'
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>QR Scanner</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 text-xs font-semibold gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>QR Scanner Mode (Admin-Issued QR Codes)</span>
            </div>
          )}
        </div>

        {/* TAB 1: QR GENERATOR & PREVIEW (ADMIN ONLY) */}
        {activeTab === 'generator' &&
          (isAdmin ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Generator Form */}
              <div className="space-y-6">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                    <QrIcon className="w-4 h-4 text-indigo-400" />
                    Select Target Entity
                  </h2>

                  {/* Target Type Toggle */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTargetType('ASSET')}
                      className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                        targetType === 'ASSET'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      Asset QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType('ROOM');
                        if (allRooms.length > 0 && !selectedRoomId) {
                          setSelectedRoomId(allRooms[0].id);
                        }
                      }}
                      className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                        targetType === 'ROOM'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Room QR Code
                    </button>
                  </div>

                  {/* Target Selector */}
                  {targetType === 'ASSET' ? (
                    <div className="space-y-3 text-xs">
                      <label className="block text-slate-400 font-medium">Select Asset *</label>
                      <select
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Choose Asset --</option>
                        {assets.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.assetTag} - {a.name} ({a.category ? a.category.name : 'No Category'})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <label className="block text-slate-400 font-medium">Select Room *</label>
                      <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Choose Room --</option>
                        {allRooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            Room {r.roomNumber} - {r.name || r.type} ({r.buildingName}, {r.floorName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Action Buttons: Generate / Regenerate */}
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                    <button
                      disabled={
                        isGenerating || (targetType === 'ASSET' ? !selectedAssetId : !selectedRoomId)
                      }
                      onClick={() => {
                        if (targetType === 'ASSET') {
                          handleFetchOrGenerateAssetQr(selectedAssetId, true);
                        } else {
                          handleFetchOrGenerateRoomQr(selectedRoomId, true);
                        }
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-cyan-400 ${isGenerating ? 'animate-spin' : ''}`}
                      />
                      <span>Regenerate QR Code</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: QR Code Preview & Download */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      QR Code High-Res Preview & Export
                    </h2>
                    {activeQrRecord && (
                      <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                        ACTIVE & VALID
                      </span>
                    )}
                  </div>

                  {genError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{genError}</span>
                    </div>
                  )}

                  {isGenerating ? (
                    <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
                      <div className="h-7 w-7 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-xs">Generating high-density QR code matrix...</span>
                    </div>
                  ) : activeQrRecord && activeQrRecord.qrImageUrl ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* High Density QR Display */}
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner space-y-4">
                        <div className="p-4 bg-white rounded-2xl shadow-2xl">
                          <img
                            src={activeQrRecord.qrImageUrl}
                            alt="QR Code"
                            className="w-52 h-52 object-contain"
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 text-center break-all max-w-xs">
                          Payload: {activeQrRecord.qrCodeData}
                        </span>
                      </div>

                      {/* Metadata Summary & Export Buttons */}
                      <div className="space-y-4 text-xs">
                        {targetType === 'ASSET' && activeQrRecord.asset && (
                          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                            <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                              Bound Asset Information
                            </span>
                            <h3 className="font-bold text-white text-base">
                              {activeQrRecord.asset.name}
                            </h3>
                            <div className="space-y-1 text-slate-300">
                              <p>
                                Tag/ID:{' '}
                                <span className="font-mono text-indigo-400 font-bold">
                                  {activeQrRecord.asset.assetTag}
                                </span>
                              </p>
                              <p>Status: {activeQrRecord.asset.status}</p>
                              <p>
                                Category:{' '}
                                {activeQrRecord.asset.category
                                  ? activeQrRecord.asset.category.name
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                        {targetType === 'ROOM' && activeQrRecord.room && (
                          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                            <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                              Bound Room Information
                            </span>
                            <h3 className="font-bold text-white text-base">
                              Room {activeQrRecord.room.roomNumber}{' '}
                              {activeQrRecord.room.name ? `(${activeQrRecord.room.name})` : ''}
                            </h3>
                            <div className="space-y-1 text-slate-300">
                              <p>Building: {activeQrRecord.room.building?.name}</p>
                              <p>Floor: {activeQrRecord.room.floor?.name}</p>
                              <p>Type: {activeQrRecord.room.type}</p>
                            </div>
                          </div>
                        )}

                        {/* Download Actions */}
                        <div className="space-y-2 pt-2">
                          <button
                            onClick={handleDownloadPng}
                            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                          >
                            <Download className="w-4 h-4" />
                            Download Image (PNG)
                          </button>
                          <button
                            onClick={handleDownloadSvg}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all"
                          >
                            <Download className="w-4 h-4 text-cyan-400" />
                            Export Vector File (SVG)
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-500 space-y-2">
                      <QrIcon className="w-10 h-10 text-slate-700 mx-auto" />
                      <p className="text-xs">Select a Room or Asset on the left to display its QR Code.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
              <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">Admin Authorization Required</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                QR Code Generation and management is strictly restricted to System Administrators. As a standard user, you can scan QR codes provided by an Admin.
              </p>
              <button
                onClick={() => setActiveTab('scanner')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition-all"
              >
                Switch to QR Scanner
              </button>
            </div>
          ))}

        {/* TAB 2: LIVE QR SCANNER & AUTOMATIC LOCATION IDENTIFICATION */}
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner Input Options Column */}
            <div className="space-y-6">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    QR Scanner
                  </h2>
                  <span className="text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2.5 py-0.5 rounded-full">
                    AUTO-IDENTIFY LOCATION
                  </span>
                </div>

                {scanError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                )}

                {/* Option 1: Live Webcam Viewport */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Option 1: Live Webcam Camera
                    </span>
                    {!isScanning ? (
                      <button
                        onClick={startCameraScanner}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Start Camera
                      </button>
                    ) : (
                      <button
                        onClick={stopCameraScanner}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-all"
                      >
                        Stop Camera
                      </button>
                    )}
                  </div>

                  <div className="w-full min-h-[220px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
                    <div id={scannerRegionId} className="w-full h-full" />
                    {!isScanning && (
                      <div className="absolute inset-0 text-center p-6 text-slate-500 space-y-2 flex flex-col items-center justify-center bg-slate-950">
                        <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs">Click "Start Camera" to scan QR code via camera.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 2: Upload QR Image File */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Option 2: Upload QR Image File
                  </span>
                  <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 text-center transition-colors bg-slate-950/40">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadScan}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span>Click to drag & drop or upload QR code image</span>
                    </div>
                  </div>
                  <div id="file-scanner-temp" className="hidden" />
                </div>

                {/* Option 3: Manual Test Input / Quick Simulation Buttons */}
                <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-semibold block">
                    Option 3: Quick Demo Simulations
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleValidateQrString('CAMPUS:ASSET:AST-0001')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono rounded-lg text-[11px] border border-slate-700 transition-colors"
                    >
                      Scan AST-0001
                    </button>
                    <button
                      onClick={() => handleValidateQrString('CAMPUS:ASSET:AST-0004')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono rounded-lg text-[11px] border border-slate-700 transition-colors"
                    >
                      Scan AST-0004
                    </button>
                    <button
                      onClick={() => handleValidateQrString('CAMPUS:ROOM:A101')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono rounded-lg text-[11px] border border-slate-700 transition-colors"
                    >
                      Scan Room A101
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Paste QR payload string..."
                      value={scanInputText}
                      onChange={(e) => setScanInputText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleValidateQrString(scanInputText)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shrink-0"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Scanner Output: Automatic Location Identification Card */}
            <div className="space-y-6">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Automatic Location Identification
                  </h2>
                </div>

                {isValidating ? (
                  <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
                    <div className="h-7 w-7 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                    <span className="text-xs">
                      Resolving payload and fetching location hierarchy...
                    </span>
                  </div>
                ) : scanResult ? (
                  <div className="space-y-5 text-xs">
                    {/* Zero Manual Selection Confirmation Banner */}
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 font-semibold flex items-center gap-2.5">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>
                        Location & Asset Automatically Identified — Zero manual location selection
                        required.
                      </span>
                    </div>

                    {/* Quick Action: Report Issue for scanned QR */}
                    <div className="pt-1">
                      <Link
                        href={`/issues/report?${new URLSearchParams({
                          ...(scanResult.building?.id ? { buildingId: scanResult.building.id } : {}),
                          ...(scanResult.room?.id ? { roomId: scanResult.room.id } : {}),
                          ...(scanResult.asset?.id ? { assetId: scanResult.asset.id } : {}),
                          ...(scanResult.qrData ? { qrData: scanResult.qrData } : {}),
                        }).toString()}`}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all text-xs"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Report Issue for this Location / Asset
                      </Link>
                    </div>

                    {/* Identified Hierarchy Card */}
                    <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                      {/* 1. Building */}
                      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-cyan-400" />
                          Building
                        </span>
                        <span className="font-bold text-white text-sm">
                          {scanResult.building
                            ? `${scanResult.building.name} (${scanResult.building.code})`
                            : 'N/A'}
                        </span>
                      </div>

                      {/* 2. Floor */}
                      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-400" />
                          Floor
                        </span>
                        <span className="font-semibold text-slate-200">
                          {scanResult.floor
                            ? `${scanResult.floor.name} (Floor ${scanResult.floor.floorNumber})`
                            : 'N/A'}
                        </span>
                      </div>

                      {/* 3. Room */}
                      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                        <span className="text-slate-400 font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          Room
                        </span>
                        <span className="font-semibold text-slate-200">
                          {scanResult.room
                            ? `Room ${scanResult.room.roomNumber} ${
                                scanResult.room.name ? `(${scanResult.room.name})` : ''
                              }`
                            : 'N/A'}
                        </span>
                      </div>

                      {/* 4. Asset (if Asset QR) */}
                      {scanResult.type === 'ASSET' && scanResult.asset && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-slate-400 font-medium flex items-center gap-2">
                            <Box className="w-4 h-4 text-amber-400" />
                            Identified Asset
                          </span>
                          <span className="font-bold text-indigo-300">
                            {scanResult.asset.name} (Tag: {scanResult.asset.assetTag})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Associated Assets in Room (if Room QR) */}
                    {scanResult.type === 'ROOM' &&
                      scanResult.associatedAssets &&
                      scanResult.associatedAssets.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <span className="text-slate-300 font-bold block">
                            Assets Located in this Room ({scanResult.associatedAssets.length}):
                          </span>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {scanResult.associatedAssets.map((ast) => (
                              <div
                                key={ast.id}
                                className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between"
                              >
                                <span className="font-semibold text-slate-200">{ast.name}</span>
                                <span className="font-mono text-[10px] text-indigo-400 font-bold">
                                  {ast.assetTag}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-500 space-y-2">
                    <ShieldCheck className="w-10 h-10 text-slate-700 mx-auto" />
                    <p className="text-xs">Scan a QR code on the left to view auto-identified location.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
