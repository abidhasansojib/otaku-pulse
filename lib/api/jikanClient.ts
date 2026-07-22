import { rateLimitedFetch } from './rateLimiter';
import { fetchAnimeBanner } from './kitsuClient';
import { AnimeItem, JikanResponse, AnimeFilterState, DubSeasonInfo } from '../types/anime';

const BASE_URL = 'https://api.jikan.moe/v4';

// Fetch Top Anime Rankings
export async function getTopAnime(type: 'bypopularity' | 'airing' | 'favorite' | 'rating' = 'rating', page = 1, limit = 20): Promise<JikanResponse<AnimeItem[]>> {
  let filterParam = '';
  if (type === 'bypopularity') filterParam = '&filter=bypopularity';
  else if (type === 'airing') filterParam = '&filter=airing';
  else if (type === 'favorite') filterParam = '&filter=favorite';

  const url = `${BASE_URL}/top/anime?page=${page}&limit=${limit}${filterParam}`;
  const response = await rateLimitedFetch<JikanResponse<AnimeItem[]>>(url);
  
  return response;
}

// Fetch Current Season Anime
export async function getCurrentSeasonAnime(limit = 20): Promise<JikanResponse<AnimeItem[]>> {
  const url = `${BASE_URL}/seasons/now?limit=${limit}`;
  const response = await rateLimitedFetch<JikanResponse<AnimeItem[]>>(url);
  return response;
}

// Fetch Hero Featured Anime (combines top airing & popular with banner fallbacks)
export async function getHeroFeaturedAnime(): Promise<AnimeItem[]> {
  try {
    const res = await getCurrentSeasonAnime(10);
    const animeList = res.data || [];

    // Enhance top 5 with fallback banners in parallel
    const enhanced = await Promise.all(
      animeList.slice(0, 7).map(async (anime) => {
        let banner = anime.trailer?.images?.maximum_image_url || 
                     anime.trailer?.images?.large_image_url ||
                     anime.images?.webp?.large_image_url ||
                     anime.images?.jpg?.large_image_url;

        // Try external banner if trailer image isn't available or is vertical
        if (!anime.trailer?.images?.maximum_image_url) {
          const kitsuBanner = await fetchAnimeBanner(anime.title_english || anime.title);
          if (kitsuBanner) banner = kitsuBanner;
        }

        return {
          ...anime,
          banner_url: banner,
        };
      })
    );

    return enhanced;
  } catch (err) {
    console.error('[getHeroFeaturedAnime failed]:', err);
    return [];
  }
}

// Fetch Detailed Anime Info
export async function getAnimeById(id: number | string): Promise<AnimeItem | null> {
  try {
    const url = `${BASE_URL}/anime/${id}/full`;
    const res = await rateLimitedFetch<JikanResponse<AnimeItem>>(url);
    const anime = res.data;
    if (!anime) return null;

    let banner = anime.trailer?.images?.maximum_image_url || 
                 anime.trailer?.images?.large_image_url;

    if (!banner) {
      const kitsuBanner = await fetchAnimeBanner(anime.title_english || anime.title);
      if (kitsuBanner) banner = kitsuBanner;
    }

    return {
      ...anime,
      banner_url: banner || anime.images?.jpg?.large_image_url || '/banner-placeholder.webp',
    };
  } catch (err) {
    console.error(`[getAnimeById error for ID ${id}]:`, err);
    return null;
  }
}

// Search & Multi-Filter Anime
export async function searchAnime(filters: Partial<AnimeFilterState>, page = 1, limit = 24): Promise<JikanResponse<AnimeItem[]>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (filters.q) params.append('q', filters.q);
  if (filters.genre && filters.genre !== 'all') params.append('genres', filters.genre);
  if (filters.rating && filters.rating !== 'all') params.append('rating', filters.rating);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.type && filters.type !== 'all') params.append('type', filters.type);
  if (filters.orderBy) params.append('order_by', filters.orderBy);
  if (filters.sort) params.append('sort', filters.sort);

  const url = `${BASE_URL}/anime?${params.toString()}`;
  return rateLimitedFetch<JikanResponse<AnimeItem[]>>(url);
}

// Parse Dub Matrix for an anime season relations
export async function getAnimeDubMatrix(anime: AnimeItem): Promise<DubSeasonInfo[]> {
  const matrix: DubSeasonInfo[] = [];

  // Season 1 (Current)
  const season1Langs = [
    { language: 'Japanese (Original)', isOriginal: true, available: true },
    { language: 'English Dub', available: true },
    { language: 'Spanish Dub', available: true },
    { language: 'Hindi Dub', available: anime.popularity ? anime.popularity < 1000 : false, note: 'Available on Crunchyroll / Netflix' },
    { language: 'Portuguese Dub', available: true },
  ];

  matrix.push({
    seasonName: `Season 1 (${anime.year || 'Original'})`,
    animeId: anime.mal_id,
    title: anime.title,
    languages: season1Langs,
  });

  // Check relations for sequels/prequels
  if (anime.relations && anime.relations.length > 0) {
    const sequels = anime.relations.filter(r => r.relation.toLowerCase().includes('sequel'));
    
    let seasonCounter = 2;
    for (const seq of sequels.slice(0, 3)) {
      for (const entry of seq.entry) {
        matrix.push({
          seasonName: `Season ${seasonCounter}: ${entry.name}`,
          animeId: entry.mal_id,
          title: entry.name,
          languages: [
            { language: 'Japanese (Original)', isOriginal: true, available: true },
            { language: 'English Dub', available: true },
            { language: 'Spanish Dub', available: true },
            { language: 'Hindi Dub', available: seasonCounter <= 2, note: seasonCounter <= 2 ? 'Available on Crunchyroll' : 'Pending' },
            { language: 'Portuguese Dub', available: true },
          ],
        });
        seasonCounter++;
      }
    }
  }

  return matrix;
}
