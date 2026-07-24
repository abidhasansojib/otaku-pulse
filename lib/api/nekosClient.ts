import { getRandomArtworks, searchArtworks, NekosBestResult } from './nekosBest';

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
  limit: number = 18
): Promise<NekosImage[]> {
  const query = queryOrCategory.toLowerCase().trim();
  const isImageCategory = NEKOS_IMAGE_CATEGORIES.includes(query as any);
  const isGifCategory = NEKOS_GIF_CATEGORIES.includes(query as any);

  let results: NekosBestResult[] = [];

  if (isImageCategory || isGifCategory) {
    results = await getRandomArtworks(query, limit);
  } else if (query) {
    results = await searchArtworks(query, 1, limit);
  } else {
    results = await getRandomArtworks('waifu', limit);
  }

  const mapped: NekosImage[] = results.map((item, idx) => {
    const dims = item.dimensions
      ? `${item.dimensions.width}x${item.dimensions.height}`
      : isGifCategory
      ? 'GIF'
      : 'HD Artwork';

    return {
      id: `nekosbest-${query}-${idx}-${Date.now()}`,
      title: item.artist_name ? `Artwork by ${item.artist_name}` : `${query.toUpperCase()} Anime Artwork #${idx + 1}`,
      url: item.url,
      thumbnail_url: item.url,
      rating: 'safe',
      type: isGifCategory ? 'gif' : 'artwork',
      artist_name: item.artist_name || 'Anime Artist',
      artist_href: item.artist_href || null,
      dimensions: dims,
      tags: [query, 'Anime', isGifCategory ? 'Animation' : 'Wallpaper'],
      source_url: item.source_url || item.artist_href || null,
    };
  });

  return mapped;
}
