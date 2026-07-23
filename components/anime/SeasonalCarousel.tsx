'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { AnimeItem } from '../../lib/types/anime';
import { AnimeCard } from './AnimeCard';

interface SeasonalCarouselProps {
  items: AnimeItem[];
  onPlayTrailer: (url: string, title: string) => void;
}

export function SeasonalCarousel({ items, onPlayTrailer }: SeasonalCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF2A5F]/20 text-[#FF2A5F] flex items-center justify-center border border-[#FF2A5F]/30">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-wide">Trending Seasonal Releases</h2>
            <p className="text-xs text-slate-400">Fresh episodes airing this season</p>
          </div>
        </div>

        {/* Arrow Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-[#FF2A5F]/50 transition-colors border border-white/10"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-[#FF2A5F]/50 transition-colors border border-white/10"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Touch-Scrollable Row */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((anime, index) => (
          <div
            key={`seasonal-${anime.mal_id}-${index}`}
            className="w-[200px] sm:w-[220px] md:w-[240px] shrink-0 snap-start"
          >
            <AnimeCard anime={anime} onPlayTrailer={onPlayTrailer} />
          </div>
        ))}
      </div>
    </div>
  );
}
