'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Star, User, ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react';
import { rateLimitedFetch } from '../../lib/api/rateLimiter';

interface ReviewItem {
  mal_id: number;
  score: number;
  review: string;
  tags: string[];
  user: {
    username: string;
    images?: { jpg?: { image_url?: string } };
  };
}

async function fetchAnimeReviews(animeId: number): Promise<ReviewItem[]> {
  try {
    const url = `https://api.jikan.moe/v4/anime/${animeId}/reviews`;
    const res = await rateLimitedFetch<any>(url);
    if (res?.data && Array.isArray(res.data)) {
      return res.data.slice(0, 4);
    }
  } catch (e) {
    // Silent catch
  }
  return [];
}

export function AnimeReviews({ animeId }: { animeId: number }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['animeReviews', animeId],
    queryFn: () => fetchAnimeReviews(animeId),
    enabled: !!animeId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading || !reviews || reviews.length === 0) return null;

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8A2BE2] to-[#FF2A5F] text-white flex items-center justify-center shadow-lg shadow-[#8A2BE2]/20 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              User Reviews & Community Ratings
            </h3>
            <p className="text-xs text-slate-400">Verified MyAnimeList community member reviews ({reviews.length})</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((rev) => {
          const isExpanded = expandedId === rev.mal_id;
          const userAvatar = rev.user?.images?.jpg?.image_url || '/logo.png';

          return (
            <div
              key={rev.mal_id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3 hover:border-white/10 transition-colors min-w-0"
            >
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                    <Image src={userAvatar} alt={rev.user.username} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">{rev.user.username}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{rev.tags?.[0] || 'Community Reviewer'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-[#FF2A5F]/20 text-[#FF2A5F] px-2.5 py-1 rounded-xl text-xs font-black border border-[#FF2A5F]/30 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-current" /> {rev.score} / 10
                </div>
              </div>

              <p className={`text-xs text-slate-300 leading-relaxed break-words ${!isExpanded ? 'line-clamp-3' : ''}`}>
                {rev.review}
              </p>

              {rev.review && rev.review.length > 200 && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : rev.mal_id)}
                  className="text-xs font-bold text-[#FF2A5F] hover:underline flex items-center gap-1 pt-1"
                >
                  {isExpanded ? (
                    <>Show Less <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Read Full Review <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
