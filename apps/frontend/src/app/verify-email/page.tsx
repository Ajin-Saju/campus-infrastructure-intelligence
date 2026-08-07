'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '../../lib/auth-client';
import { CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email token...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in URL.');
      return;
    }

    async function doVerify() {
      try {
        const res = await apiRequest<{ message: string }>(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Email verification failed or token expired.');
      }
    }

    doVerify();
  }, [token]);

  return (
    <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-indigo-950/30 text-center">
      <div className="flex flex-col items-center mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 mb-3 flex items-center justify-center">
          <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-cyan-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Email Verification
        </h1>
      </div>

      {status === 'loading' && (
        <div className="py-8 space-y-4">
          <div className="h-10 w-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-6 space-y-5">
          <div className="h-14 w-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="text-sm text-slate-200">{message}</p>
          <Link
            href="/login"
            className="inline-block w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25"
          >
            Sign In to Your Account
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="py-6 space-y-5">
          <div className="h-14 w-14 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <p className="text-sm text-rose-300">{message}</p>
          <Link
            href="/login"
            className="inline-block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition-all"
          >
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
