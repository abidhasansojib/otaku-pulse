'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFavorites } from '../../lib/hooks/useFavorites';
import { AnimeCard } from '../../components/anime/AnimeCard';
import { TrailerModal } from '../../components/anime/TrailerModal';
import { Bookmark, Sparkles, Compass } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, isLoaded } = useFavorites();
  const [activeTrailer, setActiveTrailer] = useState<{ url: string; title: string } | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-sm">
        Loading saved library...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF2A5F]/20 text-[#FF2A5F] flex items-center justify-center border border-[#FF2A5F]/40 shadow-lg shadow-[#FF2A5F]/20">
            <Bookmark className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              My Favorites Library
            </h1>
            <p className="text-xs text-slate-400">
              {favorites.length} {favorites.length === 1 ? 'anime' : 'animes'} saved to local storage
            </p>
          </div>
        </div>

        {favorites.length > 0 && (
          <Link
            href="/search"
            className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Compass className="w-4 h-4 text-[#8A2BE2]" /> Discover More Anime
          </Link>
        )}
      </div>

      {/* Favorites Grid or Empty State */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {favorites.map((anime) => (
            <AnimeCard
              key={anime.mal_id}
              anime={anime}
              onPlayTrailer={(url, title) => setActiveTrailer({ url, title })}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-3xl border border-white/10 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto border border-white/10">
            <Sparkles className="w-8 h-8 text-[#FF2A5F]" />
          </div>
          <h3 className="text-lg font-bold text-white">Your Library is Empty</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            You haven&apos;t bookmarked any anime yet. Explore rankings or search your favorite titles to add them to your collection!
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF2A5F] hover:bg-[#E01E4F] text-white font-bold text-xs shadow-xl shadow-[#FF2A5F]/30 transition-all"
          >
            <Compass className="w-4 h-4" /> Explore Anime Directory
          </Link>
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
