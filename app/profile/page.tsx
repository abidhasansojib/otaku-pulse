'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  User as UserIcon,
  Camera,
  ListVideo,
  Bookmark,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../lib/context/AuthContext';
import { createClient } from '../../lib/supabase/client';
import { AuthModal } from '../../components/auth/AuthModal';

export interface WatchlistItem {
  id: string;
  user_id: string;
  anime_id: number;
  title: string;
  poster_url: string;
  status: 'WATCHING' | 'COMPLETED' | 'PLAN_TO_WATCH' | 'DROPPED';
  episodes_watched: number;
  created_at: string;
}

export interface FavoriteItem {
  id: string;
  user_id: string;
  anime_id: number;
  title: string;
  poster_url: string;
  created_at: string;
}

export interface ReviewItem {
  id: string;
  user_id: string;
  anime_id: number;
  rating: number;
  review_text: string;
  created_at: string;
}

function ProfileContent() {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'watchlist' | 'favorites' | 'reviews'>('watchlist');
  const [watchlistFilter, setWatchlistFilter] = useState<'ALL' | 'WATCHING' | 'COMPLETED' | 'PLAN_TO_WATCH' | 'DROPPED'>('ALL');

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editReviewRating, setEditReviewRating] = useState(10);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'watchlist' || tab === 'favorites' || tab === 'reviews') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // 1. Fetch Watchlist
      const { data: wlData } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setWatchlist(wlData || []);

      // 2. Fetch Favorites
      const { data: favData } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setFavorites(favData || []);

      // 3. Fetch User Reviews
      const { data: revData } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setReviews(revData || []);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    setUploadingAvatar(true);
    setSaveMessage(null);

    try {
      // Upload to Supabase Storage public 'avatars' bucket
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true,
      });

      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Update public.profiles table
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      setSaveMessage('Avatar updated successfully!');
    } catch (err: any) {
      setSaveMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username, bio })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setIsEditingProfile(false);
      setSaveMessage('Profile saved!');
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message}`);
    }
  };

  const handleIncrementEpisode = async (item: WatchlistItem) => {
    const newEpCount = item.episodes_watched + 1;
    setWatchlist((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, episodes_watched: newEpCount } : w))
    );

    await supabase
      .from('watchlist')
      .update({ episodes_watched: newEpCount })
      .eq('id', item.id);
  };

  const handleRemoveFromWatchlist = async (id: string) => {
    setWatchlist((prev) => prev.filter((w) => w.id !== id));
    await supabase.from('watchlist').delete().eq('id', id);
  };

  const handleRemoveFromFavorites = async (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    await supabase.from('favorites').delete().eq('id', id);
  };

  const handleDeleteReview = async (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    await supabase.from('reviews').delete().eq('id', id);
  };

  const handleUpdateReview = async (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, review_text: editReviewText, rating: editReviewRating } : r))
    );
    await supabase
      .from('reviews')
      .update({ review_text: editReviewText, rating: editReviewRating })
      .eq('id', id);
    setEditingReviewId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-sm">
        Loading User Profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#FF2A5F]/20 border border-[#FF2A5F]/40 flex items-center justify-center text-[#FF2A5F]">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Please sign in to access your personal dashboard, watchlist, and user settings.
        </p>
        <Link
          href="/auth/login"
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white text-xs font-bold shadow-lg shadow-[#FF2A5F]/20"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  const filteredWatchlist =
    watchlistFilter === 'ALL' ? watchlist : watchlist.filter((w) => w.status === watchlistFilter);

  const avatarUrl = profile?.avatar_url || '/banner-placeholder.webp';

  return (
    <div className="space-y-8">
      {/* Header Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 z-10 relative">
          {/* Avatar with Upload Hover Button */}
          <div className="relative group shrink-0">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-[#FF2A5F]/50 shadow-xl bg-slate-900">
              <Image src={avatarUrl} alt={profile?.username || 'User'} fill className="object-cover" unoptimized />
            </div>

            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold gap-1"
            >
              <Camera className="w-5 h-5 text-[#FF2A5F]" />
              <span>{uploadingAvatar ? 'Uploading...' : 'Change Avatar'}</span>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
          </div>

          {/* User Info & Edit Form */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            {!isEditingProfile ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                      <span>{profile?.username || user.email?.split('@')[0]}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF2A5F]/20 text-[#FF2A5F] border border-[#FF2A5F]/30 font-bold">
                        OTAKU
                      </span>
                    </h1>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 text-xs font-semibold self-center sm:self-start flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                </div>

                <p className="text-xs text-slate-300 max-w-xl leading-relaxed font-normal pt-1">
                  {profile?.bio || 'Anime fan tracking watchlists and ratings on OtakuPulse.'}
                </p>

                {saveMessage && (
                  <p className="text-xs text-emerald-400 font-semibold pt-1">{saveMessage}</p>
                )}
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3 max-w-md pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Bio</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#FF2A5F] text-white font-bold text-xs"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 rounded-xl glass-panel text-slate-400 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-5 py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'watchlist'
              ? 'border-[#FF2A5F] text-[#FF2A5F]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ListVideo className="w-4 h-4" /> Watchlist ({watchlist.length})
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-5 py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'favorites'
              ? 'border-[#FF2A5F] text-[#FF2A5F]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" /> Favorites ({favorites.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'reviews'
              ? 'border-[#FF2A5F] text-[#FF2A5F]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> My Reviews ({reviews.length})
        </button>
      </div>

      {/* TAB 1: WATCHLIST */}
      {activeTab === 'watchlist' && (
        <div className="space-y-6">
          {/* Sub-Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'WATCHING', 'COMPLETED', 'PLAN_TO_WATCH', 'DROPPED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setWatchlistFilter(st)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  watchlistFilter === st
                    ? 'bg-[#FF2A5F] text-white border-[#FF2A5F]'
                    : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-white/30'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {filteredWatchlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWatchlist.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel p-4 rounded-2xl border border-white/10 flex gap-4 items-center group hover:border-[#FF2A5F]/40 transition-all"
                >
                  <div className="relative w-20 aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    <Image
                      src={item.poster_url || '/banner-placeholder.webp'}
                      alt={item.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Link
                      href={`/anime/${item.anime_id}`}
                      className="text-xs font-bold text-white hover:text-[#FF2A5F] truncate block"
                    >
                      {item.title}
                    </Link>

                    <div className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-[#FF2A5F]">
                      {item.status.replace(/_/g, ' ')}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        Eps: <strong className="text-white">{item.episodes_watched}</strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleIncrementEpisode(item)}
                          className="px-2 py-1 rounded-lg bg-[#FF2A5F] text-white font-extrabold text-[10px] hover:scale-105 transition-transform"
                          title="Increment episode"
                        >
                          +1 Ep
                        </button>
                        <button
                          onClick={() => handleRemoveFromWatchlist(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center text-slate-400 space-y-3">
              <ListVideo className="w-8 h-8 text-[#FF2A5F] mx-auto" />
              <p className="text-xs">No items in your watchlist for this status.</p>
              <Link href="/search" className="inline-block px-4 py-2 rounded-xl bg-[#FF2A5F] text-white font-bold text-xs">
                Browse Directory
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FAVORITES GRID */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="group relative glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col"
                >
                  <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden">
                    <Image
                      src={item.poster_url || '/banner-placeholder.webp'}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <button
                      onClick={() => handleRemoveFromFavorites(item.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-red-400 hover:scale-110 transition-transform"
                      title="Remove Favorite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <Link
                      href={`/anime/${item.anime_id}`}
                      className="text-xs font-bold text-white truncate block group-hover:text-[#FF2A5F] transition-colors"
                    >
                      {item.title}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center text-slate-400 space-y-3">
              <Bookmark className="w-8 h-8 text-[#FF2A5F] mx-auto" />
              <p className="text-xs">No favorites added yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[#FF2A5F] text-white px-2.5 py-0.5 rounded-lg font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-white" />
                      <span>{rev.rating}/10</span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">
                      Anime ID #{rev.anime_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingReviewId(rev.id);
                        setEditReviewText(rev.review_text);
                        setEditReviewRating(rev.rating);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {editingReviewId === rev.id ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-300">Rating:</label>
                      <select
                        value={editReviewRating}
                        onChange={(e) => setEditReviewRating(parseInt(e.target.value, 10))}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                      >
                        {Array.from({ length: 10 }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} Stars
                          </option>
                        ))}
                      </select>
                    </div>

                    <textarea
                      rows={3}
                      value={editReviewText}
                      onChange={(e) => setEditReviewText(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateReview(rev.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#FF2A5F] text-white font-bold text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingReviewId(null)}
                        className="px-3 py-1.5 rounded-xl glass-panel text-slate-400 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed">{rev.review_text}</p>
                )}
              </div>
            ))
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center text-slate-400 space-y-3">
              <MessageSquare className="w-8 h-8 text-[#FF2A5F] mx-auto" />
              <p className="text-xs">You haven&apos;t written any reviews yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400 py-10">Loading Profile Dashboard...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
