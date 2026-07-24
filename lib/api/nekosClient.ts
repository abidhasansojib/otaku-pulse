import { getAnimeWallpapers, WallpaperItem } from './wallpapers';

export interface NekosImage {
  id: number | string;
  title?: string;
  url: string;
  thumbnail_url?: string;
  rating: 'safe' | 'suggestive';
  type?: 'banner' | 'poster' | 'artwork' | 'gif';
  artist_name?: string | null;
  artist_href?: string | null;
  dimensions?: string;
  tags?: string[];
  anime_id?: number;
  source_url?: string | null;
}

export const NEKOS_IMAGE_CATEGORIES = ['waifu', 'neko', 'kitsune', 'husbando'] as const;
export const NEKOS_GIF_CATEGORIES = ['dance', 'hug', 'kiss', 'pat', 'smile', 'smug', 'wink', 'happy', 'cuddle'] as const;

export async function fetchNekosWallpapers(
  queryOrCategory: string = 'waifu',
  limit: number = 20
): Promise<NekosImage[]> {
  const wallpapers = await getAnimeWallpapers(queryOrCategory, limit);

  return wallpapers.map((w, idx) => ({
    id: w.id || `wallpaper-${idx}`,
    title: w.tags?.[0] ? `${w.tags[0].toUpperCase()} HD Anime Wallpaper` : `HD Anime Artwork #${idx + 1}`,
    url: w.url,
    thumbnail_url: w.url,
    rating: 'safe',
    type: 'artwork',
    artist_name: 'Waifu.im Artist',
    artist_href: w.source || null,
    dimensions: w.width && w.height ? `${w.width}x${w.height}` : 'HD 1080p',
    tags: w.tags || ['Anime', 'Wallpaper'],
    source_url: w.source || null,
  }));
}
