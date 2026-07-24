'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Play, Bookmark, Volume2 } from 'lucide-react';
import { AnimeItem } from '../../lib/types/anime';
import { Badge } from '../ui/Badge';
import { useFavorites } from '../../lib/hooks/useFavorites';

interface AnimeCardProps {
  anime: AnimeItem;
  rank?: number;
  onPlayTrailer?: (trailerUrl: string, title: string) => void;
}

export function AnimeCard({ anime, rank, onPlayTrailer }: AnimeCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const bookmarked = isFavorite(anime.mal_id);

  const posterUrl = anime.images?.webp?.large_image_url || 
                    anime.images?.jpg?.large_image_url || 
                    anime.images?.jpg?.image_url || 
                    '/banner-placeholder.webp';

  const title = anime.title_english || anime.title;
  const score = anime.score ? anime.score.toFixed(1) : 'N/A';
  const isAiring = anime.airing || anime.status === 'Currently Airing';
  const currentAiredCount = anime.current_aired_episodes;
  const episodes = isAiring
    ? (currentAiredCount ? `${currentAiredCount} / ? eps aired` : 'Airing')
    : (anime.episodes ? `${anime.episodes} eps` : 'Completed');
  const trailerEmbed = anime.trailer?.embed_url;

  return (
    <div className="group relative glass-card rounded-2xl overflow-hidden flex flex-col h-full border border-white/10 hover:border-[#FF2A5F]/40 transition-all duration-300">
      {/* Rank Badge if specified */}
      {rank !== undefined && (
        <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-xl bg-[#8A2BE2] text-white font-extrabold text-xs shadow-lg shadow-[#8A2BE2]/40 backdrop-blur-md">
          #{rank}
        </div>
      )}

      {/* Poster Image & Overlay Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
        <Image
          src={posterUrl}
          alt={title}
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          unoptimized
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

        {/* Airing Status Pill */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {anime.airing ? (
            <Badge variant="success" size="sm">Airing</Badge>
          ) : (
            <Badge variant="outline" size="sm">{anime.type || 'TV'}</Badge>
          )}
        </div>

        {/* Quick Action Overlay on Hover */}
        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 bg-black/50 backdrop-blur-xs p-4">
          {trailerEmbed && onPlayTrailer && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onPlayTrailer(trailerEmbed, title);
              }}
              className="w-12 h-12 rounded-full bg-[#FF2A5F] text-white flex items-center justify-center shadow-lg shadow-[#FF2A5F]/50 hover:scale-110 transition-transform"
              title="Play Trailer"
            >
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(anime);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
              bookmarked
                ? 'bg-[#FF2A5F] text-white shadow-[#FF2A5F]/50'
                : 'bg-slate-800/80 text-slate-200 border border-white/20 hover:text-[#FF2A5F]'
            }`}
            title={bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
          >
            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Score & Dub info overlay at bottom of poster */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#FF2A5F] text-white px-2 py-0.5 rounded-lg font-bold text-xs shadow-md">
            <Star className="w-3.5 h-3.5 fill-white" />
            <span>{score}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-slate-300 border border-white/10 font-semibold">
            <Volume2 className="w-3 h-3 text-[#8A2BE2]" />
            <span>SUB/DUB</span>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <Link href={`/anime/${anime.mal_id}`} className="block">
            <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#FF2A5F] transition-colors" title={title}>
              {title}
            </h3>
          </Link>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-medium">
            <span>{episodes}</span>
            <span>{anime.year || anime.season || 'Anime'}</span>
          </div>
        </div>

        {/* Genres Pill List */}
        {anime.genres && anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {anime.genres.slice(0, 2).map((genre, gIdx) => (
              <span
                key={`card-genre-${genre.mal_id}-${gIdx}`}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-white/5"
              >
                {genre.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
