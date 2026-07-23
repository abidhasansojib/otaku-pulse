'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Star, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { rateLimitedFetch } from '../../lib/api/rateLimiter';
import { useAuth } from '../../lib/context/AuthContext';
import { createClient } from '../../lib/supabase/client';

interface ReviewItem {
  id: string;
  score: number;
  review: string;
  user: {
    username: string;
    avatar_url?: string;
  };
  created_at?: string;
  isSupabase?: boolean;
}

async function fetchJikanReviews(animeId: number): Promise<ReviewItem[]> {
  try {
    const url = `https://api.jikan.moe/v4/anime/${animeId}/reviews`;
    const res = await rateLimitedFetch<any>(url);
    if (res?.data && Array.isArray(res.data)) {
      return res.data.slice(0, 4).map((r: any) => ({
        id: `jikan-${r.mal_id}`,
        score: r.score,
        review: r.review,
        user: {
          username: r.user?.username || 'MAL User',
          avatar_url: r.user?.images?.jpg?.image_url,
        },
      }));
    }
  } catch (e) {
    // Silent catch
  }
  return [];
}

export function AnimeReviews({
  animeId,
  animeTitle,
  posterUrl,
}: {
  animeId: number;
  animeTitle?: string;
  posterUrl?: string;
}) {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [supabaseReviews, setSupabaseReviews] = useState<ReviewItem[]>([]);
  const [rating, setRating] = useState<number>(10);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Fetch Jikan reviews fallback
  const { data: jikanReviews } = useQuery({
    queryKey: ['animeReviewsJikan', animeId],
    queryFn: () => fetchJikanReviews(animeId),
    enabled: !!animeId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Fetch Supabase community reviews for this anime
  useEffect(() => {
    fetchSupabaseReviews();
  }, [animeId]);

  const fetchSupabaseReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, review_text, created_at, user_id, profiles(username, avatar_url)')
        .eq('anime_id', animeId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted: ReviewItem[] = data.map((item: any) => ({
          id: item.id,
          score: item.rating,
          review: item.review_text,
          created_at: item.created_at,
          isSupabase: true,
          user: {
            username: item.profiles?.username || 'Otaku User',
            avatar_url: item.profiles?.avatar_url || '/banner-placeholder.webp',
          },
        }));
        setSupabaseReviews(formatted);
      }
    } catch (err) {
      console.error('Error fetching Supabase reviews:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!reviewText.trim()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        anime_id: animeId,
        anime_title: animeTitle || 'Anime',
        poster_url: posterUrl || '/banner-placeholder.webp',
        rating,
        review_text: reviewText.trim(),
      });

      if (error) throw error;

      setReviewText('');
      setSubmitMessage('Review submitted successfully!');
      await fetchSupabaseReviews();
    } catch (err: any) {
      setSubmitMessage(`Failed to submit review: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allReviews = [...supabaseReviews, ...(jikanReviews || [])];

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 space-y-6 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8A2BE2] to-[#FF2A5F] text-white flex items-center justify-center shadow-lg shadow-[#8A2BE2]/20 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              Community Ratings & Reviews
            </h3>
            <p className="text-xs text-slate-400">Share your review with OtakuPulse fans</p>
          </div>
        </div>
      </div>

      {/* Review Submission Box */}
      {user ? (
        <form onSubmit={handleSubmitReview} className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Your Rating:</span>
              <select
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value, 10))}
                className="px-3 py-1 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF2A5F]"
              >
                {Array.from({ length: 10 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} ★ ({i + 1 === 10 ? 'Masterpiece' : i + 1 >= 8 ? 'Great' : 'Average'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            rows={3}
            required
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your honest review of this anime..."
            className="w-full p-3 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF2A5F]"
          />

          <div className="flex items-center justify-between">
            {submitMessage ? (
              <span className="text-xs text-emerald-400 font-semibold">{submitMessage}</span>
            ) : (
              <span className="text-[11px] text-slate-400">Reviews are publicly visible</span>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#FF2A5F] hover:bg-[#E01E4F] text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Post Review'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center text-xs text-slate-400">
          Sign in to post your own community review and rating for this title.
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {allReviews.map((rev) => {
          const isExpanded = expandedId === rev.id;
          const userAvatar = rev.user?.avatar_url || '/logo.png';

          return (
            <div
              key={rev.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3 hover:border-white/10 transition-colors min-w-0"
            >
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                    <Image src={userAvatar} alt={rev.user.username} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">{rev.user.username}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {rev.isSupabase ? 'Verified OtakuPulse Reviewer' : 'MAL Community Reviewer'}
                    </span>
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
                  onClick={() => setExpandedId(isExpanded ? null : rev.id)}
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
