'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getAnimeById } from '../../../lib/api/jikanClient';
import { HDArtworkGallery } from '../../../components/anime/HDArtworkGallery';
import { AnimeCharacters } from '../../../components/anime/AnimeCharacters';
import { AnimeRecommendations } from '../../../components/anime/AnimeRecommendations';
import { AnimeReviews } from '../../../components/anime/AnimeReviews';
import { TrailerModal } from '../../../components/anime/TrailerModal';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useFavorites } from '../../../lib/hooks/useFavorites';
import { useAuth } from '../../../lib/context/AuthContext';
import { createClient } from '../../../lib/supabase/client';
import {
  Star,
  Play,
  Bookmark,
  Download,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  Tv,
  Building,
  BookOpen,
  ArrowLeft,
  ListVideo,
  Check,
} from 'lucide-react';

export default function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const animeId = resolvedParams.id;
  const numericAnimeId = parseInt(animeId, 10) || 0;

  const { user } = useAuth();
  const supabase = createClient();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [isUpdatingWatchlist, setIsUpdatingWatchlist] = useState(false);
  const [watchlistMsg, setWatchlistMsg] = useState<string | null>(null);

  // Fetch Full Anime Data
  const { data: anime, isLoading } = useQuery({
    queryKey: ['animeDetail', animeId],
    queryFn: () => getAnimeById(animeId),
    enabled: !!animeId,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });

  // Fetch existing watchlist status for logged-in user
  useEffect(() => {
    if (user && numericAnimeId) {
      fetchUserWatchlistStatus();
    }
  }, [user, numericAnimeId]);

  const fetchUserWatchlistStatus = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('status')
        .eq('user_id', user.id)
        .eq('anime_id', numericAnimeId)
        .single();

      if (!error && data) {
        setWatchlistStatus(data.status);
      }
    } catch (e) {
      // Silent catch
    }
  };

  const handleWatchlistChange = async (newStatus: string) => {
    if (!user) return;
    setIsUpdatingWatchlist(true);
    setWatchlistMsg(null);

    const posterUrl =
      anime?.images?.webp?.large_image_url ||
      anime?.images?.jpg?.large_image_url ||
      '/banner-placeholder.webp';

    const title = anime?.title_english || anime?.title || 'Anime';

    try {
      if (newStatus === 'REMOVE') {
        await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('anime_id', numericAnimeId);

        setWatchlistStatus(null);
        setWatchlistMsg('Removed from Watchlist');
      } else {
        const { error } = await supabase.from('watchlist').upsert(
          {
            user_id: user.id,
            anime_id: numericAnimeId,
            title,
            poster_url: posterUrl,
            status: newStatus,
          },
          { onConflict: 'user_id,anime_id' }
        );

        if (error) throw error;
        setWatchlistStatus(newStatus);
        setWatchlistMsg(`Watchlist set to: ${newStatus.replace(/_/g, ' ')}`);
      }
    } catch (err: any) {
      setWatchlistMsg(`Error: ${err.message}`);
    } finally {
      setIsUpdatingWatchlist(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pt-4">
        <Skeleton className="w-full h-80 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 px-4">
        <h2 className="text-2xl font-bold text-white">Anime Not Found</h2>
        <p className="text-slate-400 text-sm max-w-md">
          The requested anime details could not be loaded. Please try returning to discover or searching another title.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-[#FF2A5F] text-white font-bold text-xs shadow-lg shadow-[#FF2A5F]/20"
        >
          Return to Discovery
        </Link>
      </div>
    );
  }

  const title = anime.title_english || anime.title;
  const japaneseTitle = anime.title_japanese || '';
  const score = anime.score ? anime.score.toFixed(1) : 'N/A';
  const posterUrl =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    '/banner-placeholder.webp';

  const backdropUrl =
    anime.banner_url ||
    anime.trailer?.images?.maximum_image_url ||
    posterUrl;

  const trailerEmbed = anime.trailer?.embed_url;
  const bookmarked = isFavorite(anime.mal_id);

  const handleDownloadBanner = async () => {
    try {
      const response = await fetch(backdropUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_banner.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(backdropUrl, '_blank');
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10 min-w-0 overflow-hidden">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-[#FF2A5F]/40 text-xs font-semibold transition-all border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>
      </div>

      {/* Hero Header Banner */}
      <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-2xl">
        <Image
          src={backdropUrl}
          alt={title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover brightness-60"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/50 to-transparent" />

        {/* Floating Quick-Stats Overlay in Top Right */}
        <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-panel border border-white/20 shadow-xl backdrop-blur-md">
          {anime.score && (
            <div className="flex items-center gap-1 text-xs font-extrabold text-[#FF2A5F]">
              <Star className="w-3.5 h-3.5 fill-[#FF2A5F]" />
              <span>MAL {score}</span>
            </div>
          )}
          {anime.rank && (
            <span className="text-xs font-bold text-slate-200 border-l border-white/15 pl-2.5">
              Rank #{anime.rank}
            </span>
          )}
          {anime.type && (
            <span className="text-xs font-semibold text-purple-300 border-l border-white/15 pl-2.5">
              {anime.type}
            </span>
          )}
        </div>

        {/* Hero Actions Bottom Bar */}
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {trailerEmbed && (
              <button
                onClick={() => setIsTrailerOpen(true)}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-[#FF2A5F] hover:bg-[#E01E4F] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-[#FF2A5F]/40 transition-all hover:scale-102"
              >
                <Play className="w-4 h-4 fill-white" /> Official Trailer
              </button>
            )}

            {/* Watchlist Selector Dropdown */}
            {user && (
              <div className="relative inline-block">
                <select
                  value={watchlistStatus || ''}
                  disabled={isUpdatingWatchlist}
                  onChange={(e) => handleWatchlistChange(e.target.value)}
                  className="px-4 py-2.5 sm:py-3 rounded-2xl glass-panel bg-slate-900/90 text-white font-bold text-xs sm:text-sm border border-white/20 focus:outline-none focus:border-[#FF2A5F] cursor-pointer appearance-none pr-8"
                >
                  <option value="" disabled>
                    + Add to Watchlist
                  </option>
                  <option value="WATCHING">Watching</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PLAN_TO_WATCH">Plan to Watch</option>
                  <option value="DROPPED">Dropped</option>
                  {watchlistStatus && <option value="REMOVE">Remove from Watchlist</option>}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3.5 pointer-events-none" />
              </div>
            )}

            {/* Favorite Heart Toggle */}
            <button
              onClick={() => toggleFavorite(anime)}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                bookmarked
                  ? 'bg-[#FF2A5F] text-white shadow-lg shadow-[#FF2A5F]/30'
                  : 'glass-panel text-white hover:bg-white/10 border border-white/20'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-white' : ''}`} />
              {bookmarked ? 'Bookmarked' : 'Add to Favorites'}
            </button>
          </div>

          <button
            onClick={handleDownloadBanner}
            className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl glass-panel text-slate-200 hover:text-white border border-white/20 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-[#8A2BE2]" /> Save HD Artwork
          </button>
        </div>
      </div>

      {watchlistMsg && (
        <div className="p-3 rounded-2xl bg-[#FF2A5F]/10 border border-[#FF2A5F]/30 text-[#FF2A5F] text-xs font-bold text-center">
          {watchlistMsg}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-w-0">
        {/* Left Column: Poster & Specifications */}
        <div className="space-y-6 min-w-0">
          <div className="relative aspect-[3/4] w-full max-w-xs sm:max-w-sm mx-auto rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-2xl">
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 280px, 380px"
              className="object-cover"
              loading="lazy"
              unoptimized
            />
            {anime.airing && (
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="success" size="lg">
                  Airing
                </Badge>
              </div>
            )}
          </div>

          {/* Specifications Card */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4 min-w-0">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
              Anime Specifications
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Star className="w-3.5 h-3.5 text-[#FF2A5F]" /> MAL Score
                </span>
                <span className="font-bold text-[#FF2A5F] truncate">
                  {score} ({anime.scored_by?.toLocaleString() || '0'})
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Tv className="w-3.5 h-3.5 text-[#8A2BE2]" /> Format
                </span>
                <span className="font-bold text-white truncate">{anime.type || 'TV'}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Episodes
                </span>
                <span className="font-bold text-white truncate">
                  {anime.episodes || 'Ongoing'} ({anime.duration || '24m'})
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Source
                </span>
                <span className="font-bold text-white truncate">{anime.source || 'Original'}</span>
              </div>
            </div>

            {/* Animation Studios */}
            {anime.studios && anime.studios.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold block">Animation Studios:</span>
                <div className="flex flex-wrap gap-1.5">
                  {anime.studios.map((st, idx) => (
                    <Link
                      key={`studio-${st.mal_id || 'st'}-${idx}`}
                      href={`/search?q=${encodeURIComponent(st.name)}`}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-[11px] font-bold text-white hover:border-[#FF2A5F] transition-colors"
                    >
                      {st.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Title, Synopsis, Voice Actors, Recommendations, Community Reviews */}
        <div className="lg:col-span-2 space-y-8 min-w-0">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5 min-w-0">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{title}</h1>
              {japaneseTitle && (
                <p className="text-xs text-slate-400 font-medium mt-1">{japaneseTitle}</p>
              )}
            </div>

            {/* Synopsis with Expand Toggle */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#FF2A5F] uppercase tracking-wider">Synopsis</h3>
              <p
                className={`text-xs sm:text-sm text-slate-300 leading-relaxed break-words font-normal ${
                  !isSynopsisExpanded ? 'line-clamp-4' : ''
                }`}
              >
                {anime.synopsis || 'No official synopsis available for this title.'}
              </p>

              {anime.synopsis && anime.synopsis.length > 280 && (
                <button
                  onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                  className="text-xs font-bold text-[#FF2A5F] hover:underline flex items-center gap-1 pt-1"
                >
                  {isSynopsisExpanded ? (
                    <>
                      Show Less <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Read Full Synopsis <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Genre Pills */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Genres
                </span>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((g, idx) => (
                    <Link key={`genre-${g.mal_id || 'gn'}-${idx}`} href={`/search?genre=${encodeURIComponent(g.name)}`}>
                      <Badge variant="secondary" size="md">
                        {g.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Voice Actors & Cast */}
          <AnimeCharacters animeId={numericAnimeId} />

          {/* HD Artwork Gallery */}
          <HDArtworkGallery animeId={numericAnimeId} title={title} />

          {/* Community Reviews Section */}
          <AnimeReviews animeId={numericAnimeId} />

          {/* Recommendations */}
          <AnimeRecommendations animeId={numericAnimeId} />
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={trailerEmbed || null}
        title={title}
      />
    </div>
  );
}
