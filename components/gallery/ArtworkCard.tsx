'use client';

import React from 'react';
import Image from 'next/image';
import { ExternalLink, Eye, Download, User } from 'lucide-react';
import { NekosImage } from '../../lib/api/nekosClient';

interface ArtworkCardProps {
  artwork: NekosImage;
  onOpenLightbox: (artwork: NekosImage) => void;
  onDownload: (url: string, id: string | number) => void;
}

export function ArtworkCard({ artwork, onOpenLightbox, onDownload }: ArtworkCardProps) {
  return (
    <div className="group relative glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF2A5F]/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#FF2A5F]/10 flex flex-col h-full bg-slate-950/90">
      {/* Artwork Preview Image Container */}
      <div
        onClick={() => onOpenLightbox(artwork)}
        className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900 cursor-pointer"
      >
        <Image
          src={artwork.url}
          alt={artwork.title || 'Anime Artwork'}
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />

        {/* Dimension Badge Overlay (Top Right) */}
        {artwork.dimensions && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-[10px] font-black text-white border border-white/15 uppercase tracking-wider shadow-md">
              {artwork.dimensions}
            </span>
          </div>
        )}

        {/* Hover View High-Res Bar */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="text-xs font-black text-white flex items-center gap-1.5 glass-panel px-3.5 py-1.5 rounded-xl border border-white/20 shadow-lg">
            <Eye className="w-3.5 h-3.5 text-[#FF2A5F]" /> View High-Res HD
          </span>
        </div>
      </div>

      {/* Card Info & Attribution Footer */}
      <div className="p-3.5 bg-slate-950/90 flex flex-col justify-between flex-1 border-t border-white/5 space-y-2.5">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-bold text-white truncate" title={artwork.title || 'Anime Artwork'}>
            {artwork.title || 'Anime Artwork'}
          </p>

          {/* Artist Attribution Badge */}
          {artwork.artist_name && (
            <div className="flex items-center gap-1 text-[11px] text-slate-300">
              <User className="w-3 h-3 text-[#FF2A5F] shrink-0" />
              {artwork.artist_href ? (
                <a
                  href={artwork.artist_href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-[#FF2A5F] hover:underline truncate font-medium flex items-center gap-0.5"
                >
                  <span>{artwork.artist_name}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              ) : (
                <span className="truncate font-medium">{artwork.artist_name}</span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls & Direct Source Link */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
          {artwork.source_url ? (
            <a
              href={artwork.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/20 transition-all"
            >
              <span>Source</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ) : (
            <span className="text-[10px] text-slate-500 font-semibold uppercase">HD Wallpaper</span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(artwork.url, artwork.id);
            }}
            title="Download HD Wallpaper"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white text-xs font-extrabold flex items-center gap-1 shadow-md shadow-[#FF2A5F]/20 hover:scale-105 transition-all"
          >
            <Download className="w-3 h-3" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
