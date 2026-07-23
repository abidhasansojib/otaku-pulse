'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { searchAnime } from '../../lib/api/jikanClient';
import { AnimeFilterState } from '../../lib/types/anime';
import { SearchBar } from '../../components/anime/SearchBar';
import { FilterSidebar } from '../../components/anime/FilterSidebar';
import { AnimeCard } from '../../components/anime/AnimeCard';
import { TrailerModal } from '../../components/anime/TrailerModal';
import { AnimeCardSkeleton } from '../../components/ui/Skeleton';
import { Sheet } from '../../components/ui/Sheet';
import { ErrorState } from '../../components/ui/ErrorState';
import { Filter, SlidersHorizontal, ArrowLeftRight, ChevronLeft, ChevronRight, X } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [activeTrailer, setActiveTrailer] = useState<{ url: string; title: string } | null>(null);

  const initialFilters: AnimeFilterState = {
    q: searchParams.get('q') || '',
    genre: searchParams.get('genre') || 'all',
    rating: searchParams.get('rating') || 'all',
    status: searchParams.get('status') || 'all',
    year: searchParams.get('year') || '',
    dubOnly: searchParams.get('dubOnly') === 'true',
    type: searchParams.get('type') || 'all',
    orderBy: searchParams.get('orderBy') || 'score',
    sort: (searchParams.get('sort') as 'asc' | 'desc') || 'desc',
  };

  const [filters, setFilters] = useState<AnimeFilterState>(initialFilters);

  // Sync state with URL params changes
  useEffect(() => {
    setFilters({
      q: searchParams.get('q') || '',
      genre: searchParams.get('genre') || 'all',
      rating: searchParams.get('rating') || 'all',
      status: searchParams.get('status') || 'all',
      year: searchParams.get('year') || '',
      dubOnly: searchParams.get('dubOnly') === 'true',
      type: searchParams.get('type') || 'all',
      orderBy: searchParams.get('orderBy') || 'score',
      sort: (searchParams.get('sort') as 'asc' | 'desc') || 'desc',
    });
  }, [searchParams]);

  // Execute API Query with dynamic cache key for genre and filters
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['searchAnime', filters.genre, filters.q, filters.type, filters.status, filters.rating, filters.orderBy, filters.sort, page],
    queryFn: () => searchAnime(filters, page, 24),
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const handleFilterChange = (newFilters: Partial<AnimeFilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    setPage(1);

    const params = new URLSearchParams();
    if (updated.q) params.set('q', updated.q);
    if (updated.genre !== 'all') params.set('genre', updated.genre);
    if (updated.rating !== 'all') params.set('rating', updated.rating);
    if (updated.status !== 'all') params.set('status', updated.status);
    if (updated.type !== 'all') params.set('type', updated.type);
    if (updated.dubOnly) params.set('dubOnly', 'true');
    if (updated.orderBy) params.set('orderBy', updated.orderBy);
    if (updated.sort) params.set('sort', updated.sort);

    router.push(`/search?${params.toString()}`);
  };

  const handleReset = () => {
    const resetState: AnimeFilterState = {
      q: '',
      genre: 'all',
      rating: 'all',
      status: 'all',
      year: '',
      dubOnly: false,
      type: 'all',
      orderBy: 'score',
      sort: 'desc',
    };
    setFilters(resetState);
    setPage(1);
    router.push('/search');
  };

  const hasNextPage = data?.pagination?.has_next_page || false;
  const totalItems = data?.pagination?.items?.total;
  const itemCount = data?.data?.length || 0;
  const lastPage = data?.pagination?.last_visible_page || (hasNextPage ? Math.max(page + 4, page + 1) : page);

  const resultsSummary = totalItems
    ? `${totalItems.toLocaleString()}`
    : hasNextPage
    ? `${(page - 1) * 24 + 1}–${(page - 1) * 24 + itemCount}+`
    : `${itemCount}`;

  const activeChips: { key: keyof AnimeFilterState; label: string; resetValue: any }[] = [];
  if (filters.q) activeChips.push({ key: 'q', label: `Search: "${filters.q}"`, resetValue: '' });
  if (filters.genre && filters.genre !== 'all') activeChips.push({ key: 'genre', label: `Genre: ${filters.genre}`, resetValue: 'all' });
  if (filters.type && filters.type !== 'all') activeChips.push({ key: 'type', label: `Format: ${filters.type.toUpperCase()}`, resetValue: 'all' });
  if (filters.status && filters.status !== 'all') activeChips.push({ key: 'status', label: `Status: ${filters.status}`, resetValue: 'all' });
  if (filters.rating && filters.rating !== 'all') activeChips.push({ key: 'rating', label: `Rating: ${filters.rating}`, resetValue: 'all' });
  if (filters.dubOnly) activeChips.push({ key: 'dubOnly', label: 'DUB Only', resetValue: false });

  return (
    <div className="space-y-8">
      {/* Top Search Bar */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <SearchBar initialValue={filters.q} onSearchSubmit={(q) => handleFilterChange({ q })} />
      </div>

      {/* Main Grid & Filters Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <FilterSidebar filters={filters} onChange={handleFilterChange} onReset={handleReset} />
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between glass-panel p-4 rounded-2xl border border-white/10">
          <div className="text-xs text-slate-300 font-semibold">
            Results Found: <span className="text-[#FF2A5F] font-bold">{resultsSummary}</span>
          </div>

          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#FF2A5F] text-[#FFFFFF] text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF2A5F]/20"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filter Options
          </button>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-xl font-extrabold text-white">
                  {filters.genre && filters.genre !== 'all'
                    ? `${filters.genre} Anime`
                    : filters.q
                    ? `Search Results for "${filters.q}"`
                    : 'Anime Directory'}
                </h2>
                <p className="text-xs text-slate-400">
                  Showing <strong className="text-white">{resultsSummary}</strong> entries
                </p>
              </div>
              <div className="hidden sm:block text-xs text-slate-400">
                Page <span className="text-white font-bold">{page}</span> of {lastPage}
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
                <span className="text-[11px] font-semibold text-slate-400">Active Filters:</span>
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => handleFilterChange({ [chip.key]: chip.resetValue })}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-200 border border-white/10 hover:border-[#FF2A5F] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all group"
                  >
                    <span>{chip.label}</span>
                    <X className="w-3 h-3 text-slate-400 group-hover:text-[#FF2A5F]" />
                  </button>
                ))}
                <button
                  onClick={handleReset}
                  className="text-xs text-[#FF2A5F] hover:underline font-bold ml-1"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <AnimeCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} isRetrying={isFetching} />
          ) : data?.data && data.data.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.data.map((anime, index) => (
                <AnimeCard
                  key={`search-card-${anime.mal_id}-${index}`}
                  anime={anime}
                  onPlayTrailer={(url, title) => setActiveTrailer({ url, title })}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-4">
              <h3 className="text-lg font-bold text-white">No Matching Anime Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try adjusting your filter preferences or searching for a different keyword.
              </p>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-[#FF2A5F] text-white font-bold text-xs"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {data?.data && data.data.length > 0 && (
            <div className="flex items-center justify-center gap-4 pt-6 border-t border-white/10">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 border border-white/10"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-xs text-slate-400">
                Page <span className="text-white font-bold">{page}</span> / {lastPage}
              </span>

              <button
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 border border-white/10"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filter */}
      <Sheet isOpen={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)}>
        <FilterSidebar filters={filters} onChange={handleFilterChange} onReset={handleReset} />
      </Sheet>

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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400 py-10">Loading Search Portal...</div>}>
      <SearchContent />
    </Suspense>
  );
}
