'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Flame, Calendar, Volume2, LayoutGrid, List, Play } from 'lucide-react';
import { AnimeItem } from '../../lib/types/anime';
import { Badge } from '../ui/Badge';
import { AnimeCard } from './AnimeCard';

interface RankTableProps {
  topRated: AnimeItem[];
  mostPopular: AnimeItem[];
  currentSeason: AnimeItem[];
  isLoading: boolean;
  onPlayTrailer: (url: string, title: string) => void;
}

export function RankTable({ topRated, mostPopular, currentSeason, isLoading, onPlayTrailer }: RankTableProps) {
  const [activeTab, setActiveTab] = useState<'rated' | 'popular' | 'season'>('rated');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const tabs = [
    { id: 'rated', label: 'Top Rated', icon: Trophy, data: topRated },
    { id: 'popular', label: 'Most Popular', icon: Flame, data: mostPopular },
    { id: 'season', label: 'Current Season', icon: Calendar, data: currentSeason },
  ];

  const currentData = tabs.find((t) => t.id === activeTab)?.data || [];

  return (
    <div className="w-full space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-white/5 w-full sm:w-auto overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] rounded-lg shadow-md"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              viewMode === 'table' ? 'bg-[#FF2A5F] text-white' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              viewMode === 'grid' ? 'bg-[#FF2A5F] text-white' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table / Grid Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentData.slice(0, 15).map((anime, index) => (
                <AnimeCard
                  key={`rank-grid-${anime.mal_id}-${index}`}
                  anime={anime}
                  rank={index + 1}
                  onPlayTrailer={onPlayTrailer}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                    <th className="py-4 px-4 text-center w-16">Rank</th>
                    <th className="py-4 px-4">Anime</th>
                    <th className="py-4 px-4 hidden md:table-cell">Type & Ep</th>
                    <th className="py-4 px-4">Audio Dub</th>
                    <th className="py-4 px-4 text-right">Score</th>
                    <th className="py-4 px-4 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {currentData.slice(0, 15).map((anime, index) => {
                    const rank = index + 1;
                    const title = anime.title_english || anime.title;
                    const poster = anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url;

                    return (
                      <tr
                        key={`rank-row-${anime.mal_id}-${index}`}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center font-black">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs ${
                              rank === 1
                                ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                                : rank === 2
                                ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black'
                                : rank === 3
                                ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-white font-black'
                                : 'text-slate-400 bg-slate-900/60 border border-white/5'
                            }`}
                          >
                            #{rank}
                          </span>
                        </td>

                        {/* Anime Title & Poster */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-900">
                              <Image
                                src={poster || '/banner-placeholder.webp'}
                                alt={title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/anime/${anime.mal_id}`}
                                className="font-bold text-white hover:text-[#FF2A5F] transition-colors line-clamp-1 block text-sm"
                              >
                                {title}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                {anime.genres?.slice(0, 2).map((g) => (
                                  <span key={g.mal_id} className="text-[10px] text-slate-400">
                                    {g.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Format & Ep */}
                        <td className="py-3 px-4 hidden md:table-cell text-xs text-slate-300">
                          <div>{anime.type || 'TV'}</div>
                          <div className="text-[11px] text-slate-400">{anime.episodes ? `${anime.episodes} episodes` : 'Ongoing'}</div>
                        </td>

                        {/* Audio Dub */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" size="sm">
                              <Volume2 className="w-3 h-3 mr-1 text-[#C77DFF]" />
                              JPN / ENG
                            </Badge>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1 bg-[#FF2A5F]/15 border border-[#FF2A5F]/30 text-[#FF2A5F] px-2.5 py-1 rounded-lg font-bold text-xs">
                            <Star className="w-3.5 h-3.5 fill-[#FF2A5F]" />
                            <span>{anime.score ? anime.score.toFixed(1) : 'N/A'}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-center">
                          {anime.trailer?.embed_url ? (
                            <button
                              onClick={() => onPlayTrailer(anime.trailer!.embed_url!, title)}
                              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-[#FF2A5F] transition-all"
                              title="Play Trailer"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                          ) : (
                            <Link
                              href={`/anime/${anime.mal_id}`}
                              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
