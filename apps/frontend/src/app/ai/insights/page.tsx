'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/auth-context';
import { fetchMonthlyAdminInsights, MonthlyInsightsResponse } from '../../../lib/ai-client';
import {
  Brain,
  Sparkles,
  Building2,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function AiAdminInsightsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AiAdminInsightsPageContent />
    </ProtectedRoute>
  );
}

function AiAdminInsightsPageContent() {
  const { isLoading: authLoading } = useAuth();
  const [insights, setInsights] = useState<MonthlyInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchMonthlyAdminInsights();
      setInsights(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load Monthly Administrator Insights.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <span>Generating AI Monthly Administrator Insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
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
                <span className="text-xs font-semibold text-cyan-400">AI Intelligence</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mt-0.5">
                Monthly Administrator Insights
              </h1>
              <p className="text-xs text-slate-400">
                Executive infrastructure risk analysis, breakdown trends, and strategic AI recommendations.
              </p>
            </div>
          </div>

          <button
            onClick={loadInsights}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Refresh Analysis
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {insights && (
          <>
            {/* Executive Summary Card */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  Executive AI Infrastructure Summary
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full">
                  PERSISTED IN DATABASE
                </span>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {insights.executiveSummary}
              </p>
            </div>

            {/* Key Risk Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Top Risk Building */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  Top Report Density Building
                </span>
                <h3 className="text-xl font-bold text-white">{insights.topRiskBuilding}</h3>
                <p className="text-xs text-slate-400">
                  Identified as the highest report volume location requiring priority maintenance inspection.
                </p>
              </div>

              {/* Top Failure Category */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-rose-400" />
                  Primary Defect Category
                </span>
                <h3 className="text-xl font-bold text-rose-300">{insights.topFailureCategory}</h3>
                <p className="text-xs text-slate-400">
                  Accounts for the largest share of reported campus infrastructure disruptions.
                </p>
              </div>
            </div>

            {/* Strategic Recommendations Card */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Strategic Campus Infrastructure Recommendations
              </h2>

              <div className="space-y-3">
                {insights.recommendedActions.map((action, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-3 text-xs">
                    <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full mt-0.5 shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block mb-0.5">Recommendation #{idx + 1}</span>
                      <p className="text-slate-300 leading-relaxed">{action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
