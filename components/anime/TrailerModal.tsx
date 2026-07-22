'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { Play, AlertTriangle } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string | null;
  title: string;
}

export function TrailerModal({ isOpen, onClose, trailerUrl, title }: TrailerModalProps) {
  if (!trailerUrl) return null;

  // Format embed URL to ensure autoplay and privacy-enhanced mode
  let formattedUrl = trailerUrl;
  if (!formattedUrl.includes('autoplay=1')) {
    formattedUrl += (formattedUrl.includes('?') ? '&' : '?') + 'autoplay=1&enablejsapi=1';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Trailer: ${title}`} maxWidth="4xl">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
        {trailerUrl ? (
          <iframe
            src={formattedUrl}
            title={`${title} Trailer`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
            <AlertTriangle className="w-12 h-12 text-amber-400" />
            <p className="text-sm font-semibold">Official Trailer preview is currently restricted or unavailable.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
