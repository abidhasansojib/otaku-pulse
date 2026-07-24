export interface NekosBestResult {
  artist_name: string;
  artist_href: string;
  source_url: string;
  url: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

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

const NEKOS_BEST_BASE_URL = 'https://nekos.best/api/v2';
export const NEKOS_IMAGE_CATEGORIES = ['waifu', 'neko', 'kitsune', 'husbando'] as const;
export const NEKOS_GIF_CATEGORIES = ['dance', 'hug', 'kiss', 'pat', 'smile', 'smug', 'wink', 'happy', 'cuddle'] as const;

/**
 * Fetch Anime Wallpapers using official https://docs.nekos.best API
 * Endpoints: GET /api/v2/{category}?amount={1..20}
 * Search: GET /api/v2/search?query={query}&type=1&amount={1..20}
 */
export async function fetchNekosWallpapers(
  queryOrCategory: string = 'waifu',
  limit: number = 20
): Promise<NekosImage[]> {
  const wallpapers: NekosImage[] = [];
  const query = queryOrCategory.toLowerCase().trim();
  const maxAmount = Math.min(20, Math.max(1, limit));

  const isImageCategory = NEKOS_IMAGE_CATEGORIES.includes(query as any);
  const isGifCategory = NEKOS_GIF_CATEGORIES.includes(query as any);

  try {
    if (isImageCategory || isGifCategory) {
      // 1. Direct Category Endpoint: GET /api/v2/{category}?amount={1..20}
      const res = await fetch(`${NEKOS_BEST_BASE_URL}/${query}?amount=${maxAmount}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.results && Array.isArray(json.results)) {
          json.results.forEach((item: NekosBestResult, idx: number) => {
            const dims = item.dimensions ? `${item.dimensions.width} x ${item.dimensions.height} HD` : 'High Res';
            wallpapers.push({
              id: `nekosbest-${query}-${idx}-${Date.now()}`,
              title: `${query.toUpperCase()} Anime Artwork #${idx + 1}`,
              url: item.url,
              thumbnail_url: item.url,
              rating: 'safe',
              type: isGifCategory ? 'gif' : 'artwork',
              artist_name: item.artist_name || 'Pixiv Anime Artist',
              artist_href: item.artist_href || null,
              dimensions: dims,
              tags: [query, 'Anime', isGifCategory ? 'Animation' : 'Wallpaper'],
              source_url: item.source_url || item.artist_href || null,
            });
          });
        }
      }
    } else {
      // 2. Search Endpoint: GET /api/v2/search?query={query}&type=1&amount={1..20}
      const searchRes = await fetch(
        `${NEKOS_BEST_BASE_URL}/search?query=${encodeURIComponent(query)}&type=1&amount=${maxAmount}`,
        { cache: 'no-store' }
      );
      if (searchRes.ok) {
        const json = await searchRes.json();
        if (json?.results && Array.isArray(json.results)) {
          json.results.forEach((item: NekosBestResult, idx: number) => {
            const dims = item.dimensions ? `${item.dimensions.width} x ${item.dimensions.height} HD` : 'High Res';
            wallpapers.push({
              id: `nekosbest-search-${idx}-${Date.now()}`,
              title: `${query.toUpperCase()} Anime Artwork #${idx + 1}`,
              url: item.url,
              thumbnail_url: item.url,
              rating: 'safe',
              type: 'artwork',
              artist_name: item.artist_name || 'Anime Artist',
              artist_href: item.artist_href || null,
              dimensions: dims,
              tags: [query, 'Anime', 'Artwork'],
              source_url: item.source_url || item.artist_href || null,
            });
          });
        }
      }
    }
  } catch (err) {
    console.error('Failed to query nekos.best API:', err);
  }

  // 3. Supplement with AniList GraphQL official wallpapers if needed
  if (wallpapers.length < limit) {
    try {
      const queryGql = `
        query ($search: String, $perPage: Int) {
          Page(page: 1, perPage: $perPage) {
            media(${isImageCategory || isGifCategory ? '' : 'search: $search, '}type: ANIME, sort: [POPULARITY_DESC], isAdult: false) {
              id
              title { userPreferred english }
              bannerImage
              coverImage { extraLarge large }
              genres
              siteUrl
            }
          }
        }
      `;

      const resGql = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryGql,
          variables: {
            search: isImageCategory || isGifCategory ? undefined : query,
            perPage: limit - wallpapers.length,
          },
        }),
        next: { revalidate: 300 },
      });

      if (resGql.ok) {
        const jsonGql = await resGql.json();
        const mediaList = jsonGql?.data?.Page?.media;
        if (Array.isArray(mediaList)) {
          mediaList.forEach((item: any) => {
            const animeTitle = item.title?.english || item.title?.userPreferred || 'Anime';
            if (item.bannerImage) {
              wallpapers.push({
                id: `anilist-banner-${item.id}`,
                title: `${animeTitle} — Official HD Widescreen Banner`,
                url: item.bannerImage,
                thumbnail_url: item.bannerImage,
                rating: 'safe',
                type: 'banner',
                artist_name: 'Official Anime Studio',
                dimensions: '1920 x 1080 HD',
                tags: item.genres || ['Anime', 'Wallpaper'],
                anime_id: item.id,
                source_url: item.siteUrl,
              });
            }
          });
        }
      }
    } catch (e) {
      // Silent catch
    }
  }

  // Deduplicate wallpapers
  const seen = new Set<string>();
  return wallpapers.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
