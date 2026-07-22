'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Star, ArrowRight } from 'lucide-react';
import { searchAnime } from '../../lib/api/jikanClient';
import { AnimeItem } from '../../lib/types/anime';

interface SearchBarProps {
  initialValue?: string;
  onSearchSubmit?: (query: string) => void;
}

export function SearchBar({ initialValue = '', onSearchSubmit }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced predictive search effect
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    const handler = setTimeout(async () => {
      try {
        const res = await searchAnime({ q: query }, 1, 5);
        setResults(res.data || []);
      } catch (err) {
        console.error('Predictive search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(query);
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder="Search 10,000+ anime titles, genres, studios..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl glass-panel text-white placeholder-slate-400 focus:outline-none focus:border-[#FF2A5F]/60 border border-white/10 text-sm shadow-xl transition-all"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="absolute right-4 p-1 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Instant Predictive Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-modal rounded-2xl border border-white/15 shadow-2xl z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-6 flex items-center justify-center text-slate-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF2A5F]" />
              Fetching suggestions...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-white/5">
              <div className="px-4 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-900/80">
                Top Suggestions
              </div>

              {results.map((anime) => {
                const title = anime.title_english || anime.title;
                const poster = anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url;

                return (
                  <Link
                    key={anime.mal_id}
                    href={`/anime/${anime.mal_id}`}
                    onClick={() => setIsOpen(false)}
                    className="p-3 flex items-center gap-3 hover:bg-white/5 transition-colors group"
                  >
                    <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-900">
                      <Image
                        src={poster || '/banner-placeholder.webp'}
                        alt={title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-[#FF2A5F] transition-colors truncate">
                        {title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span>{anime.type || 'TV'}</span>
                        <span>•</span>
                        <span>{anime.year || anime.status || 'Anime'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-[#FF2A5F] bg-[#FF2A5F]/10 px-2 py-0.5 rounded-md">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{anime.score ? anime.score.toFixed(1) : 'N/A'}</span>
                    </div>
                  </Link>
                );
              })}

              <button
                onClick={handleSubmit}
                className="w-full py-2.5 px-4 text-center text-xs font-bold text-[#FF2A5F] hover:bg-[#FF2A5F]/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>See all results for &quot;{query}&quot;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching anime titles found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
