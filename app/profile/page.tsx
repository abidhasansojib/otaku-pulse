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

import { formatDetailedWatchTimeFromMinutes } from '../../lib/utils/duration';
import { getAnimeById } from '../../lib/api/jikanClient';

// Client-side Image Compressor (Compresses raw images to ~15-25KB WebP blobs)
function compressImage(file: File, maxWidth = 250, maxHeight = 250, quality = 0.75): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  anime_id: number;
  title: string;
  poster_url: string;
  status: 'WATCHING' | 'COMPLETED' | 'PLAN_TO_WATCH' | 'DROPPED';
  episodes_watched: number;
  total_episodes?: number;
  duration_minutes?: number;
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
  anime_title?: string;
  poster_url?: string;
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
  const [reviewAnimeMap, setReviewAnimeMap] = useState<Record<number, { title: string; poster_url: string }>>({});

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editReviewRating, setEditReviewRating] = useState(10);

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationText.trim() !== 'deletemyaccount') {
      setDeleteError('Confirmation phrase does not match. Please type deletemyaccount');
      return;
    }

    if (!user) return;
    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      // 1. Delete user data from database tables
      await supabase.from('watchlist').delete().eq('user_id', user.id);
      await supabase.from('favorites').delete().eq('user_id', user.id);
      await supabase.from('reviews').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // 2. Sign out user
      await supabase.auth.signOut();

      // 3. Close modal & redirect to homepage
      setIsDeleteModalOpen(false);
      window.location.href = '/';
    } catch (err: any) {
      setDeleteError(`Failed to delete account: ${err.message}`);
      setIsDeletingAccount(false);
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    const edit = searchParams.get('edit');
    if (tab === 'watchlist' || tab === 'favorites' || tab === 'reviews') {
      setActiveTab(tab);
    }
    if (edit === 'true') {
      setIsEditingProfile(true);
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

  // Fetch anime details for reviews missing metadata via API
  useEffect(() => {
    if (reviews && reviews.length > 0) {
      reviews.forEach(async (rev) => {
        if (!rev.anime_title && !reviewAnimeMap[rev.anime_id]) {
          const matchedWatch = watchlist.find((w) => w.anime_id === rev.anime_id);
          const matchedFav = favorites.find((f) => f.anime_id === rev.anime_id);

          if (matchedWatch) {
            setReviewAnimeMap((prev) => ({
              ...prev,
              [rev.anime_id]: { title: matchedWatch.title, poster_url: matchedWatch.poster_url },
            }));
          } else if (matchedFav) {
            setReviewAnimeMap((prev) => ({
              ...prev,
              [rev.anime_id]: { title: matchedFav.title, poster_url: matchedFav.poster_url },
            }));
          } else {
            try {
              const anime = await getAnimeById(rev.anime_id);
              if (anime) {
                const title = anime.title_english || anime.title || 'Anime';
                const poster_url =
                  anime.images?.webp?.large_image_url ||
                  anime.images?.jpg?.large_image_url ||
                  '/banner-placeholder.webp';

                setReviewAnimeMap((prev) => ({
                  ...prev,
                  [rev.anime_id]: { title, poster_url },
                }));
              }
            } catch (e) {
              // Silent catch
            }
          }
        }
      });
    }
  }, [reviews, watchlist, favorites]);

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
    const originalFile = e.target.files[0];

    setUploadingAvatar(true);
    setSaveMessage(null);

    try {
      // Compress image client-side to 250x250 WebP blob (~15-25KB) to save storage quota
      const compressedBlob = await compressImage(originalFile, 250, 250, 0.75);
      const filePath = `${user.id}/${Date.now()}.webp`;

      const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, compressedBlob, {
        contentType: 'image/webp',
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
      setSaveMessage('Avatar compressed & updated successfully!');
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

  const handleUpdateEpisodeCount = async (item: WatchlistItem, newCount: number) => {
    const totalEps = item.total_episodes || 0;
    let targetCount = Math.max(0, newCount);

    if (totalEps > 0 && targetCount >= totalEps) {
      targetCount = totalEps;
    }

    let newStatus = item.status;
    if (totalEps > 0 && targetCount >= totalEps) {
      newStatus = 'COMPLETED';
    } else if (totalEps > 0 && targetCount < totalEps && item.status === 'COMPLETED') {
      newStatus = 'WATCHING';
    }

    setWatchlist((prev) =>
      prev.map((w) =>
        w.id === item.id ? { ...w, episodes_watched: targetCount, status: newStatus } : w
      )
    );

    await supabase
      .from('watchlist')
      .update({ episodes_watched: targetCount, status: newStatus })
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

  // Per-Anime Episode Duration Watch Time Calculation
  const totalEpisodesWatched = watchlist.reduce((sum, item) => sum + (item.episodes_watched || 0), 0);
  const totalMinutesWatched = watchlist.reduce(
    (sum, item) => sum + (item.episodes_watched || 0) * (item.duration_minutes || 24),
    0
  );

  const watchStats = formatDetailedWatchTimeFromMinutes(totalMinutesWatched);

  const completedCount = watchlist.filter((item) => item.status === 'COMPLETED').length;
  const watchingCount = watchlist.filter((item) => item.status === 'WATCHING').length;
  const planToWatchCount = watchlist.filter((item) => item.status === 'PLAN_TO_WATCH').length;
  const droppedCount = watchlist.filter((item) => item.status === 'DROPPED').length;

  const totalWatchlistItems = watchlist.length || 1;
  const completedPct = Math.round((completedCount / totalWatchlistItems) * 100);
  const watchingPct = Math.round((watchingCount / totalWatchlistItems) * 100);
  const planPct = Math.round((planToWatchCount / totalWatchlistItems) * 100);
  const droppedPct = Math.round((droppedCount / totalWatchlistItems) * 100);

  return (
    <div className="space-y-8">
      {/* Header Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 z-10 relative">
          {/* Avatar with Upload Hover Button (Only active during Edit Profile mode) */}
          <div className="relative group shrink-0">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-[#FF2A5F]/50 shadow-xl bg-slate-900">
              <Image src={avatarUrl} alt={profile?.username || 'User'} fill className="object-cover" unoptimized />
            </div>

            {isEditingProfile && (
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold gap-1"
              >
                <Camera className="w-5 h-5 text-[#FF2A5F]" />
                <span>{uploadingAvatar ? 'Compressing & Uploading...' : 'Change Avatar'}</span>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* User Info & Edit Form */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            {!isEditingProfile ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                      <span>{profile?.username || user.email?.split('@')[0]}</span>
                      <span
                        className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] flex items-center justify-center text-white shadow-md shadow-[#FF2A5F]/40 shrink-0"
                        title="Verified Member"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
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
                  <label className="text-[11px] font-semibold text-slate-300">Full Name (Display Name)</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your full name"
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
                <div className="flex flex-wrap items-center gap-2 pt-1">
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

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="ml-auto px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete My Account</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Anime Watch Analytics & Progress Visualization */}
      <div className="glass-panel p-6 rounded-3xl border border-white/15 shadow-2xl space-y-5 bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] flex items-center justify-center shadow-lg shadow-[#FF2A5F]/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">Anime Watch Analytics</h2>
              <p className="text-xs text-slate-400">Visual breakdown of your overall watching progress</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-extrabold text-[#FF2A5F]">
            <Clock className="w-4 h-4 text-[#FF2A5F]" />
            <span>Est. Watch Time: <strong className="text-white">{watchStats.formatted}</strong> ({watchStats.formattedHours} hrs)</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Episodes</span>
            <p className="text-xl font-black text-white">{totalEpisodesWatched}</p>
            <p className="text-[10px] text-slate-400">eps watched</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/30 space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Completed</span>
            <p className="text-xl font-black text-emerald-400">{completedCount}</p>
            <p className="text-[10px] text-slate-400">{completedPct}% of library</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-[#FF2A5F]/30 space-y-1">
            <span className="text-[10px] font-bold text-[#FF2A5F] uppercase tracking-wider">Watching</span>
            <p className="text-xl font-black text-[#FF2A5F]">{watchingCount}</p>
            <p className="text-[10px] text-slate-400">{watchingPct}% in progress</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-purple-500/30 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Plan to Watch</span>
            <p className="text-xl font-black text-purple-400">{planToWatchCount}</p>
            <p className="text-[10px] text-slate-400">{planPct}% queued</p>
          </div>
        </div>

        {/* Visual Multi-Segment Progress Bar */}
        {watchlist.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Library Status Distribution</span>
              <span className="text-slate-400">{watchlist.length} Total Animes Tracked</span>
            </div>

            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10 flex gap-0.5">
              <div
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                style={{ width: `${completedPct}%` }}
                title={`Completed: ${completedCount} (${completedPct}%)`}
              />
              <div
                className="h-full bg-[#FF2A5F] transition-all duration-500"
                style={{ width: `${watchingPct}%` }}
                title={`Watching: ${watchingCount} (${watchingPct}%)`}
              />
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${planPct}%` }}
                title={`Plan to Watch: ${planToWatchCount} (${planPct}%)`}
              />
              <div
                className="h-full bg-slate-600 rounded-r-full transition-all duration-500"
                style={{ width: `${droppedPct}%` }}
                title={`Dropped: ${droppedCount} (${droppedPct}%)`}
              />
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] font-bold pt-1 justify-center sm:justify-start">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Completed ({completedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A5F]" />
                <span className="text-slate-300">Watching ({watchingCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-slate-300">Plan to Watch ({planToWatchCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span className="text-slate-300">Dropped ({droppedCount})</span>
              </div>
            </div>
          </div>
        )}
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

      {/* TAB 1: WATCHLIST GRID */}
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
              {filteredWatchlist.map((item) => {
                const maxEps = item.total_episodes || 0;
                const isMaxReached = maxEps > 0 && item.episodes_watched >= maxEps;
                const epDuration = item.duration_minutes || 24;

                return (
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

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-[#FF2A5F]">
                          {item.status.replace(/_/g, ' ')}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 text-[9px] font-semibold border border-white/10">
                          {epDuration}m/ep
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 mt-1">
                        <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-white/10">
                          <span className="text-[10px] text-slate-400 font-bold">Ep</span>
                          <input
                            type="number"
                            min={0}
                            max={maxEps > 0 ? maxEps : 9999}
                            value={item.episodes_watched}
                            onChange={(e) => handleUpdateEpisodeCount(item, parseInt(e.target.value) || 0)}
                            className="w-9 bg-transparent text-center text-xs font-black text-white focus:outline-none"
                          />
                          {maxEps > 0 && <span className="text-[10px] text-slate-400">/ {maxEps}</span>}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateEpisodeCount(item, item.episodes_watched - 1)}
                            disabled={item.episodes_watched <= 0}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-white font-black text-[10px] hover:bg-[#FF2A5F] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            title="Decrease episode"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleUpdateEpisodeCount(item, item.episodes_watched + 1)}
                            disabled={isMaxReached}
                            className="px-2.5 py-1 rounded-lg bg-[#FF2A5F] text-white font-extrabold text-[10px] hover:scale-105 transition-transform shadow-sm shadow-[#FF2A5F]/20 disabled:opacity-30 disabled:pointer-events-none"
                            title={isMaxReached ? 'All episodes completed!' : 'Increment episode'}
                          >
                            +1 Ep
                          </button>
                          <button
                            onClick={() => handleRemoveFromWatchlist(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-0.5"
                            title="Remove from Watchlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="group relative glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col hover:border-[#FF2A5F]/40 transition-all duration-300 shadow-xl"
                >
                  <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden">
                    <Image
                      src={item.poster_url || '/banner-placeholder.webp'}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF2A5F] text-white flex items-center gap-1 shadow-md">
                        <Bookmark className="w-3 h-3 fill-white" /> Saved
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveFromFavorites(item.id)}
                      className="absolute top-2.5 left-2.5 z-20 p-1.5 rounded-full bg-slate-900/90 text-slate-300 hover:text-red-400 hover:scale-110 transition-all border border-white/10"
                      title="Remove from Favorites"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                      <Link
                        href={`/anime/${item.anime_id}`}
                        className="w-full py-1.5 rounded-xl bg-[#FF2A5F] hover:bg-[#E01E4F] text-white text-[11px] font-extrabold flex items-center justify-center gap-1 shadow-lg shadow-[#FF2A5F]/30 transition-all group-hover:scale-102"
                      >
                        <span>View Details</span>
                        <Sparkles className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-3">
                    <Link
                      href={`/anime/${item.anime_id}`}
                      className="text-xs font-bold text-white truncate block group-hover:text-[#FF2A5F] transition-colors"
                      title={item.title}
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
            reviews.map((rev) => {
              const details = reviewAnimeMap[rev.anime_id];
              const matchedWatchItem = watchlist.find((w) => w.anime_id === rev.anime_id);
              const matchedFavItem = favorites.find((f) => f.anime_id === rev.anime_id);
              const animeTitle =
                rev.anime_title ||
                matchedWatchItem?.title ||
                matchedFavItem?.title ||
                details?.title ||
                `Anime #${rev.anime_id}`;
              const posterUrl =
                rev.poster_url ||
                matchedWatchItem?.poster_url ||
                matchedFavItem?.poster_url ||
                details?.poster_url ||
                '/banner-placeholder.webp';

              return (
                <div
                  key={rev.id}
                  className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-row gap-3.5 sm:gap-5 items-start hover:border-[#FF2A5F]/30 transition-all shadow-xl"
                >
                  {/* Poster Banner */}
                  <div className="relative w-16 sm:w-20 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 shrink-0 shadow-md">
                    <Image
                      src={posterUrl}
                      alt={animeTitle}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <Link
                          href={`/anime/${rev.anime_id}`}
                          className="text-sm font-black text-white hover:text-[#FF2A5F] transition-colors truncate block"
                        >
                          {animeTitle}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Reviewed on {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white px-3 py-1 rounded-xl font-black text-xs shadow-md">
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>{rev.rating} / 10</span>
                        </div>

                        <button
                          onClick={() => {
                            setEditingReviewId(rev.id);
                            setEditReviewText(rev.review_text);
                            setEditReviewRating(rev.rating);
                          }}
                          className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-all"
                          title="Edit Review"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {editingReviewId === rev.id ? (
                      <div className="space-y-3 pt-2 bg-slate-950/80 p-3 rounded-2xl border border-white/10">
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
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-2xl border border-white/5">
                        &quot;{rev.review_text}&quot;
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center text-slate-400 space-y-3">
              <MessageSquare className="w-8 h-8 text-[#FF2A5F] mx-auto" />
              <p className="text-xs">You haven&apos;t written any reviews yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-red-500/30 max-w-md w-full space-y-5 bg-slate-900/95 shadow-2xl">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Delete Account Permanently?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-red-500/10 p-3.5 rounded-2xl border border-red-500/20">
              All your watchlist progress, saved favorites, and reviews will be permanently erased from OtakuPulse.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                To confirm, type <span className="text-red-400 font-mono font-black select-all">deletemyaccount</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => {
                  setDeleteConfirmationText(e.target.value);
                  setDeleteError(null);
                }}
                placeholder="deletemyaccount"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-red-500"
              />
              {deleteError && <p className="text-[11px] font-bold text-red-400">{deleteError}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText('');
                  setDeleteError(null);
                }}
                className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 text-xs font-bold hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText.trim() !== 'deletemyaccount' || isDeletingAccount}
                onClick={handleConfirmDeleteAccount}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {isDeletingAccount ? 'Deleting Account...' : 'Confirm Delete Account'}
              </button>
            </div>
          </div>
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
