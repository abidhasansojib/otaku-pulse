'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSeasonalAnime, fetchSeasonsList, getCurrentSeasonAndYear, SeasonOption } from '../../lib/api/jikanClient';
import { AnimeCard } from '../../components/anime/AnimeCard';
import { TrailerModal } from '../../components/anime/TrailerModal';
import { AnimeCardSkeleton } from '../../components/ui/Skeleton';
import { Calendar, Sparkles } from 'lucide-react';

export default function SeasonsPage() {
  const current = getCurrentSeasonAndYear();
  const [selectedYear, setSelectedYear] = useState<number>(current.year);
  const [selectedSeason, setSelectedSeason] = useState<string>(current.season);
  const [activeTrailer, setActiveTrailer] = useState<{ url: string; title: string } | null>(null);

  // Fetch Dynamic Seasons List from Jikan API / Date
  const { data: seasonsList } = useQuery<SeasonOption[]>({
    queryKey: ['seasonsList'],
    queryFn: fetchSeasonsList,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Automatically select current season once seasonsList loads if not already selected
  useEffect(() => {
    if (seasonsList && seasonsList.length > 0) {
      const activeOption = seasonsList.find((s) => s.isCurrent);
      if (activeOption) {
        setSelectedYear(activeOption.year);
        setSelectedSeason(activeOption.season);
      }
    }
  }, [seasonsList]);

  // Fetch Seasonal Anime
  const { data: seasonalData, isLoading } = useQuery({
    queryKey: ['seasonalAnimeHub', selectedYear, selectedSeason],
    queryFn: () => getSeasonalAnime(selectedYear, selectedSeason, 1, 24),
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  const activeSeasonLabel =
    seasonsList?.find((s) => s.year === selectedYear && s.season === selectedSeason)?.label ||
    `${selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1)} ${selectedYear}`;

  return (
    <div className="space-y-8">
      {/* Header & Season Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] flex items-center justify-center text-white shadow-lg shadow-[#FF2A5F]/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
              Seasonal Anime Hub
            </h1>
            <p className="text-xs text-slate-400">
              Currently Viewing: <span className="text-[#FF2A5F] font-bold">{activeSeasonLabel}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Dropdown Switcher */}
        <div className="flex items-center gap-2">
          <select
            value={`${selectedYear}-${selectedSeason}`}
            onChange={(e) => {
              const [y, s] = e.target.value.split('-');
              setSelectedYear(parseInt(y, 10));
              setSelectedSeason(s);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-[#FF2A5F] transition-colors cursor-pointer"
          >
            {seasonsList && seasonsList.length > 0 ? (
              seasonsList.map((item) => (
                <option key={`${item.year}-${item.season}`} value={`${item.year}-${item.season}`}>
                  {item.label}
                </option>
              ))
            ) : (
              <option value={`${current.year}-${current.season}`}>
                {current.season.charAt(0).toUpperCase() + current.season.slice(1)} {current.year} (Current Season)
              </option>
            )}
          </select>
        </div>
      </div>

      {/* Anime Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <AnimeCardSkeleton key={idx} />
          ))}
        </div>
      ) : seasonalData?.data && seasonalData.data.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {seasonalData.data.map((anime) => (
            <AnimeCard
              key={anime.mal_id}
              anime={anime}
              onPlayTrailer={(url, title) => setActiveTrailer({ url, title })}
            />
          ))}
        </div>
      ) : (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center glass-panel rounded-3xl border border-white/10 p-8 space-y-3">
          <Sparkles className="w-8 h-8 text-[#FF2A5F]" />
          <h3 className="text-lg font-bold text-white">No Seasonal Titles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm">Try selecting a different season or year archive above.</p>
        </div>
      )}

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
