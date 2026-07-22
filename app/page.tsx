'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHeroFeaturedAnime, getTopAnime, getCurrentSeasonAnime } from '../lib/api/jikanClient';
import { HeroCarousel } from '../components/anime/HeroCarousel';
import { RankTable } from '../components/anime/RankTable';
import { SeasonalCarousel } from '../components/anime/SeasonalCarousel';
import { TrailerModal } from '../components/anime/TrailerModal';
import { HeroSkeleton, AnimeCardSkeleton } from '../components/ui/Skeleton';
import { SearchBar } from '../components/anime/SearchBar';
import { Flame, Trophy } from 'lucide-react';

export default function HomePage() {
  const [activeTrailer, setActiveTrailer] = useState<{ url: string; title: string } | null>(null);

  // Fetch Hero Featured Anime
  const { data: heroItems, isLoading: isHeroLoading } = useQuery({
    queryKey: ['heroAnime'],
    queryFn: getHeroFeaturedAnime,
  });

  // Fetch Top Rated
  const { data: topRatedRes, isLoading: isTopLoading } = useQuery({
    queryKey: ['topRatedAnime'],
    queryFn: () => getTopAnime('rating', 1, 15),
  });

  // Fetch Most Popular
  const { data: popularRes, isLoading: isPopularLoading } = useQuery({
    queryKey: ['mostPopularAnime'],
    queryFn: () => getTopAnime('bypopularity', 1, 15),
  });

  // Fetch Current Season
  const { data: seasonRes, isLoading: isSeasonLoading } = useQuery({
    queryKey: ['currentSeasonAnime'],
    queryFn: () => getCurrentSeasonAnime(15),
  });

  const handlePlayTrailer = (url: string, title: string) => {
    setActiveTrailer({ url, title });
  };

  return (
    <div className="space-y-12">
      {/* Search Bar Section */}
      <div className="flex flex-col items-center justify-center pt-2 pb-4 space-y-3 text-center">
        <SearchBar />
      </div>

      {/* Hero Carousel Section */}
      <section aria-label="Featured Spotlight">
        {isHeroLoading || !heroItems ? (
          <HeroSkeleton />
        ) : (
          <HeroCarousel items={heroItems} onPlayTrailer={handlePlayTrailer} />
        )}
      </section>

      {/* Seasonal Carousel Section */}
      <section aria-label="Trending Seasonal Anime">
        {isSeasonLoading || !seasonRes?.data ? (
          <div className="space-y-4">
            <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <AnimeCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <SeasonalCarousel items={seasonRes.data} onPlayTrailer={handlePlayTrailer} />
        )}
      </section>

      {/* Rankings Section */}
      <section aria-label="Top Anime Rankings" className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#8A2BE2]/20 text-[#C77DFF] flex items-center justify-center border border-[#8A2BE2]/30">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-wide">Global Anime Rankings</h2>
            <p className="text-xs text-slate-400">Discover the highest rated and most watched series worldwide</p>
          </div>
        </div>

        <RankTable
          topRated={topRatedRes?.data || []}
          mostPopular={popularRes?.data || []}
          currentSeason={seasonRes?.data || []}
          isLoading={isTopLoading || isPopularLoading}
          onPlayTrailer={handlePlayTrailer}
        />
      </section>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={!!activeTrailer}
        onClose={() => setActiveTrailer(null)}
        trailerUrl={activeTrailer?.url || null}
        title={activeTrailer?.title || ''}
      />
    </div>
  );
}
