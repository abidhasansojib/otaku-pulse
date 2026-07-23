'use client';

import { useState, useEffect } from 'react';
import { AnimeItem } from '../types/anime';
import { createClient } from '../supabase/client';

const STORAGE_KEY = 'anidex_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<AnimeItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          const mapped: AnimeItem[] = data.map((item: any) => ({
            mal_id: item.anime_id,
            url: `/anime/${item.anime_id}`,
            title: item.title,
            images: {
              jpg: { image_url: item.poster_url || '/banner-placeholder.webp' },
            },
          }));
          setFavorites(mapped);
          setIsLoaded(true);
          return;
        }
      }

      // Fallback to Local Storage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const addFavorite = async (anime: AnimeItem) => {
    setFavorites((prev) => {
      if (prev.some((item) => item.mal_id === anime.mal_id)) return prev;
      const updated = [anime, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const posterUrl =
          anime.images?.webp?.large_image_url ||
          anime.images?.jpg?.large_image_url ||
          anime.images?.jpg?.image_url ||
          '/banner-placeholder.webp';

        const title = anime.title_english || anime.title;

        await supabase.from('favorites').upsert(
          {
            user_id: user.id,
            anime_id: anime.mal_id,
            title,
            poster_url: posterUrl,
          },
          { onConflict: 'user_id,anime_id' }
        );
      }
    } catch (err) {
      console.error('Error adding favorite to Supabase:', err);
    }
  };

  const removeFavorite = async (mal_id: number) => {
    setFavorites((prev) => {
      const updated = prev.filter((item) => item.mal_id !== mal_id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('anime_id', mal_id);
      }
    } catch (err) {
      console.error('Error removing favorite from Supabase:', err);
    }
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
