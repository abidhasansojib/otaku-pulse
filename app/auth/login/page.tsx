'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, LogIn, Eye, EyeOff, KeyRound } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

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
      setErrorMsg(err?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);
    setResetLoading(true);

    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/reset-password`
          : 'https://otaku-pulse.vercel.app/auth/reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setResetMessage(
        'Password reset link sent! Please check your email inbox to create a new password.'
      );
    } catch (err: any) {
      setResetError(err?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setIsResetModalOpen(true);
                }}
                className="text-[11px] font-bold text-[#FF2A5F] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF2A5F]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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

      {/* Forgot Password Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 max-w-md w-full space-y-5 bg-slate-900/95 shadow-2xl">
            <div className="flex items-center gap-3 text-[#FF2A5F]">
              <div className="w-12 h-12 rounded-2xl bg-[#FF2A5F]/20 flex items-center justify-center border border-[#FF2A5F]/30 shrink-0">
                <KeyRound className="w-6 h-6 text-[#FF2A5F]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Reset Password</h3>
                <p className="text-xs text-slate-400">Receive a password reset link in your email</p>
              </div>
            </div>

            {resetMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center space-y-3">
                <p>{resetMessage}</p>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetLink} className="space-y-4">
                {resetError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold text-center">
                    {resetError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Your Account Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:border-[#FF2A5F]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 text-xs font-bold hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white font-extrabold text-xs shadow-lg shadow-[#FF2A5F]/20 hover:scale-102 transition-all disabled:opacity-50"
                  >
                    {resetLoading ? 'Sending Link...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
