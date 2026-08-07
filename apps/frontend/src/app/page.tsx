import Link from 'next/link';
import { ShieldCheck, LogIn, UserPlus, KeyRound, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-xl w-full text-center space-y-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 shadow-2xl shadow-indigo-950/40">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 mb-4 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Campus Infrastructure Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            User Management & Security Administration Portal
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/login"
            className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-3 transition-all"
          >
            <LogIn className="h-5 w-5" />
            Sign In
          </Link>

          <Link
            href="/users"
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 flex items-center justify-center gap-3 transition-all"
          >
            <Users className="h-5 w-5 text-cyan-400" />
            User Management
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-center gap-6 text-sm text-slate-400">
          <Link
            href="/register"
            className="hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Register Account
          </Link>
          <Link
            href="/forgot-password"
            className="hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="h-4 w-4" />
            Forgot Password
          </Link>
        </div>
      </div>
    </main>
  );
}
