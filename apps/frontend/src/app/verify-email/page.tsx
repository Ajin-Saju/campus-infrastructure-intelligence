'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '../../lib/auth-client';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No verification token provided in URL.');
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const res = await apiRequest<{ message: string }>(`/auth/verify-email?token=${token}`);
        setMessage(res.message);
      } catch (err: any) {
        setError(err.message || 'Email verification failed. Token may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  return (
    <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-indigo-950/30 text-center">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 mb-4 mx-auto flex items-center justify-center">
        <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-cyan-400" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Email Verification</h1>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="h-8 w-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm">Verifying your token...</p>
        </div>
      ) : error ? (
        <div className="space-y-4 py-4">
          <div className="h-12 w-12 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
            <XCircle className="h-6 w-6" />
          </div>
          <p className="text-sm text-rose-400">{error}</p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl transition-all"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <div className="space-y-4 py-4">
          <div className="h-12 w-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm text-emerald-300 font-medium">{message}</p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
          >
            Proceed to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
