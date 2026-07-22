'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Play, Info, ChevronLeft, ChevronRight, Volume2, Sparkles } from 'lucide-react';
import { AnimeItem } from '../../lib/types/anime';
import { Badge } from '../ui/Badge';

interface HeroCarouselProps {
  items: AnimeItem[];
  onPlayTrailer: (trailerUrl: string, title: string) => void;
}

export function HeroCarousel({ items, onPlayTrailer }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [items.length, isPaused]);

  if (!items || items.length === 0) return null;

  const currentAnime = items[currentIndex];
  const bannerArt = currentAnime.banner_url || 
                    currentAnime.trailer?.images?.maximum_image_url ||
                    currentAnime.images?.webp?.large_image_url ||
                    '/banner-placeholder.webp';

  const title = currentAnime.title_english || currentAnime.title;
  const score = currentAnime.score ? currentAnime.score.toFixed(1) : '9.0';
  const trailerUrl = currentAnime.trailer?.embed_url;

  return (
    <div
      className="relative w-full h-[520px] md:h-[580px] rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Carousel with Fade Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAnime.mal_id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={bannerArt}
            alt={title}
            fill
            priority
            className="object-cover object-center brightness-75"
            unoptimized
          />
          {/* Gradients Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/80 to-transparent w-full md:w-3/4" />
        </motion.div>
      </AnimatePresence>

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-4xl px-6 md:px-12 flex flex-col justify-end pb-10 md:pb-14 space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cyber" size="md">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Featured Spotlight
          </Badge>
          {currentAnime.airing && <Badge variant="success" size="md">Airing Now</Badge>}
          <Badge variant="outline" size="md" className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-[#8A2BE2]" /> Multi-Audio Dub
          </Badge>
          <div className="flex items-center gap-1 bg-[#FF2A5F] text-white px-2.5 py-1 rounded-full font-bold text-xs shadow-md">
            <Star className="w-3.5 h-3.5 fill-white" />
            <span>MAL {score}</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
          {title}
        </h1>

        {/* Synopsis */}
        {currentAnime.synopsis && (
          <p className="text-xs md:text-sm text-slate-300 line-clamp-2 md:line-clamp-3 max-w-2xl leading-relaxed font-normal">
            {currentAnime.synopsis}
          </p>
        )}

        {/* Genre Pills */}
        {currentAnime.genres && (
          <div className="flex flex-wrap gap-2 pt-1">
            {currentAnime.genres.slice(0, 4).map((g) => (
              <span key={g.mal_id} className="text-xs px-3 py-1 rounded-full bg-slate-900/80 text-slate-200 border border-white/10">
                {g.name}
              </span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4 pt-3">
          {trailerUrl && (
            <button
              onClick={() => onPlayTrailer(trailerUrl, title)}
              className="px-6 py-3.5 rounded-2xl bg-[#FF2A5F] hover:bg-[#E01E4F] text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-[#FF2A5F]/30 hover:scale-102 active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-white" /> Watch Trailer
            </button>
          )}

          <Link
            href={`/anime/${currentAnime.mal_id}`}
            className="px-6 py-3.5 rounded-2xl glass-panel text-white font-bold text-sm flex items-center gap-2 hover:bg-white/10 border border-white/20 transition-all"
          >
            <Info className="w-4 h-4 text-[#8A2BE2]" /> Explore Details
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <button
          onClick={() => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))}
          className="p-3 rounded-full glass-panel text-white hover:bg-white/20 transition-colors border border-white/10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Indicators */}
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full glass-panel border border-white/10">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? 'w-6 bg-[#FF2A5F]' : 'w-2 bg-slate-600'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
          className="p-3 rounded-full glass-panel text-white hover:bg-white/20 transition-colors border border-white/10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
