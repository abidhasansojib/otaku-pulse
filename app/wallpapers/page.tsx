'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  fetchNekosWallpapers,
  NekosImage,
  NEKOS_IMAGE_CATEGORIES,
  NEKOS_GIF_CATEGORIES,
} from '../../lib/api/nekosClient';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  ExternalLink,
  Search,
  Layers,
  X,
  Heart,
  Tag,
} from 'lucide-react';

export default function WallpapersPage() {
  const [category, setCategory] = useState<string>('waifu');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeQuery, setActiveQuery] = useState<string>('waifu');
  const [activeImage, setActiveImage] = useState<NekosImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Fetch wallpapers using React Query powered by nekos.best API + AniList
  const { data: wallpapers, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['nekosBestWallpapers', activeQuery],
    queryFn: () => fetchNekosWallpapers(activeQuery, 20),
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveQuery(searchQuery.trim());
    }
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setSearchQuery('');
    setActiveQuery(cat);
  };

  const handleCopyUrl = (url: string, id: string | number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (url: string, id: string | number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `otakupulse-anime-wallpaper-${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-[#FF2A5F]/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A5F]/20 border border-[#FF2A5F]/30 text-[#FF2A5F] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Powered by Nekos.best API v2 &amp; AniList HD
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Anime HD Wallpaper &amp; Artwork Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Discover, search, and download high-definition anime wallpapers, character art, and GIFs powered by the official Nekos.best API.
            </p>
          </div>

          {/* Shuffle Button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-5 py-3 rounded-2xl bg-slate-900 border border-white/15 hover:border-[#FF2A5F] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-[#FF2A5F] ${isFetching ? 'animate-spin' : ''}`} />
            <span>Shuffle Wallpapers</span>
          </button>
        </div>

        {/* Search Bar & Category Pills */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wallpapers by artist, title, or keyword (e.g. Rin, Genshin, Waifu, Neko)..."
                className="w-full pl-11 pr-24 py-3 rounded-2xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF2A5F] transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white text-xs font-bold hover:scale-105 transition-transform"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Filter Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
            <span className="text-slate-400 text-xs flex items-center gap-1 mr-1">
              <Tag className="w-3.5 h-3.5 text-[#FF2A5F]" /> Categories:
            </span>
            {NEKOS_IMAGE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-1.5 rounded-xl capitalize transition-all border ${
                  activeQuery === cat
                    ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white border-transparent shadow-md font-extrabold'
                    : 'bg-slate-900/80 text-slate-300 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
            {NEKOS_GIF_CATEGORIES.slice(0, 4).map((gifCat) => (
              <button
                key={gifCat}
                onClick={() => handleCategorySelect(gifCat)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all border ${
                  activeQuery === gifCat
                    ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white border-transparent shadow-md font-extrabold'
                    : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {gifCat} (GIF)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Filter Indicator */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
        <p>
          Showing results for: <strong className="text-white capitalize">{activeQuery}</strong>
        </p>
        <p className="text-slate-400">{wallpapers?.length || 0} HD Wallpapers Loaded</p>
      </div>

      {/* Wallpapers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[16/10] rounded-2xl bg-slate-900/80 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : !wallpapers || wallpapers.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center text-slate-400 space-y-3">
          <Layers className="w-10 h-10 text-[#FF2A5F] mx-auto" />
          <p className="text-sm font-bold text-white">No wallpapers found for &quot;{activeQuery}&quot;</p>
          <p className="text-xs">Try searching another category like neko, waifu, kitsune or anime title.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wallpapers.map((img) => (
            <div
              key={img.id}
              className="group relative glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF2A5F]/50 transition-all duration-300 hover:scale-102 hover:shadow-xl hover:shadow-[#FF2A5F]/10 flex flex-col"
            >
              {/* Wallpaper Preview Image */}
              <div
                onClick={() => setActiveImage(img)}
                className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950 cursor-pointer"
              >
                <Image
                  src={img.url}
                  alt={img.title || 'Anime Wallpaper'}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5 glass-panel px-3 py-1.5 rounded-xl border border-white/20">
                    <Eye className="w-3.5 h-3.5 text-[#FF2A5F]" /> View High-Res
                  </span>
                </div>
              </div>

              {/* Wallpaper Card Info & Actions */}
              <div className="p-3.5 bg-slate-950/90 flex items-center justify-between gap-2 border-t border-white/5">
                <div className="space-y-0.5 truncate min-w-0">
                  <p className="text-xs font-bold text-white truncate" title={img.title || 'Anime Artwork'}>
                    {img.title || img.artist_name || 'Anime Artwork'}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {img.tags?.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(img.url, img.id)}
                    title="Copy Link"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
                  >
                    {copiedId === img.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(img.url, img.id)}
                    title="Download Wallpaper"
                    className="p-2 rounded-xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white transition-transform hover:scale-105 shadow-md shadow-[#FF2A5F]/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* High-Res Lightbox Modal */}
      {activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative glass-panel rounded-3xl border border-white/15 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden bg-slate-950/95 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/15 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Lightbox Image Preview */}
            <div className="relative w-full min-h-[300px] sm:min-h-[450px] bg-black flex items-center justify-center overflow-hidden">
              <Image
                src={activeImage.url}
                alt={activeImage.title || 'High Res Wallpaper'}
                width={1920}
                height={1080}
                className="w-full h-full max-h-[65vh] object-contain"
                unoptimized
              />
            </div>

            {/* Lightbox Info Bar */}
            <div className="p-5 sm:p-6 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white truncate">
                    {activeImage.title || activeImage.artist_name || 'Anime Wallpaper Artwork'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-[#FF2A5F]/20 text-[#FF2A5F] text-[10px] font-bold uppercase shrink-0">
                    HD Wallpaper
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeImage.tags?.map((t, idx) => (
                    <span key={idx} className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-white/5">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {activeImage.source_url && (
                  <a
                    href={activeImage.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Source
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleCopyUrl(activeImage.url, activeImage.id)}
                  className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedId === activeImage.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId === activeImage.id ? 'Copied Link!' : 'Copy URL'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(activeImage.url, activeImage.id)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white font-extrabold text-xs shadow-lg shadow-[#FF2A5F]/25 flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Original HD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
