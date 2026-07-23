'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, LogIn } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data?.user) {
        router.push('/profile');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'discord') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/15 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] flex items-center justify-center mx-auto shadow-lg shadow-[#FF2A5F]/20">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sign In to OtakuPulse</h1>
          <p className="text-xs text-slate-400">Access your custom anime watchlist, ratings, and profile</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF2A5F]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF2A5F]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white font-bold text-xs shadow-lg shadow-[#FF2A5F]/20 hover:scale-102 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>



        <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/10">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-[#FF2A5F] font-bold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
