'use client';

import React from 'react';
import Link from 'next/link';
import { GitCommit, ArrowRight, Film, ExternalLink } from 'lucide-react';
import { AnimeRelation } from '../../lib/types/anime';

interface RelationsTimelineProps {
  relations?: AnimeRelation[];
}

export function RelationsTimeline({ relations }: RelationsTimelineProps) {
  if (!relations || relations.length === 0) return null;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-[#FF2A5F]/20 border border-[#FF2A5F]/40 text-[#FF2A5F] flex items-center justify-center">
          <GitCommit className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Related Franchise & Timeline</h3>
          <p className="text-xs text-slate-400">Prequels, Sequels, Side Stories, and Movies</p>
        </div>
      </div>

      {/* Timeline Tree */}
      <div className="relative pl-6 space-y-6 border-l-2 border-[#8A2BE2]/40">
        {relations.map((rel, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Node Icon */}
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#0B0F19] border-2 border-[#8A2BE2] group-hover:bg-[#FF2A5F] group-hover:border-[#FF2A5F] transition-colors" />

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#C77DFF] uppercase tracking-wider bg-[#8A2BE2]/10 px-2.5 py-0.5 rounded-full border border-[#8A2BE2]/20">
                  {rel.relation}
                </span>
                <span className="text-[10px] text-slate-500">{rel.entry.length} entries</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {rel.entry.map((entry) => (
                  <Link
                    key={entry.mal_id}
                    href={`/anime/${entry.mal_id}`}
                    className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/5 hover:border-[#FF2A5F]/40 flex items-center justify-between group/link transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Film className="w-4 h-4 text-slate-400 shrink-0 group-hover/link:text-[#FF2A5F]" />
                      <span className="text-xs text-slate-200 font-semibold truncate group-hover/link:text-white">
                        {entry.name}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover/link:text-[#FF2A5F] group-hover/link:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
