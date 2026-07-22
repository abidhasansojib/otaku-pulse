'use client';

import React from 'react';
import { Volume2, CheckCircle2, XCircle, Globe, Info } from 'lucide-react';
import { DubSeasonInfo } from '../../lib/types/anime';
import { Badge } from '../ui/Badge';

interface DubMatrixProps {
  matrix: DubSeasonInfo[];
}

export function DubMatrix({ matrix }: DubMatrixProps) {
  if (!matrix || matrix.length === 0) return null;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#8A2BE2]/20 border border-[#8A2BE2]/40 text-[#C77DFF] flex items-center justify-center">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Multi-Audio & Dub Matrix
            </h3>
            <p className="text-xs text-slate-400">Season-by-season dub & voice track availability</p>
          </div>
        </div>

        <Badge variant="cyber" size="md">
          <Globe className="w-3.5 h-3.5 mr-1" /> Multi-Region
        </Badge>
      </div>

      {/* Grid Table */}
      <div className="space-y-4">
        {matrix.map((season, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3 hover:border-white/10 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF2A5F]" />
                {season.seasonName}
              </h4>
              <span className="text-xs text-slate-400 font-medium line-clamp-1">{season.title}</span>
            </div>

            {/* Language Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {season.languages.map((lang, lIdx) => (
                <div
                  key={lIdx}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    lang.available
                      ? lang.isOriginal
                        ? 'bg-[#8A2BE2]/15 border-[#8A2BE2]/40 text-purple-200'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800/40 border-white/5 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {lang.available ? (
                      <CheckCircle2 className={`w-4 h-4 ${lang.isOriginal ? 'text-[#C77DFF]' : 'text-emerald-400'}`} />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    )}
                    <span className="font-semibold">{lang.language}</span>
                  </div>

                  {lang.note && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-white/5">
                      <Info className="w-3 h-3 text-[#FF2A5F]" />
                      {lang.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
