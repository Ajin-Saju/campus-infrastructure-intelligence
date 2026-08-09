'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import {
  fetchAssetById,
  addAssetImage,
  deleteAssetImage,
  deleteAsset,
  AssetItem,
  AssetImageItem,
  AssetStatus,
} from '../../../lib/assets-client';
import {
  Box,
  ArrowLeft,
  Edit,
  Trash2,
  Image as ImageIcon,
  Plus,
  Eye,
  X,
  Calendar,
  Building2,
  MapPin,
  Tag,
  ShieldCheck,
  AlertCircle,
  Clock,
  Layers,
  Upload,
  CheckCircle,
} from 'lucide-react';

const STATUS_COLORS: Record<AssetStatus, { bg: string; text: string; border: string }> = {
  [AssetStatus.OPERATIONAL]: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  [AssetStatus.NEEDS_REPAIR]: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  [AssetStatus.IN_MAINTENANCE]: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
  },
  [AssetStatus.DECOMMISSIONED]: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
  [AssetStatus.SCRAPPED]: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
};

const PRESET_SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
];

export default function AssetDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<AssetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Image Upload Modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  // Image Preview Lightbox
  const [previewingImage, setPreviewingImage] = useState<AssetImageItem | null>(null);

  // Image Deleting
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  // Asset Deleting
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);
  const [showDeleteAssetModal, setShowDeleteAssetModal] = useState(false);

  useEffect(() => {
    if (assetId) {
      loadAssetDetails();
    }
  }, [assetId]);

  const loadAssetDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAssetById(assetId);
      setAsset(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenImageModal = () => {
    setImageUrlInput('');
    setCaptionInput('');
    setImagePreview('');
    setImageUploadError('');
    setIsImageModalOpen(true);
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) {
      setImageUploadError('Please provide an image URL');
      return;
    }

    setIsUploading(true);
    setImageUploadError('');
    try {
      await addAssetImage(assetId, {
        url: imageUrlInput.trim(),
        caption: captionInput.trim() || undefined,
        isPrimary: !asset?.images || asset.images.length === 0,
      });
      setIsImageModalOpen(false);
      loadAssetDetails();
    } catch (err: any) {
      setImageUploadError(err.message || 'Failed to upload asset image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    setDeletingImageId(imageId);
    try {
      await deleteAssetImage(assetId, imageId);
      if (previewingImage?.id === imageId) {
        setPreviewingImage(null);
      }
      loadAssetDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleDeleteAsset = async () => {
    setIsDeletingAsset(true);
    try {
      await deleteAsset(assetId);
      router.push('/assets');
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset');
      setIsDeletingAsset(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Loading asset details...</span>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen p-6 bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="max-w-md text-center space-y-4 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Asset Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'The requested asset does not exist.'}</p>
          <Link
            href="/assets"
            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Back to Asset List
          </Link>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_COLORS[asset.status] || STATUS_COLORS[AssetStatus.OPERATIONAL];

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Navigation Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/assets"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  {asset.assetTag}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                >
                  {asset.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-1">{asset.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href={`/assets/${asset.id}/edit`}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Edit className="w-4 h-4 text-indigo-400" />
              <span>Edit Asset</span>
            </Link>
            <button
              onClick={() => setShowDeleteAssetModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Specifications & Metadata */}
          <div className="lg:col-span-2 space-y-6">
            {/* Required Fields Specification Card */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                <Box className="w-4 h-4 text-indigo-400" />
                Asset Overview & Specifications
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 1. Asset ID */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Asset ID / Tag</span>
                  <span className="font-mono font-bold text-indigo-400 text-sm">{asset.assetTag}</span>
                </div>

                {/* 2. Asset Name */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Asset Name</span>
                  <span className="font-bold text-white text-sm">{asset.name}</span>
                </div>

                {/* 3. Category */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Category</span>
                  <span className="font-semibold text-cyan-400">
                    {asset.category ? `${asset.category.name} (${asset.category.code})` : 'Uncategorized'}
                  </span>
                </div>

                {/* 4. Building */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Building</span>
                  <span className="font-semibold text-slate-200">
                    {asset.building ? `${asset.building.name} (${asset.building.code})` : 'Not Assigned'}
                  </span>
                </div>

                {/* 5. Floor */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Floor</span>
                  <span className="font-semibold text-slate-200">
                    {asset.floor ? `${asset.floor.name} (Floor ${asset.floor.floorNumber})` : 'Not Assigned'}
                  </span>
                </div>

                {/* 6. Room */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Room</span>
                  <span className="font-semibold text-slate-200">
                    {asset.room ? `Room ${asset.room.roomNumber} ${asset.room.name ? `(${asset.room.name})` : ''}` : 'Not Assigned'}
                  </span>
                </div>

                {/* 7. Purchase Date */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Purchase Date</span>
                  <span className="font-semibold text-slate-200">
                    {asset.purchaseDate
                      ? new Date(asset.purchaseDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>

                {/* 8. Warranty Date */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Warranty Expiry Date</span>
                  <span className="font-semibold text-slate-200">
                    {asset.warrantyExpiry
                      ? new Date(asset.warrantyExpiry).toLocaleDateString()
                      : 'No Expiry Set'}
                  </span>
                </div>

                {/* 9. Vendor */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Vendor</span>
                  <span className="font-semibold text-emerald-400">
                    {asset.manufacturer || 'N/A'}
                  </span>
                </div>

                {/* 10. Status */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Current Status</span>
                  <span className={`font-bold ${statusCfg.text}`}>{asset.status}</span>
                </div>
              </div>

              {/* Additional Technical Attributes */}
              <div className="pt-4 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Serial Number</span>
                  <span className="font-mono text-slate-300 font-medium">
                    {asset.serialNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Model Number</span>
                  <span className="text-slate-300 font-medium">{asset.modelNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Purchase Cost</span>
                  <span className="text-slate-300 font-medium">
                    {asset.purchaseCost !== undefined && asset.purchaseCost !== null
                      ? `$${Number(asset.purchaseCost).toLocaleString()}`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {asset.description && (
                <div className="pt-4 border-t border-slate-800/60 text-xs">
                  <span className="text-slate-400 block font-semibold mb-1">Asset Notes & Description</span>
                  <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                    {asset.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Asset Images Gallery (Upload, Delete, Preview) */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  Asset Images ({asset.images?.length || 0})
                </h2>
                <button
                  onClick={handleOpenImageModal}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Upload Image
                </button>
              </div>

              {/* Image Grid */}
              {!asset.images || asset.images.length === 0 ? (
                <div className="py-12 text-center bg-slate-950/50 border border-slate-800 rounded-xl p-6 space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No images uploaded for this asset yet.</p>
                  <button
                    onClick={handleOpenImageModal}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    + Add standard image preview
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {asset.images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative h-28 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-md"
                    >
                      <img
                        src={img.url}
                        alt={img.caption || asset.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />

                      {/* Image Overlay Actions */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button
                          onClick={() => setPreviewingImage(img)}
                          className="p-1.5 bg-cyan-500 text-white rounded-lg hover:scale-110 transition-transform"
                          title="Preview Image"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          disabled={deletingImageId === img.id}
                          onClick={() => handleDeleteImage(img.id)}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:scale-110 transition-transform"
                          title="Delete Image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {img.isPrimary && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 text-[9px] font-bold rounded bg-indigo-600 text-white shadow">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                Upload Asset Image
              </h3>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {imageUploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageUploadError}</span>
              </div>
            )}

            <form onSubmit={handleAddImage} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/image.jpg"
                  value={imageUrlInput}
                  onChange={(e) => {
                    setImageUrlInput(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Sample Presets Selection */}
              <div>
                <span className="block text-slate-400 mb-1.5 font-medium">Or pick a sample preset image:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {PRESET_SAMPLE_IMAGES.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImageUrlInput(url);
                        setImagePreview(url);
                      }}
                      className={`h-12 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        imageUrlInput === url
                          ? 'border-indigo-500 scale-105'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Frame */}
              {imagePreview && (
                <div>
                  <span className="block text-slate-400 mb-1 font-medium">Image Live Preview</span>
                  <div className="h-40 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImageUploadError('Unable to load image from specified URL')}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Caption / Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Front panel view"
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-2"
                >
                  {isUploading && (
                    <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Save Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewingImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-300">
                {previewingImage.caption || 'Asset Image Preview'}
              </span>
              <button
                onClick={() => setPreviewingImage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={previewingImage.url}
                alt="Fullscreen Preview"
                className="max-h-[68vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Asset Modal */}
      {showDeleteAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Asset Record</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-200">{asset.name}</strong>{' '}
              (Tag: <span className="font-mono text-indigo-400">{asset.assetTag}</span>)?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteAssetModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingAsset}
                onClick={handleDeleteAsset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                {isDeletingAsset && (
                  <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
