'use client';

import { useState, useEffect } from 'react';
import { AnimeItem } from '../types/anime';

const STORAGE_KEY = 'otaku_pulse_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<AnimeItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load favorites from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const addFavorite = (anime: AnimeItem) => {
    setFavorites((prev) => {
      if (prev.some((item) => item.mal_id === anime.mal_id)) return prev;
      const updated = [anime, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFavorite = (mal_id: number) => {
    setFavorites((prev) => {
      const updated = prev.filter((item) => item.mal_id !== mal_id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (mal_id: number) => {
    return favorites.some((item) => item.mal_id === mal_id);
  };

  const toggleFavorite = (anime: AnimeItem) => {
    if (isFavorite(anime.mal_id)) {
      removeFavorite(anime.mal_id);
    } else {
      addFavorite(anime);
    }
  };

  return {
    favorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}
