'use client';

import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  message = "Anime sync in progress. Retrying request...",
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-4 shadow-xl max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
        <AlertTriangle className="w-7 h-7 animate-pulse" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-white tracking-wide">Syncing Anime Data</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white text-xs font-bold shadow-lg shadow-[#FF2A5F]/20 hover:scale-105 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>Refresh Results</span>
        </button>
      )}
    </div>
  );
}
