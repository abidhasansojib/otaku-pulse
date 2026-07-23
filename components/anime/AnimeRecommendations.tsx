'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ArrowRight, ThumbsUp } from 'lucide-react';
import { rateLimitedFetch } from '../../lib/api/rateLimiter';

interface RecommendationItem {
  entry: {
    mal_id: number;
    title: string;
    images?: { webp?: { large_image_url?: string }; jpg?: { large_image_url?: string } };
  };
  votes: number;
}

async function fetchAniListRecommendations(animeId: number): Promise<RecommendationItem[]> {
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        recommendations(perPage: 8, sort: RATING_DESC) {
          nodes {
            rating
            mediaRecommendation {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large medium }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { idMal: animeId } })
    });
    if (!res.ok) return [];
    const json = await res.json();
    const nodes = json?.data?.Media?.recommendations?.nodes || [];

    return nodes
      .map((node: any) => {
        const rec = node.mediaRecommendation;
        if (!rec) return null;
        return {
          entry: {
            mal_id: rec.idMal || rec.id,
            title: rec.title?.english || rec.title?.romaji || 'Anime',
            images: {
              webp: { large_image_url: rec.coverImage?.extraLarge || rec.coverImage?.large },
              jpg: { large_image_url: rec.coverImage?.extraLarge || rec.coverImage?.large },
            },
          },
          votes: Math.max(1, node.rating || 10),
        };
      })
      .filter(Boolean);
  } catch (err) {
    return [];
  }
}

async function fetchAnimeRecommendations(animeId: number): Promise<RecommendationItem[]> {
  try {
    const url = `https://api.jikan.moe/v4/anime/${animeId}/recommendations`;
    const res = await rateLimitedFetch<any>(url);
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.slice(0, 8);
    }
  } catch (e) {
    // Fall back to AniList below
  }

  return fetchAniListRecommendations(animeId);
}

export function AnimeRecommendations({ animeId }: { animeId: number }) {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['animeRecommendations', animeId],
    queryFn: () => fetchAnimeRecommendations(animeId),
    enabled: !!animeId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading || !recommendations || recommendations.length === 0) return null;

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] text-white flex items-center justify-center shadow-lg shadow-[#FF2A5F]/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              Recommended If You Liked This
            </h3>
            <p className="text-xs text-slate-400">Jikan API community recommendation consensus</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {recommendations.map((item) => {
          const poster =
            item.entry.images?.webp?.large_image_url ||
            item.entry.images?.jpg?.large_image_url ||
            '/banner-placeholder.webp';

          return (
            <Link
              key={item.entry.mal_id}
              href={`/anime/${item.entry.mal_id}`}
              className="group relative glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF2A5F]/40 transition-all flex flex-col space-y-2 min-w-0"
            >
              <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden">
                <Image
                  src={poster}
                  alt={item.entry.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-[10px] font-extrabold text-[#FF2A5F] border border-white/10 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> {item.votes}
                </div>
              </div>
              <div className="p-3 min-w-0">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF2A5F] transition-colors">
                  {item.entry.title}
                </h4>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
