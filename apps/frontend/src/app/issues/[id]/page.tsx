'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import { fetchIssueById, IssueReportItem } from '../../../lib/issues-client';
import { fetchIssuePredictions, AiPredictionItem } from '../../../lib/ai-client';
import { createMaintenanceTask } from '../../../lib/maintenance-client';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  MapPin,
  Box,
  Layers,
  Calendar,
  Clock,
  User,
  ImageIcon,
  Film,
  CheckCircle,
  Loader2,
  Tag,
  ShieldCheck,
  Eye,
  X,
  Sparkles,
  AlertTriangle,
  Wrench,
  Brain,
} from 'lucide-react';

export default function IssueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading, user } = useAuth();

  // Derive role for UI access controls
  const userRole: string = (user as any)?.role?.name ?? '';
  const isAdmin = userRole === 'ADMIN';
  const isTechnician = userRole === 'TECHNICIAN';

  const issueId = params?.id as string;

  const [issue, setIssue] = useState<IssueReportItem | null>(null);
  const [predictions, setPredictions] = useState<AiPredictionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Selected Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (issueId) {
      loadIssueDetails();
    }
  }, [issueId]);

  const loadIssueDetails = async () => {
    setIsLoading(true);
    setError('');
    setIsForbidden(false);
    try {
      const [issueData, aiPreds] = await Promise.all([
        fetchIssueById(issueId),
        fetchIssuePredictions(issueId).catch(() => []),
      ]);
      setIssue(issueData);
      setPredictions(aiPreds);
    } catch (err: any) {
      // Distinguish 403 Forbidden from other errors
      if (err.message?.includes('403') || err.message?.toLowerCase().includes('permission') || err.message?.toLowerCase().includes('forbidden')) {
        setIsForbidden(true);
      } else {
        setError(err.message || 'Failed to load issue report details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMaintenanceTask = async () => {
    if (!issue) return;
    setIsCreatingTask(true);
    try {
      const task = await createMaintenanceTask({
        title: issue.title,
        description: issue.description,
        issueReportId: issue.id,
        assetId: issue.assetId || undefined,
        priority: issue.priority,
      });
      router.push(`/maintenance/${task.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create maintenance task.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            IN PROGRESS
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            RESOLVED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400">
            CLOSED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
          <span>Loading issue report details...</span>
        </div>
      </div>
    );
  }

  // 403 Access Denied screen
  if (isForbidden) {
    return (
      <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-xl">
          <div className="p-4 bg-rose-500/10 rounded-full w-fit mx-auto">
            <ShieldCheck className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400">
            You do not have permission to view this issue report.
            You can only access reports you submitted or that are assigned to you.
          </p>
          <Link
            href="/issues"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Reports
          </Link>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    // 404 / generic error screen
    return (
      <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Issue Report Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'The requested issue ticket does not exist or has been deleted.'}</p>
          <Link
            href="/issues"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/issues"
                className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Link href="/issues" className="text-xs font-medium text-slate-400 hover:text-cyan-400">
                    My Reports
                  </Link>
                  <span className="text-slate-600">/</span>
                  <span className="text-xs font-semibold text-rose-400">{issue.ticketNumber}</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mt-0.5">
                  {issue.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-xl">
                {issue.ticketNumber}
              </span>
              {getStatusBadge(issue.status)}
            </div>
          </div>

          {/* Reporter & Metadata Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px]">Reporter</span>
                <span className="font-semibold">
                  {issue.reportedBy
                    ? `${issue.reportedBy.firstName} ${issue.reportedBy.lastName}`
                    : 'Student'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px]">Date Reported</span>
                <span className="font-semibold">{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Tag className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px]">Category</span>
                <span className="font-semibold">{issue.category?.name || 'General'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px]">Priority</span>
                <span className="font-semibold text-rose-300">{issue.priority}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Maintenance Task Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-400" />
              Linked Maintenance Management Task
            </h2>
            {issue.maintenanceTasks && issue.maintenanceTasks.length > 0 ? (
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                Task Active ({issue.maintenanceTasks.length})
              </span>
            ) : (
              <span className="text-xs font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                No Maintenance Task Linked
              </span>
            )}
          </div>

          {issue.maintenanceTasks && issue.maintenanceTasks.length > 0 ? (
            <div className="space-y-3">
              {issue.maintenanceTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400">{t.taskNumber}</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {t.status}
                      </span>
                      <span className="text-[11px] font-semibold text-rose-400">
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">{t.title}</p>
                    {t.assignedTo && (
                      <p className="text-xs text-slate-400">
                        Assigned Tech: {t.assignedTo.firstName} {t.assignedTo.lastName}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/maintenance/${t.id}`}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all"
                  >
                    <Wrench className="w-3.5 h-3.5" /> View Task Workflow →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-xs text-slate-400">
                This issue ticket has not been assigned to a maintenance task yet.
                {isAdmin && ' Convert this issue into a maintenance task to track its repair workflow.'}
              </p>
              {/* Only admins can create maintenance tasks from an issue */}
              {isAdmin && (
                <button
                  onClick={handleCreateMaintenanceTask}
                  disabled={isCreatingTask}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shrink-0 shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  {isCreatingTask ? 'Creating Task...' : 'Convert to Maintenance Task'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Location & Asset Metadata Grid */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Location & Asset Identification Hierarchy
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Building */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Building
              </span>
              <p className="font-bold text-white text-sm">
                {issue.building ? `${issue.building.name} (${issue.building.code})` : 'N/A'}
              </p>
            </div>

            {/* Floor & Room */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Room & Floor
              </span>
              <p className="font-bold text-white text-sm">
                {issue.room
                  ? `Room ${issue.room.roomNumber} ${
                      issue.room.floor ? `(${issue.room.floor.name})` : ''
                    }`
                  : 'N/A'}
              </p>
            </div>

            {/* Asset */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <Box className="w-4 h-4 text-amber-400" />
                Identified Asset
              </span>
              <p className="font-bold text-indigo-300 text-sm">
                {issue.asset
                  ? `${issue.asset.name} (${issue.asset.assetTag})`
                  : 'N/A (Room Issue)'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Analysis Panel */}
        {predictions.length > 0 && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                AI Infrastructure Analysis & Predictions
              </h2>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2.5 py-0.5 rounded-full">
                PERSISTED IN DATABASE
              </span>
            </div>

            {/* 1. Duplicate Warning Banner (if duplicate) */}
            {predictions.find((p) => p.predictionType === 'DUPLICATE_DETECTION' && p.modelMetadata?.isDuplicate) && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>AI Duplicate Ticket Warning</span>
                </div>
                <p className="text-[11px] text-amber-200/90">
                  {predictions.find((p) => p.predictionType === 'DUPLICATE_DETECTION')?.recommendation}
                </p>
              </div>
            )}

            {/* 2. AI Category & Priority Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Category Prediction */}
              {predictions.find((p) => p.predictionType === 'ISSUE_CATEGORIZATION') && (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" />
                      AI Predicted Category
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-bold">
                      {Math.round((predictions.find((p) => p.predictionType === 'ISSUE_CATEGORIZATION')?.confidenceScore || 0) * 100)}% Match
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm">
                    {predictions.find((p) => p.predictionType === 'ISSUE_CATEGORIZATION')?.predictedValue}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {predictions.find((p) => p.predictionType === 'ISSUE_CATEGORIZATION')?.recommendation}
                  </p>
                </div>
              )}

              {/* Priority Recommendation */}
              {predictions.find((p) => p.predictionType === 'PRIORITY_RECOMMENDATION') && (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      AI Priority Recommendation
                    </span>
                    <span className="font-mono text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-bold">
                      {Math.round((predictions.find((p) => p.predictionType === 'PRIORITY_RECOMMENDATION')?.confidenceScore || 0) * 100)}% Confidence
                    </span>
                  </div>
                  <h3 className="font-bold text-rose-300 text-sm">
                    {predictions.find((p) => p.predictionType === 'PRIORITY_RECOMMENDATION')?.predictedValue}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {predictions.find((p) => p.predictionType === 'PRIORITY_RECOMMENDATION')?.recommendation}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Maintenance Summary & Technician Action Steps */}
            {predictions.find((p) => p.predictionType === 'MAINTENANCE_SUMMARY') && (
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  AI Maintenance Summary & Action Plan
                </span>
                <p className="text-slate-300">
                  {predictions.find((p) => p.predictionType === 'MAINTENANCE_SUMMARY')?.predictedValue}
                </p>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-[11px]">
                  <strong className="text-indigo-400 block mb-1">Recommended Repair Steps:</strong>
                  {predictions.find((p) => p.predictionType === 'MAINTENANCE_SUMMARY')?.recommendation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Issue Description Section */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3">
            Detailed Issue Description
          </h2>
          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {issue.description}
          </p>
        </div>

        {/* Uploaded Evidence Gallery (Images & Video) */}
        {((issue.images && issue.images.length > 0) || (issue.attachments && issue.attachments.length > 0)) && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              Uploaded Evidence Gallery
            </h2>

            {/* Images */}
            {issue.images && issue.images.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">
                  Uploaded Photos ({issue.images.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {issue.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewImage(img.url)}
                      className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-square cursor-pointer hover:border-cyan-500/50 transition-all shadow"
                    >
                      <img src={img.url} alt="Evidence thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Attachment */}
            {issue.attachments && issue.attachments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-amber-400" />
                  Uploaded Video Attachment
                </span>
                {issue.attachments.map((att, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-amber-300">{att.fileName}</p>
                    <video src={att.fileUrl} controls className="w-full max-h-72 rounded-xl bg-black" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline / History Strip */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Report History & Lifecycle Timeline
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-full mt-0.5">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Report Created & Logged</span>
                <span className="text-[11px] text-slate-400">
                  {new Date(issue.createdAt).toLocaleString()} by {issue.reportedBy?.firstName || 'User'}
                </span>
              </div>
            </div>

            {issue.resolvedAt && (
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-full mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Issue Resolved</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(issue.resolvedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {issue.closedAt && (
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-slate-700 text-slate-300 rounded-full mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Ticket Closed</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(issue.closedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Resolution Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-slate-950/80 hover:bg-slate-800 text-white rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Full resolution evidence" className="w-full h-full object-contain max-h-[85vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
