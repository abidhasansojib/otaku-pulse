'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-[#react-query]' || '@tanstack/react-query';
import { getAnimeById, getAnimeDubMatrix } from '../../../lib/api/jikanClient';
import { DubMatrix } from '../../../components/anime/DubMatrix';
import { RelationsTimeline } from '../../../components/anime/RelationsTimeline';
import { TrailerModal } from '../../../components/anime/TrailerModal';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useFavorites } from '../../../lib/hooks/useFavorites';
import { Star, Play, Bookmark, Download, ChevronDown, ChevronUp, ExternalLink, Calendar, Tv, Building, BookOpen, Volume2, ArrowLeft } from 'lucide-react';

export default function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const animeId = resolvedParams.id;

  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  // Fetch Full Anime Data
  const { data: anime, isLoading } = useQuery({
    queryKey: ['animeDetail', animeId],
    queryFn: () => getAnimeById(animeId),
    enabled: !!animeId,
  });

  // Fetch Dub Matrix Data
  const { data: dubMatrix } = useQuery({
    queryKey: ['dubMatrix', animeId],
    queryFn: () => (anime ? getAnimeDubMatrix(anime) : Promise.resolve([])),
    enabled: !!anime,
  });

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Anime Not Found</h2>
        <p className="text-slate-400 text-sm">The requested anime could not be fetched or does not exist.</p>
        <Link href="/" className="px-6 py-2.5 rounded-xl bg-[#FF2A5F] text-white font-bold text-xs">
          Return to Home
        </Link>
      </div>
    );
  }

  const bookmarked = isFavorite(anime.mal_id);
  const title = anime.title_english || anime.title;
  const japaneseTitle = anime.title_japanese;
  const posterUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '/banner-placeholder.webp';
  const backdropUrl = anime.banner_url || posterUrl;
  const score = anime.score ? anime.score.toFixed(1) : 'N/A';
  const trailerEmbed = anime.trailer?.embed_url;

  // Handle HD Banner Download
  const handleDownloadBanner = async () => {
    try {
      const response = await fetch(backdropUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_artwork.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      window.open(backdropUrl, '_blank');
    }
  };

  return (
    <div className="space-y-10">
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
      <div className="relative w-full h-[320px] md:h-[420px] rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-2xl">
        <Image
          src={backdropUrl}
          alt={title}
          fill
          priority
          className="object-cover brightness-60"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/50 to-transparent" />

        {/* Hero Actions Bottom Bar */}
        <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {trailerEmbed && (
              <button
                onClick={() => setIsTrailerOpen(true)}
                className="px-6 py-3 rounded-2xl bg-[#FF2A5F] hover:bg-[#E01E4F] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-[#FF2A5F]/40 transition-all hover:scale-102"
              >
                <Play className="w-4 h-4 fill-white" /> Play Official Trailer
              </button>
            )}

            <button
              onClick={() => toggleFavorite(anime)}
              className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
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
            className="px-4 py-3 rounded-2xl glass-panel text-slate-200 hover:text-white border border-white/20 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-[#8A2BE2]" /> Save HD Artwork
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Poster & Quick Metadata */}
        <div className="space-y-6">
          <div className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-2xl">
            <Image
              src={posterUrl}
              alt={title}
              fill
              className="object-cover"
              unoptimized
            />
            {anime.airing && (
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="success" size="lg">Airing</Badge>
              </div>
            )}
          </div>

          {/* Metadata Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
              Anime Specifications
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-[#FF2A5F]" /> MAL Score</span>
                <span className="font-bold text-[#FF2A5F]">{score} ({anime.scored_by?.toLocaleString() || '0'} votes)</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><Tv className="w-3.5 h-3.5 text-[#8A2BE2]" /> Format</span>
                <span className="font-bold text-white">{anime.type || 'TV'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-emerald-400" /> Episodes</span>
                <span className="font-bold text-white">{anime.episodes || 'Ongoing'} ({anime.duration || '24m'})</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-amber-400" /> Studio</span>
                <span className="font-bold text-white">{anime.studios?.[0]?.name || 'Unknown'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-sky-400" /> Source</span>
                <span className="font-bold text-white">{anime.source || 'Manga'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-[#C77DFF]" /> Audio Dub</span>
                <span className="font-bold text-[#C77DFF]">Japanese / English</span>
              </div>
            </div>

            {/* External Links */}
            {anime.external && anime.external.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <span className="text-[11px] text-slate-400 font-semibold block mb-2">Streaming & Database</span>
                <div className="flex flex-wrap gap-1.5">
                  {anime.external.slice(0, 4).map((ext, idx) => (
                    <a
                      key={idx}
                      href={ext.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/10 text-[10px] text-slate-300 hover:text-white hover:border-[#FF2A5F] flex items-center gap-1 transition-colors"
                    >
                      {ext.name} <ExternalLink className="w-3 h-3 text-[#FF2A5F]" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Title, Synopsis, Dub Matrix & Relations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {anime.genres?.map((g) => (
                <Badge key={g.mal_id} variant="secondary" size="md">{g.name}</Badge>
              ))}
              {anime.rating && <Badge variant="outline" size="md">{anime.rating}</Badge>}
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {title}
            </h1>

            {japaneseTitle && (
              <p className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <span>Japanese: {japaneseTitle}</span>
              </p>
            )}
          </div>

          {/* Plot & Synopsis */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
            <h3 className="text-lg font-bold text-white">Plot Overview & Synopsis</h3>
            <p className={`text-sm text-slate-300 leading-relaxed ${!isSynopsisExpanded ? 'line-clamp-4' : ''}`}>
              {anime.synopsis || 'No detailed synopsis available for this title.'}
            </p>
            {anime.synopsis && anime.synopsis.length > 280 && (
              <button
                onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                className="text-xs font-bold text-[#FF2A5F] hover:underline flex items-center gap-1 pt-1"
              >
                {isSynopsisExpanded ? (
                  <>Show Less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Read Full Synopsis <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>

          {/* Dub Matrix Section */}
          <DubMatrix matrix={dubMatrix || []} />

          {/* Franchise Timeline Tree */}
          <RelationsTimeline relations={anime.relations} />
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
