'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

function ResetPasswordContent() {
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [sessionChecking, setSessionChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function initAuthSession() {
      try {
        // 1. Check if PKCE code is in URL query (?code=...)
        const code = searchParams.get('code');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session && mounted) {
            setHasSession(true);
            setSessionChecking(false);
            return;
          }
        }

        // 2. Check if access_token is in URL hash (#access_token=...)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!error && data.session && mounted) {
              setHasSession(true);
              setSessionChecking(false);
              return;
            }
          }
        }

        // 3. Check existing active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          setHasSession(true);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (mounted) setSessionChecking(false);
      }
    }

    initAuthSession();

    // 4. Listen for recovery auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) {
        if (mounted) setHasSession(true);
      }
      if (mounted) setSessionChecking(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase, searchParams]);

  // Handle password update for users with an active session (from link click)
  const handleUpdatePasswordWithSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setSuccessMsg('Your password has been updated successfully! Redirecting to profile...');
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset via OTP Security Code (if no session or direct entry)
  const handleResetWithOtpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      // 1. Verify OTP token
      const { error: otpErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpToken.trim(),
        type: 'recovery',
      });

      if (otpErr) throw otpErr;

      // 2. Update password
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw updateErr;

      setSuccessMsg('Your password has been updated successfully! Redirecting to profile...');
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid or expired OTP code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/15 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] flex items-center justify-center mx-auto shadow-lg shadow-[#FF2A5F]/20">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-400">Enter your new password to secure your OtakuPulse account</p>
        </div>

        {sessionChecking ? (
          <div className="text-center py-6 text-xs text-slate-400 animate-pulse">
            Verifying your password reset authorization...
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold text-center">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {hasSession ? (
              /* User has active recovery session from email link */
              <form onSubmit={handleUpdatePasswordWithSession} className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center">
                  ✓ Reset Link Authorized! Enter your new password below.
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
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
                  <span>{loading ? 'Saving Password...' : 'Save New Password'}</span>
                </button>
              </form>
            ) : (
              /* User does not have session yet, or is entering OTP code directly */
              <form onSubmit={handleResetWithOtpCode} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-xs space-y-1 text-center">
                  <p className="font-bold text-white">Reset via OTP Code or Email</p>
                  <p className="text-[11px] text-slate-400">
                    Enter your account email, 6-digit OTP code (from email), and your new password.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Account Email</label>
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
                  <label className="text-xs font-semibold text-slate-300">OTP Code / Security Token</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#FF2A5F]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
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
                  <span>{loading ? 'Verifying & Saving...' : 'Verify OTP & Set Password'}</span>
                </button>
              </form>
            )}
          </>
        )}

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/10">
          Remembered your password?{' '}
          <Link href="/auth/login" className="text-[#FF2A5F] font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-slate-400">Loading Password Reset...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
