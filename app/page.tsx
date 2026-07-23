'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getHeroFeaturedAnime, getTopAnime, getCurrentSeasonAnime, getAnimeGenres } from '../lib/api/jikanClient';
import { HeroCarousel } from '../components/anime/HeroCarousel';
import { RankTable } from '../components/anime/RankTable';
import { SeasonalCarousel } from '../components/anime/SeasonalCarousel';
import { TrailerModal } from '../components/anime/TrailerModal';
import { HeroSkeleton, AnimeCardSkeleton } from '../components/ui/Skeleton';
import { SearchBar } from '../components/anime/SearchBar';
import { Flame, Trophy, Compass, Sparkles } from 'lucide-react';

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
    queryFn: () => getTopAnime('rating', 1, 100),
  });

  // Fetch Most Popular
  const { data: popularRes, isLoading: isPopularLoading } = useQuery({
    queryKey: ['mostPopularAnime'],
    queryFn: () => getTopAnime('bypopularity', 1, 100),
  });

  // Fetch Current Season
  const { data: seasonRes, isLoading: isSeasonLoading } = useQuery({
    queryKey: ['currentSeasonAnime'],
    queryFn: () => getCurrentSeasonAnime(100),
  });

  // Fetch Official Genres (GET /genres/anime)
  const { data: genres } = useQuery({
    queryKey: ['animeGenresList'],
    queryFn: getAnimeGenres,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const handlePlayTrailer = (url: string, title: string) => {
    setActiveTrailer({ url, title });
  };

  return (
    <div className="space-y-12">
      {/* Search Bar Section */}
      <div className="flex flex-col items-center justify-center pt-2 pb-2 space-y-3 text-center">
        <SearchBar />
      </div>

      {/* Explore by Genre Pill Navbar/Grid */}
      <section aria-label="Explore by Genre" className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Compass className="w-4 h-4 text-[#FF2A5F]" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Explore by Genre</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {genres?.slice(0, 14).map((g) => (
            <Link
              key={g.mal_id}
              href={`/search?genre=${g.mal_id}`}
              className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-[#FF2A5F] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all hover:scale-105"
            >
              {g.name}
            </Link>
          ))}
          <Link
            href="/search"
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white text-xs font-bold transition-all hover:scale-105"
          >
            All Genres & Filter →
          </Link>
        </div>
      </section>

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
