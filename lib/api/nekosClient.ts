export interface NekosImage {
  id: number | string;
  title?: string;
  url: string;
  thumbnail_url?: string;
  rating: 'safe' | 'suggestive' | 'erotica' | 'borderline' | string;
  type?: 'banner' | 'poster' | 'artwork';
  artist_name?: string | null;
  artist_href?: string | null;
  tags?: string[];
  anime_id?: number;
  source_url?: string | null;
}

const NEKOS_BEST_BASE_URL = 'https://nekos.best/api/v2';
export const NEKOS_CATEGORIES = ['neko', 'waifu', 'kitsune', 'husbando'] as const;

/**
 * Fetch Anime Wallpapers & Artworks using official https://docs.nekos.best API + AniList GraphQL
 */
export async function fetchNekosWallpapers(
  categoryOrQuery: string = 'waifu',
  limit: number = 24,
  page: number = 1
): Promise<NekosImage[]> {
  const wallpapers: NekosImage[] = [];
  const normalizedQuery = categoryOrQuery.toLowerCase().trim();

  // 1. Check if query matches a nekos.best category (neko, waifu, kitsune, husbando)
  const isNekosCategory = NEKOS_CATEGORIES.includes(normalizedQuery as any);
  const targetCategory = isNekosCategory ? normalizedQuery : 'waifu';

  try {
    const nekosRes = await fetch(`${NEKOS_BEST_BASE_URL}/${targetCategory}?amount=${limit}`, {
      cache: 'no-store',
    });

    if (nekosRes.ok) {
      const data = await nekosRes.json();
      if (data?.results && Array.isArray(data.results)) {
        data.results.forEach((item: any, idx: number) => {
          if (item.url) {
            wallpapers.push({
              id: `nekosbest-${targetCategory}-${idx}-${Date.now()}`,
              title: `${targetCategory.toUpperCase()} HD Anime Wallpaper #${idx + 1}`,
              url: item.url,
              thumbnail_url: item.url,
              rating: 'safe',
              type: 'artwork',
              artist_name: item.artist_name || 'Pixiv Anime Artist',
              artist_href: item.artist_href || null,
              tags: [targetCategory, 'Anime', 'Wallpaper', 'HD Art'],
              source_url: item.source_url || item.artist_href || null,
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('Failed to fetch from nekos.best API:', err);
  }

  // 2. Fetch Official High-Res Anime Wallpapers & Key Visuals from AniList GraphQL
  try {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const isCustomSearch = !isNekosCategory && normalizedQuery.length > 0;

    const query = `
      query ($page: Int, $perPage: Int${isCustomSearch ? ', $search: String' : ''}) {
        Page(page: $page, perPage: $perPage) {
          media(${isCustomSearch ? 'search: $search, ' : ''}type: ANIME, sort: [POPULARITY_DESC, SCORE_DESC], isAdult: false) {
            id
            title {
              userPreferred
              english
            }
            bannerImage
            coverImage {
              extraLarge
              large
            }
            genres
            siteUrl
          }
        }
      }
    `;

    const variables: Record<string, any> = { page: randomPage, perPage: limit };
    if (isCustomSearch) {
      variables.search = normalizedQuery;
      variables.page = 1;
    }

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const json = await res.json();
      const mediaList = json?.data?.Page?.media;

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
              tags: item.genres || ['Anime', 'Wallpaper'],
              anime_id: item.id,
              source_url: item.siteUrl,
            });
          }

          if (item.coverImage?.extraLarge) {
            wallpapers.push({
              id: `anilist-cover-${item.id}`,
              title: `${animeTitle} — Official Key Visual Poster`,
              url: item.coverImage.extraLarge,
              thumbnail_url: item.coverImage.large || item.coverImage.extraLarge,
              rating: 'safe',
              type: 'poster',
              artist_name: 'Official Art',
              tags: item.genres || ['Anime', 'Poster'],
              anime_id: item.id,
              source_url: item.siteUrl,
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('Failed to fetch AniList GraphQL wallpapers:', err);
  }

  // Shuffle & Deduplicate wallpapers
  const seen = new Set<string>();
  const unique = wallpapers.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  return unique.sort(() => Math.random() - 0.5).slice(0, limit);
}
