'use client';

import React from 'react';
import { Tag, Sparkles } from 'lucide-react';
import { NEKOS_IMAGE_CATEGORIES, NEKOS_GIF_CATEGORIES } from '../../lib/api/nekosClient';

interface CategoryBarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryBar({ activeCategory, onSelectCategory }: CategoryBarProps) {
  const mainCategories = [
    { id: 'waifu', label: 'Waifu' },
    { id: 'neko', label: 'Neko' },
    { id: 'kitsune', label: 'Kitsune' },
    { id: 'husbando', label: 'Husbando' },
  ];

  const reactionGifs = NEKOS_GIF_CATEGORIES.slice(0, 5);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      <span className="text-slate-400 text-xs flex items-center gap-1 mr-1">
        <Tag className="w-3.5 h-3.5 text-[#FF2A5F]" /> Categories:
      </span>

      {mainCategories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelectCategory(cat.id)}
          className={`px-4 py-1.5 rounded-xl capitalize transition-all border ${
            activeCategory === cat.id
              ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white border-transparent shadow-md font-black scale-105'
              : 'bg-slate-900/80 text-slate-300 border-white/10 hover:text-white hover:border-white/20'
          }`}
        >
          {cat.label}
        </button>
      ))}

      <div className="h-4 w-px bg-white/15 mx-1 hidden sm:block" />

      {reactionGifs.map((gif) => (
        <button
          key={gif}
          type="button"
          onClick={() => onSelectCategory(gif)}
          className={`px-3 py-1.5 rounded-xl capitalize transition-all border ${
            activeCategory === gif
              ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white border-transparent shadow-md font-black scale-105'
              : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
          }`}
        >
          {gif} (GIF)
        </button>
      ))}
    </div>
  );
}
