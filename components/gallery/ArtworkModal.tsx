'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Download, Copy, Check, ExternalLink, User } from 'lucide-react';
import { NekosImage } from '../../lib/api/nekosClient';

interface ArtworkModalProps {
  artwork: NekosImage | null;
  onClose: () => void;
}

export function ArtworkModal({ artwork, onClose }: ArtworkModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!artwork) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(artwork.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(artwork.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `otakupulse-wallpaper-${artwork.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(artwork.url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative glass-panel rounded-3xl border border-white/15 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden bg-slate-950/95 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/15 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lightbox Image Preview */}
        <div className="relative w-full min-h-[300px] sm:min-h-[450px] bg-black flex items-center justify-center overflow-hidden">
          <Image
            src={artwork.url}
            alt={artwork.title || 'High Res Anime Wallpaper'}
            width={1920}
            height={1080}
            className="w-full h-full max-h-[65vh] object-contain"
            unoptimized
          />
        </div>

        {/* Lightbox Info Bar & Controls */}
        <div className="p-5 sm:p-6 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white truncate">
                {artwork.title || 'Anime Wallpaper Artwork'}
              </h3>
              {artwork.dimensions && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#FF2A5F]/20 text-[#FF2A5F] text-[10px] font-extrabold uppercase tracking-wider border border-[#FF2A5F]/30 shrink-0">
                  {artwork.dimensions}
                </span>
              )}
            </div>

            {/* Artist Attribution */}
            {artwork.artist_name && (
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <User className="w-3.5 h-3.5 text-[#FF2A5F]" />
                <span>Artist:</span>
                {artwork.artist_href ? (
                  <a
                    href={artwork.artist_href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF2A5F] hover:underline font-bold flex items-center gap-0.5"
                  >
                    <span>{artwork.artist_name}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                ) : (
                  <span className="text-white font-bold">{artwork.artist_name}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {artwork.source_url && (
              <a
                href={artwork.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Source
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Link!' : 'Copy URL'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white font-extrabold text-xs shadow-lg shadow-[#FF2A5F]/25 flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Download HD Wallpaper'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
