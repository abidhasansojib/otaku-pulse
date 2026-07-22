'use client';

import React from 'react';
import { Filter, RefreshCw, Volume2 } from 'lucide-react';
import { AnimeFilterState } from '../../lib/types/anime';

interface FilterSidebarProps {
  filters: AnimeFilterState;
  onChange: (newFilters: Partial<AnimeFilterState>) => void;
  onReset: () => void;
}

const GENRES = [
  { id: 'all', name: 'All Genres' },
  { id: '1', name: 'Action' },
  { id: '2', name: 'Adventure' },
  { id: '4', name: 'Comedy' },
  { id: '8', name: 'Drama' },
  { id: '10', name: 'Fantasy' },
  { id: '14', name: 'Horror' },
  { id: '22', name: 'Romance' },
  { id: '24', name: 'Sci-Fi' },
  { id: '36', name: 'Slice of Life' },
  { id: '37', name: 'Supernatural' },
  { id: '41', name: 'Suspense' },
];

const RATINGS = [
  { id: 'all', name: 'All Ratings' },
  { id: 'g', name: 'G - All Ages' },
  { id: 'pg', name: 'PG - Children' },
  { id: 'pg13', name: 'PG-13 - Teens 13+' },
  { id: 'r17', name: 'R-17+ (Violence & Profanity)' },
];

const STATUSES = [
  { id: 'all', name: 'All Statuses' },
  { id: 'airing', name: 'Currently Airing' },
  { id: 'complete', name: 'Finished Airing' },
  { id: 'upcoming', name: 'Upcoming' },
];

const TYPES = [
  { id: 'all', name: 'All Formats' },
  { id: 'tv', name: 'TV Series' },
  { id: 'movie', name: 'Movie' },
  { id: 'ova', name: 'OVA' },
  { id: 'special', name: 'Special' },
];

export function FilterSidebar({ filters, onChange, onReset }: FilterSidebarProps) {
  return (
    <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#FF2A5F]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-[#FF2A5F] flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Dub Availability Filter */}
      <div className="p-3 rounded-2xl bg-[#8A2BE2]/10 border border-[#8A2BE2]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#C77DFF]" />
          <span className="text-xs font-bold text-white">English Dub Only</span>
        </div>
        <input
          type="checkbox"
          checked={filters.dubOnly}
          onChange={(e) => onChange({ dubOnly: e.target.checked })}
          className="w-4 h-4 accent-[#FF2A5F] rounded cursor-pointer"
        />
      </div>

      {/* Genre Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Genre</label>
        <select
          value={filters.genre}
          onChange={(e) => onChange({ genre: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF2A5F]"
        >
          {GENRES.map((g) => (
            <option key={g.id} value={g.id} className="bg-[#0B0F19]">
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Format / Type */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Format</label>
        <select
          value={filters.type}
          onChange={(e) => onChange({ type: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF2A5F]"
        >
          {TYPES.map((t) => (
            <option key={t.id} value={t.id} className="bg-[#0B0F19]">
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Status</label>
        <select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF2A5F]"
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#0B0F19]">
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Content Rating</label>
        <select
          value={filters.rating}
          onChange={(e) => onChange({ rating: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF2A5F]"
        >
          {RATINGS.map((r) => (
            <option key={r.id} value={r.id} className="bg-[#0B0F19]">
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Sort By</label>
        <select
          value={`${filters.orderBy}-${filters.sort}`}
          onChange={(e) => {
            const [orderBy, sort] = e.target.value.split('-');
            onChange({ orderBy, sort: sort as 'asc' | 'desc' });
          }}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF2A5F]"
        >
          <option value="score-desc" className="bg-[#0B0F19]">Highest Score</option>
          <option value="popularity-asc" className="bg-[#0B0F19]">Most Popular</option>
          <option value="rank-asc" className="bg-[#0B0F19]">Top Rank</option>
          <option value="start_date-desc" className="bg-[#0B0F19]">Newest Releases</option>
          <option value="title-asc" className="bg-[#0B0F19]">Title (A-Z)</option>
        </select>
      </div>
    </div>
  );
}
