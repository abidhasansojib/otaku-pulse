'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Play, Info, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
      className="relative w-full h-[540px] md:h-[580px] rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Auto-slide Progress Bar */}
      {!isPaused && (
        <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/10 overflow-hidden">
          <motion.div
            key={`hero-progress-${currentIndex}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 6, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2]"
          />
        </div>
      )}

      {/* Background Image Carousel with Fade Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`hero-slide-${currentAnime.mal_id}-${currentIndex}`}
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
      <div className="relative z-10 h-full max-w-4xl px-5 sm:px-8 md:px-12 flex flex-col justify-end pb-16 sm:pb-14 md:pb-16 space-y-3 sm:space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cyber" size="md">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Featured Spotlight
          </Badge>
          {currentAnime.airing && <Badge variant="success" size="md">Airing Now</Badge>}
          <div className="flex items-center gap-1 bg-[#FF2A5F] text-white px-2.5 py-1 rounded-full font-bold text-xs shadow-md">
            <Star className="w-3.5 h-3.5 fill-white" />
            <span>MAL {score}</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
          {title}
        </h1>

        {/* Synopsis */}
        {currentAnime.synopsis && (
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 md:line-clamp-3 max-w-2xl leading-relaxed font-normal">
            {currentAnime.synopsis}
          </p>
        )}

        {/* Genre Pills */}
        {currentAnime.genres && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-0.5">
            {currentAnime.genres.slice(0, 4).map((g, idx) => (
              <span key={`hero-genre-${g.mal_id}-${idx}`} className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-900/80 text-slate-200 border border-white/10">
                {g.name}
              </span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pt-1">
          {trailerUrl && (
            <button
              onClick={() => onPlayTrailer(trailerUrl, title)}
              className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl bg-[#FF2A5F] hover:bg-[#E01E4F] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-[#FF2A5F]/30 hover:scale-102 active:scale-98 transition-all"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" /> Watch Trailer
            </button>
          )}

          <Link
            href={`/anime/${currentAnime.mal_id}`}
            className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl glass-panel text-white font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-white/10 border border-white/20 transition-all"
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8A2BE2]" /> Explore Details
          </Link>
        </div>
      </div>

      {/* Navigation & Thumbnail Preview Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 md:bottom-5 z-30 flex items-center gap-2">
        <button
          onClick={() => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))}
          className="p-2 sm:p-2.5 rounded-full glass-panel text-white hover:bg-white/20 transition-colors border border-white/15 shadow-lg"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Mini Poster Preview Indicators */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel border border-white/15 shadow-lg">
          {items.slice(0, 7).map((item, idx) => {
            const isActive = idx === currentIndex;
            const thumb = item.images?.webp?.small_image_url || item.images?.jpg?.small_image_url || '/banner-placeholder.webp';

            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                  isActive
                    ? 'w-7 h-9 ring-2 ring-[#FF2A5F] scale-110 shadow-md'
                    : 'w-5 h-7 opacity-50 hover:opacity-100 hover:scale-105'
                }`}
                title={item.title_english || item.title}
              >
                <Image src={thumb} alt={item.title} fill className="object-cover" unoptimized />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
          className="p-2 sm:p-2.5 rounded-full glass-panel text-white hover:bg-white/20 transition-colors border border-white/15 shadow-lg"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
