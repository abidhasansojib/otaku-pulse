'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Flame, Calendar, Volume2, LayoutGrid, List, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeItem } from '../../lib/types/anime';
import { Badge } from '../ui/Badge';
import { AnimeCard } from './AnimeCard';
import { AnimeCardSkeleton } from '../ui/Skeleton';
import { getTopAnime, getCurrentSeasonAnime } from '../../lib/api/jikanClient';

interface RankTableProps {
  topRated: AnimeItem[];
  mostPopular: AnimeItem[];
  currentSeason: AnimeItem[];
  isLoading: boolean;
  onPlayTrailer: (url: string, title: string) => void;
}

export function RankTable({ topRated, mostPopular, currentSeason, isLoading: initialLoading, onPlayTrailer }: RankTableProps) {
  const [activeTab, setActiveTab] = useState<'rated' | 'popular' | 'season'>('rated');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [pages, setPages] = useState<{ rated: number; popular: number; season: number }>({
    rated: 1,
    popular: 1,
    season: 1,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const currentPage = pages[activeTab];

  // Fetch Page-based 100-batch data via TanStack Query
  const { data: ratedData, isLoading: isRatedLoading } = useQuery({
    queryKey: ['rankings', 'rated', pages.rated],
    queryFn: async () => {
      const res = await getTopAnime('rating', pages.rated, 100);
      return res.data || [];
    },
    initialData: pages.rated === 1 && topRated.length > 0 ? topRated : undefined,
    staleTime: 1000 * 60 * 15,
  });

  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ['rankings', 'popular', pages.popular],
    queryFn: async () => {
      const res = await getTopAnime('bypopularity', pages.popular, 100);
      return res.data || [];
    },
    initialData: pages.popular === 1 && mostPopular.length > 0 ? mostPopular : undefined,
    staleTime: 1000 * 60 * 15,
  });

  const { data: seasonData, isLoading: isSeasonLoading } = useQuery({
    queryKey: ['rankings', 'season', pages.season],
    queryFn: async () => {
      const res = await getCurrentSeasonAnime(100, pages.season);
      return res.data || [];
    },
    initialData: pages.season === 1 && currentSeason.length > 0 ? currentSeason : undefined,
    staleTime: 1000 * 60 * 15,
  });

  const tabConfigs = [
    { id: 'rated', label: 'Top Rated', icon: Trophy, data: ratedData || [], isLoading: isRatedLoading && pages.rated !== 1 },
    { id: 'popular', label: 'Most Popular', icon: Flame, data: popularData || [], isLoading: isPopularLoading && pages.popular !== 1 },
    { id: 'season', label: 'Current Season', icon: Calendar, data: seasonData || [], isLoading: isSeasonLoading && pages.season !== 1 },
  ];

  const currentConfig = tabConfigs.find((t) => t.id === activeTab)!;
  const currentData = currentConfig.data;
  const isLoading = initialLoading || currentConfig.isLoading;

  const handleTabChange = (tabId: 'rated' | 'popular' | 'season') => {
    setActiveTab(tabId);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    setPages((prev) => ({ ...prev, [activeTab]: newPage }));
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const startRank = (currentPage - 1) * 100 + 1;
  const endRank = startRank + (currentData.length > 0 ? currentData.length - 1 : 99);

  return (
    <div ref={containerRef} className="w-full space-y-6 scroll-mt-24">
      {/* Header & Controls Panel */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10 shadow-xl">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/80 rounded-xl border border-white/5 w-full lg:w-auto overflow-x-auto">
          {tabConfigs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
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
                  {tab.data.length > 0 && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 text-slate-300 font-normal">
                      100 list
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5 self-end lg:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              viewMode === 'table' ? 'bg-[#FF2A5F] text-white' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Table View"
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              viewMode === 'grid' ? 'bg-[#FF2A5F] text-white' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Grid View"
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table / Grid Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + viewMode + currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {isLoading ? (
            /* Skeleton Loading State */
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 15 }).map((_, i) => (
                  <AnimeCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-6 space-y-4 border border-white/10">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-800/60 rounded-xl animate-pulse w-full" />
                ))}
              </div>
            )
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentData.map((anime, index) => {
                const rank = startRank + index;
                return (
                  <AnimeCard
                    key={`rank-grid-${anime.mal_id}-${rank}`}
                    anime={anime}
                    rank={rank}
                    onPlayTrailer={onPlayTrailer}
                  />
                );
              })}
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
                  {currentData.map((anime, index) => {
                    const rank = startRank + index;
                    const title = anime.title_english || anime.title;
                    const poster = anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url;

                    return (
                      <tr
                        key={`rank-row-${anime.mal_id}-${rank}`}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center font-black">
                          <span
                            className={`inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-xl text-xs ${
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
                          <div className="text-[11px] text-slate-400">
                            {anime.episodes ? `${anime.episodes} episodes` : 'Ongoing'}
                          </div>
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

      {/* Page Navigation Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Rank Range Summary */}
        <div className="text-xs text-slate-400 text-center sm:text-left font-medium">
          Showing Ranks <strong className="text-white">#{startRank}</strong> –{' '}
          <strong className="text-white">#{endRank}</strong> (100 per page)
        </div>

        {/* Page Slide Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {/* Previous Page Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:bg-[#FF2A5F] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-xs font-bold shrink-0"
            aria-label="Previous 100 Rankings"
            title="Previous 100 Rankings"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev 100</span>
          </button>

          {/* Page Pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {Array.from({ length: 7 }, (_, i) => {
              const pNum = i + 1;
              const isActive = pNum === currentPage;
              const pStart = (pNum - 1) * 100 + 1;
              const pEnd = pNum * 100;

              return (
                <button
                  key={`rank-page-pill-${pNum}`}
                  onClick={() => handlePageChange(pNum)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white shadow-lg scale-105'
                      : 'bg-slate-900/80 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={`View Ranks #${pStart}–#${pEnd}`}
                >
                  Page {pNum}
                  <span className="hidden md:inline text-[10px] ml-1 opacity-80 font-normal">
                    (#{pStart}–{pEnd})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:bg-[#FF2A5F] transition-all flex items-center gap-1 text-xs font-bold shrink-0"
            aria-label="Next 100 Rankings"
            title="Next 100 Rankings"
          >
            <span>Next 100</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
