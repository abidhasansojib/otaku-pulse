'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { fetchNekosWallpapers, NekosImage } from '../../lib/api/nekosClient';
import { ArtworkCard } from '../../components/gallery/ArtworkCard';
import { CategoryBar } from '../../components/gallery/CategoryBar';
import {
  Sparkles,
  RefreshCw,
  Search,
  Layers,
} from 'lucide-react';

const ArtworkModal = dynamic(
  () => import('../../components/gallery/ArtworkModal').then((mod) => mod.ArtworkModal),
  { ssr: false }
);

export default function WallpapersPage() {
  const [activeCategory, setActiveCategory] = useState<string>('waifu');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('waifu');
  const [activeArtwork, setActiveArtwork] = useState<NekosImage | null>(null);

  // 400ms Debounce implementation to respect nekos.best rate limits (7 requests per 5s)
  useEffect(() => {
    if (searchInput.trim()) {
      const handler = setTimeout(() => {
        setDebouncedQuery(searchInput.trim());
      }, 400);
      return () => clearTimeout(handler);
    } else {
      setDebouncedQuery(activeCategory);
    }
  }, [searchInput, activeCategory]);

  const handleSelectCategory = (cat: string) => {
    setActiveCategory(cat);
    setSearchInput('');
    setDebouncedQuery(cat);
  };

  // Fetch wallpapers using React Query
  const { data: artworks, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['nekosBestArtworks', debouncedQuery],
    queryFn: () => fetchNekosWallpapers(debouncedQuery, 18),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const handleDownload = async (url: string, id: string | number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `otakupulse-wallpaper-${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-[#FF2A5F]/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A5F]/20 border border-[#FF2A5F]/30 text-[#FF2A5F] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Powered by official nekos.best API v2
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Anime Wallpapers &amp; Artwork Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Explore, search, and download thousands of high-definition anime wallpapers, character art, and reaction GIFs.
            </p>
          </div>

          {/* Shuffle Button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-5 py-3 rounded-2xl bg-slate-900 border border-white/15 hover:border-[#FF2A5F] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-[#FF2A5F] ${isFetching ? 'animate-spin' : ''}`} />
            <span>Shuffle Artworks</span>
          </button>
        </div>

        {/* Debounced Search Bar & Category Pills */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
          <div className="relative max-w-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search artworks by artist, title, or topic (400ms auto-debounce rate-limit safe)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF2A5F] transition-all"
              />
            </div>
          </div>

          <CategoryBar activeCategory={activeCategory} onSelectCategory={handleSelectCategory} />
        </div>
      </div>

      {/* Query Status Bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
        <p>
          Active Filter: <strong className="text-white capitalize">{debouncedQuery}</strong>
        </p>
        <p>{artworks?.length || 0} Artworks Loaded</p>
      </div>

      {/* 3 to 4 Column Responsive Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[16/10] rounded-2xl bg-slate-900/80 border border-white/10 animate-pulse space-y-3 p-4 flex flex-col justify-end">
              <div className="h-4 bg-slate-800 rounded-md w-3/4 animate-pulse" />
              <div className="h-3 bg-slate-800 rounded-md w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      ) : !artworks || artworks.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center text-slate-400 space-y-3">
          <Layers className="w-10 h-10 text-[#FF2A5F] mx-auto" />
          <p className="text-sm font-bold text-white">No artworks found for &quot;{debouncedQuery}&quot;</p>
          <p className="text-xs">Try selecting a category pill or searching another term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworks.map((item) => (
            <ArtworkCard
              key={item.id}
              artwork={item}
              onOpenLightbox={(art) => setActiveArtwork(art)}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* HD Lightbox Modal */}
      <ArtworkModal artwork={activeArtwork} onClose={() => setActiveArtwork(null)} />
    </div>
  );
}
