'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { AnimeItem } from '../types/anime';
import { createClient } from '../supabase/client';

const STORAGE_KEY = 'anidex_favorites';

interface FavoritesContextType {
  favorites: AnimeItem[];
  isLoaded: boolean;
  addFavorite: (anime: AnimeItem) => Promise<void>;
  removeFavorite: (mal_id: number) => Promise<void>;
  isFavorite: (mal_id: number) => boolean;
  toggleFavorite: (anime: AnimeItem) => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  isLoaded: false,
  addFavorite: async () => {},
  removeFavorite: async () => {},
  isFavorite: () => false,
  toggleFavorite: () => {},
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<AnimeItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);

  const saveToLocalStorage = useCallback((items: AnimeItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('QuotaExceededError or Storage access error:', e);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
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

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    } finally {
      setIsLoaded(true);
    }
  }, [supabase]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const addFavorite = useCallback(
    async (anime: AnimeItem) => {
      setFavorites((prev) => {
        if (prev.some((item) => item.mal_id === anime.mal_id)) return prev;
        const updated = [anime, ...prev];
        saveToLocalStorage(updated);
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
    },
    [supabase, saveToLocalStorage]
  );

  const removeFavorite = useCallback(
    async (mal_id: number) => {
      setFavorites((prev) => {
        const updated = prev.filter((item) => item.mal_id !== mal_id);
        saveToLocalStorage(updated);
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
    },
    [supabase, saveToLocalStorage]
  );

  const isFavorite = useCallback(
    (mal_id: number) => {
      return favorites.some((item) => item.mal_id === mal_id);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (anime: AnimeItem) => {
      if (isFavorite(anime.mal_id)) {
        removeFavorite(anime.mal_id);
      } else {
        addFavorite(anime);
      }
    },
    [isFavorite, removeFavorite, addFavorite]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoaded,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
