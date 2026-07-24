'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon, Download, Maximize2, Sparkles, Copy, Check } from 'lucide-react';
import { AnimeItem } from '../../lib/types/anime';
import { getAnimePictures } from '../../lib/api/jikanClient';
import { Modal } from '../ui/Modal';

interface ArtworkAsset {
  id: string;
  title: string;
  url: string;
  category: 'banner' | 'poster' | 'promo';
  dimensions: string;
}

interface HDArtworkGalleryProps {
  anime: AnimeItem;
}

export function HDArtworkGallery({ anime }: HDArtworkGalleryProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'banner' | 'poster' | 'promo'>('all');
  const [lightboxImage, setLightboxImage] = useState<ArtworkAsset | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const mainTitle = anime?.title_english || anime?.title || 'Anime';
  const mainPoster =
    anime?.images?.webp?.large_image_url ||
    anime?.images?.jpg?.large_image_url ||
    '/banner-placeholder.webp';
  const mainBanner = anime?.banner_url || mainPoster;

  // Query Multi-Source Jikan + AniList Official Pictures API
  const { data: apiPictures } = useQuery({
    queryKey: ['animePicturesMultiSource', anime?.mal_id],
    queryFn: () => (anime?.mal_id ? getAnimePictures(anime.mal_id) : Promise.resolve([])),
    enabled: !!anime?.mal_id,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  if (!anime) return null;

  // Combine All Art Assets
  const assets: ArtworkAsset[] = [
    {
      id: 'banner-official-1',
      title: `${mainTitle} — Official Ultra-Wide HD Banner`,
      url: mainBanner,
      category: 'banner',
      dimensions: '1920 x 1080 HD',
    },
    {
      id: 'poster-official-1',
      title: `${mainTitle} — Official Poster Visual`,
      url: mainPoster,
      category: 'poster',
      dimensions: '1200 x 1600 HD',
    },
  ];

  // Append Multi-Source Pictures from Jikan & AniList
  if (apiPictures && apiPictures.length > 0) {
    apiPictures.forEach((picUrl, idx) => {
      if (picUrl !== mainPoster && picUrl !== mainBanner) {
        assets.push({
          id: `promo-visual-${idx}`,
          title: `${mainTitle} — Official Key Visual & Artwork #${idx + 1}`,
          url: picUrl,
          category: idx % 2 === 0 ? 'promo' : 'banner',
          dimensions: '1080 x 1920 HD',
        });
      }
    });
  }

  const filteredAssets = activeTab === 'all' ? assets : assets.filter((a) => a.category === activeTab);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // One-Click Client Blob Download Trigger
  const handleDownload = async (asset: ArtworkAsset) => {
    try {
      setDownloadingId(asset.id);
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${mainTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${asset.category}_${asset.id}.webp`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);
    } catch (err) {
      window.open(asset.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] text-white flex items-center justify-center shadow-lg shadow-[#FF2A5F]/20 shrink-0">
            <ImageIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              Official HD Artworks &amp; Promotional Visuals
            </h3>
            <p className="text-xs text-slate-400">
              Verified key visuals &amp; wallpapers powered by Jikan API &amp; AniList ({assets.length} HD Assets)
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center p-1 bg-slate-900/80 rounded-xl border border-white/10 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('banner')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'banner'
                ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Banners
          </button>
          <button
            onClick={() => setActiveTab('poster')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'poster'
                ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Posters
          </button>
          <button
            onClick={() => setActiveTab('promo')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'promo'
                ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Key Visuals
          </button>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="group relative rounded-2xl overflow-hidden glass-card border border-white/10 hover:border-[#FF2A5F]/40 transition-all space-y-2 min-w-0"
          >
            <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
              <Image
                src={asset.url}
                alt={asset.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase tracking-wider">
                  {asset.dimensions}
                </span>
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2.5 bg-black/40 backdrop-blur-xs p-4">
                <button
                  onClick={() => setLightboxImage(asset)}
                  className="p-3 rounded-full bg-slate-800/90 text-white hover:bg-[#8A2BE2] transition-colors border border-white/20"
                  title="Full Screen Preview"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCopyUrl(asset.url, asset.id)}
                  className="p-3 rounded-full bg-slate-800/90 text-white hover:bg-slate-700 transition-colors border border-white/20"
                  title="Copy URL"
                >
                  {copiedId === asset.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDownload(asset)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#FF2A5F] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#FF2A5F]/40 hover:scale-105 transition-all"
                  title="Download Wallpaper"
                >
                  {downloadingId === asset.id ? (
                    <span>Downloading...</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Save HD
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between gap-2 min-w-0">
              <span className="text-xs font-semibold text-white truncate min-w-0">{asset.title}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">[{asset.category}]</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <Modal
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
          title={lightboxImage.title}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black border border-white/10">
              <Image
                src={lightboxImage.url}
                alt={lightboxImage.title}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-semibold">{lightboxImage.dimensions}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyUrl(lightboxImage.url, lightboxImage.id)}
                  className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedId === lightboxImage.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId === lightboxImage.id ? 'Copied Link!' : 'Copy URL'}</span>
                </button>
                <button
                  onClick={() => handleDownload(lightboxImage)}
                  className="px-5 py-2.5 rounded-xl bg-[#FF2A5F] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#FF2A5F]/40"
                >
                  <Download className="w-4 h-4" /> Download Original HD Artwork
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
