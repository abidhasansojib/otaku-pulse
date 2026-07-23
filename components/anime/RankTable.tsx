'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Flame, Calendar, Volume2, LayoutGrid, List, Play, ChevronLeft, ChevronRight, Eye, Layers } from 'lucide-react';
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
  const [pageSize, setPageSize] = useState<15 | 100>(15);

  // Page state for 15 mode and 100 mode
  const [pages15, setPages15] = useState<{ rated: number; popular: number; season: number }>({
    rated: 1,
    popular: 1,
    season: 1,
  });

  const [pages100, setPages100] = useState<{ rated: number; popular: number; season: number }>({
    rated: 1,
    popular: 1,
    season: 1,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Active page & rank math based on mode
  const activePage = pageSize === 15 ? pages15[activeTab] : pages100[activeTab];
  const startRank = pageSize === 15 ? (activePage - 1) * 15 + 1 : (activePage - 1) * 100 + 1;
  const endRank = startRank + pageSize - 1;

  // Batches needed from 100-item API
  const startBatch = Math.ceil(startRank / 100);
  const endBatch = Math.ceil(endRank / 100);

  // Helper fetcher
  const fetchBatch = async (tab: 'rated' | 'popular' | 'season', batchNum: number) => {
    if (tab === 'rated') {
      const res = await getTopAnime('rating', batchNum, 100);
      return res.data || [];
    } else if (tab === 'popular') {
      const res = await getTopAnime('bypopularity', batchNum, 100);
      return res.data || [];
    } else {
      const res = await getCurrentSeasonAnime(100, batchNum);
      return res.data || [];
    }
  };

  const getInitialBatchData = (tab: string, batchNum: number) => {
    if (batchNum !== 1) return undefined;
    if (tab === 'rated' && topRated.length > 0) return topRated;
    if (tab === 'popular' && mostPopular.length > 0) return mostPopular;
    if (tab === 'season' && currentSeason.length > 0) return currentSeason;
    return undefined;
  };

  // Primary Batch Query
  const { data: b1Data, isLoading: isB1Loading } = useQuery({
    queryKey: ['rankBatch', activeTab, startBatch],
    queryFn: () => fetchBatch(activeTab, startBatch),
    initialData: getInitialBatchData(activeTab, startBatch),
    staleTime: 1000 * 60 * 15,
  });

  // Secondary Batch Query (in case 15 items cross 100 boundary)
  const { data: b2Data, isLoading: isB2Loading } = useQuery({
    queryKey: ['rankBatch', activeTab, endBatch],
    queryFn: () => fetchBatch(activeTab, endBatch),
    enabled: endBatch !== startBatch,
    staleTime: 1000 * 60 * 15,
  });

  const isLoading = initialLoading || isB1Loading || (endBatch !== startBatch && isB2Loading);

  // Compute displayed item slice
  let displayedData: AnimeItem[] = [];
  if (!isLoading && b1Data) {
    if (pageSize === 100) {
      displayedData = b1Data;
    } else {
      const offset = (startRank - 1) % 100;
      if (startBatch === endBatch) {
        displayedData = b1Data.slice(offset, offset + 15);
      } else {
        const combined = [...b1Data, ...(b2Data || [])];
        displayedData = combined.slice(offset, offset + 15);
      }
    }
  }

  const handleTabChange = (tabId: 'rated' | 'popular' | 'season') => {
    setActiveTab(tabId);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    if (pageSize === 15) {
      setPages15((prev) => ({ ...prev, [activeTab]: newPage }));
    } else {
      setPages100((prev) => ({ ...prev, [activeTab]: newPage }));
    }
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const togglePageSize = (newSize: 15 | 100) => {
    if (newSize === pageSize) return;
    if (newSize === 100) {
      // Map current 15-mode rank to 100-mode page
      const current15Page = pages15[activeTab];
      const currentRank = (current15Page - 1) * 15 + 1;
      const equivalent100Page = Math.ceil(currentRank / 100);
      setPages100((prev) => ({ ...prev, [activeTab]: equivalent100Page }));
    } else {
      // Map current 100-mode rank to 15-mode page
      const current100Page = pages100[activeTab];
      const currentRank = (current100Page - 1) * 100 + 1;
      const equivalent15Page = Math.ceil(currentRank / 15);
      setPages15((prev) => ({ ...prev, [activeTab]: equivalent15Page }));
    }
    setPageSize(newSize);
  };

  // Generate dynamic page numbers centered around activePage (Unlimited Page Navigation)
  const renderPagePills = () => {
    const p = activePage;
    const startP = Math.max(1, p - 3);
    const endP = startP + 6;
    const pageNumbers: number[] = [];
    for (let i = startP; i <= endP; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers.map((pNum) => {
      const isActive = pNum === activePage;
      const pStart = pageSize === 15 ? (pNum - 1) * 15 + 1 : (pNum - 1) * 100 + 1;
      const pEnd = pStart + pageSize - 1;

      return (
        <button
          key={`rank-pill-${pageSize}-${pNum}`}
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
    });
  };

  const actualEndRank = startRank + (displayedData.length > 0 ? displayedData.length - 1 : pageSize - 1);

  return (
    <div ref={containerRef} className="w-full space-y-6 scroll-mt-24">
      {/* Header & Controls Panel */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10 shadow-xl">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/80 rounded-xl border border-white/5 w-full lg:w-auto overflow-x-auto">
          {[
            { id: 'rated', label: 'Top Rated', icon: Trophy },
            { id: 'popular', label: 'Most Popular', icon: Flame },
            { id: 'season', label: 'Current Season', icon: Calendar },
          ].map((tab) => {
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
          key={activeTab + viewMode + pageSize + activePage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {isLoading ? (
            /* Skeleton Loading State */
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: pageSize === 15 ? 15 : 20 }).map((_, i) => (
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
              {displayedData.map((anime, index) => {
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
                  {displayedData.map((anime, index) => {
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

      {/* Page Navigation & Display Mode Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Rank Range Summary */}
        <div className="text-xs text-slate-400 text-center sm:text-left font-medium">
          Showing Ranks <strong className="text-white">#{startRank}</strong> –{' '}
          <strong className="text-white">#{actualEndRank}</strong> ({pageSize} per page)
        </div>

        {/* Dynamic Page Slide Navigation (Unlimited Pages) */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {/* Previous Page Button */}
          <button
            onClick={() => handlePageChange(activePage - 1)}
            disabled={activePage === 1}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:bg-[#FF2A5F] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-xs font-bold shrink-0"
            aria-label="Previous Page"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          {/* Page Pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {renderPagePills()}
          </div>

          {/* Next Page Button (Unlimited) */}
          <button
            onClick={() => handlePageChange(activePage + 1)}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:bg-[#FF2A5F] transition-all flex items-center gap-1 text-xs font-bold shrink-0"
            aria-label="Next Page"
            title="Next Page"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Mode Button: Show 100 in a page vs Show 15 in a page */}
        {pageSize === 15 ? (
          <button
            onClick={() => togglePageSize(100)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white text-xs font-bold transition-all hover:scale-105 shadow-md flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            Show 100 in a page
          </button>
        ) : (
          <button
            onClick={() => togglePageSize(15)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200 hover:text-white text-xs font-bold transition-all hover:scale-105 shadow-md flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Layers className="w-3.5 h-3.5 text-[#FF2A5F]" />
            Show 15 in a page
          </button>
        )}
      </div>
    </div>
  );
}
