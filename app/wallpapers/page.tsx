'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { getAnimeWallpapers, WallpaperItem } from '../../lib/api/wallpapers';
import {
  Sparkles,
  RefreshCw,
  Download,
  Copy,
  Check,
  Eye,
  Tag,
  Layers,
  X,
  ExternalLink,
} from 'lucide-react';

const WALLPAPER_TAGS = [
  { id: 'waifu', label: 'Waifu' },
  { id: 'neko', label: 'Neko' },
  { id: 'maid', label: 'Maid' },
  { id: 'mori-calliope', label: 'Mori Calliope' },
  { id: 'oppai', label: 'Oppai' },
] as const;

export default function WallpapersPage() {
  const [activeTag, setActiveTag] = useState<string>('waifu');
  const [activeItem, setActiveItem] = useState<WallpaperItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Query Waifu.im + Waifu.pics wallpapers
  const { data: wallpapers, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['animeWallpapersHub', activeTag],
    queryFn: () => getAnimeWallpapers(activeTag, 24),
    staleTime: 1000 * 60 * 15, // 15 mins cache
  });

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (url: string, id: string) => {
    try {
      setDownloadingId(id);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `otakupulse-wallpaper-${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-purple-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Powered by Waifu.im &amp; Waifu.pics API
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Anime HD Wallpaper &amp; Artwork Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Explore and download ultra-high-definition anime wallpapers, character art, and fan illustrations.
            </p>
          </div>

          {/* Shuffle Button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-5 py-3 rounded-2xl bg-slate-900 border border-white/15 hover:border-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-purple-400 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Shuffle Artworks</span>
          </button>
        </div>

        {/* Tag Selection Pills */}
        <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 flex-wrap text-xs font-semibold">
          <span className="text-slate-400 text-xs flex items-center gap-1 mr-1">
            <Tag className="w-3.5 h-3.5 text-purple-400" /> Filter Tags:
          </span>
          {WALLPAPER_TAGS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTag(t.id)}
              className={`px-4 py-2 rounded-xl transition-all border ${
                activeTag === t.id
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white border-transparent shadow-lg font-black scale-105'
                  : 'bg-slate-900/80 text-slate-300 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query Status Bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
        <p>
          Showing tag: <strong className="text-white capitalize">{activeTag}</strong>
        </p>
        <p>{wallpapers?.length || 0} Wallpapers Loaded</p>
      </div>

      {/* Responsive Grid: 2-column on mobile, 4-column on desktop */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-900/80 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : !wallpapers || wallpapers.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center text-slate-400 space-y-3">
          <Layers className="w-10 h-10 text-purple-400 mx-auto" />
          <p className="text-sm font-bold text-white">No wallpapers found for &quot;{activeTag}&quot;</p>
          <p className="text-xs">Click shuffle or select another tag.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {wallpapers.map((item) => (
            <div
              key={item.id}
              className="group relative glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 flex flex-col h-full bg-slate-950/90"
            >
              <div
                onClick={() => setActiveItem(item)}
                className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900 cursor-pointer"
              >
                <Image
                  src={item.url}
                  alt={activeTag}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />

                {item.width && item.height && (
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="px-2 py-0.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-[9px] font-black text-white border border-white/15">
                      {item.width}x{item.height}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-xs font-black text-white flex items-center gap-1.5 glass-panel px-3 py-1.5 rounded-xl border border-white/20">
                    <Eye className="w-3.5 h-3.5 text-purple-400" /> View HD
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/90 flex items-center justify-between gap-2 border-t border-white/5">
                <span className="text-xs font-bold text-white capitalize truncate">{activeTag} Artwork</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.url, item.id)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10"
                    title="Copy URL"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(item.url, item.id)}
                    className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs"
                    title="Download HD Image"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen HD Lightbox Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative glass-panel rounded-3xl border border-white/15 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden bg-slate-950/95 shadow-2xl">
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/15 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-full min-h-[300px] sm:min-h-[450px] bg-black flex items-center justify-center overflow-hidden">
              <Image
                src={activeItem.url}
                alt="Full HD Anime Wallpaper"
                width={1920}
                height={1080}
                className="w-full h-full max-h-[65vh] object-contain"
                unoptimized
              />
            </div>

            <div className="p-5 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white capitalize">{activeTag} HD Wallpaper</h3>
                {activeItem.width && activeItem.height && (
                  <p className="text-xs text-slate-400 font-semibold">{activeItem.width} x {activeItem.height} pixels</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {activeItem.source && (
                  <a
                    href={activeItem.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Source
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyUrl(activeItem.url, activeItem.id)}
                  className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedId === activeItem.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId === activeItem.id ? 'Copied Link!' : 'Copy URL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(activeItem.url, activeItem.id)}
                  disabled={downloadingId === activeItem.id}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingId === activeItem.id ? 'Downloading...' : 'Download HD Image'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
