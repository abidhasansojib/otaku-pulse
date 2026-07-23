import { rateLimitedFetch } from './rateLimiter';
import { fetchAnimeBanner } from './kitsuClient';
import { searchAniListByGenre } from './anilistFallback';
import {
  searchAnimeAniList,
  getTopAnimeAniList,
  getCurrentSeasonAnimeAniList,
  getAnimeByIdAniList,
  getCurrentSeasonAndYear,
  resolveGenreId,
  resolveGenreName,
} from './anilistClient';
import { AnimeItem, JikanResponse, AnimeFilterState, AnimeGenre } from '../types/anime';

export { getCurrentSeasonAndYear, resolveGenreId, resolveGenreName };

const BASE_URL = 'https://api.jikan.moe/v4';

// Helper to deduplicate anime arrays by mal_id
export function deduplicateAnimeList(list: AnimeItem[]): AnimeItem[] {
  if (!list || !Array.isArray(list)) return [];
  const seen = new Set<number>();
  return list.filter((anime) => {
    if (!anime || !anime.mal_id || seen.has(anime.mal_id)) return false;
    seen.add(anime.mal_id);
    return true;
  });
}

export interface SeasonOption {
  year: number;
  season: 'winter' | 'spring' | 'summer' | 'fall';
  label: string;
  isCurrent?: boolean;
}

// Fetch Dynamic Seasons List from Jikan API & System Date
export async function fetchSeasonsList(): Promise<SeasonOption[]> {
  const current = getCurrentSeasonAndYear();

  try {
    const url = `${BASE_URL}/seasons`;
    const res = await rateLimitedFetch<JikanResponse<Array<{ year: number; seasons: string[] }>>>(url);
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      const options: SeasonOption[] = [];

      res.data.slice(0, 4).forEach((yItem) => {
        if (yItem?.seasons && Array.isArray(yItem.seasons)) {
          yItem.seasons.forEach((s) => {
            const sLower = s.toLowerCase() as 'winter' | 'spring' | 'summer' | 'fall';
            const isCurrent = yItem.year === current.year && sLower === current.season;
            const seasonCap = s.charAt(0).toUpperCase() + s.slice(1);
            options.push({
              year: yItem.year,
              season: sLower,
              label: `${seasonCap} ${yItem.year}${isCurrent ? ' (Current Season)' : ''}`,
              isCurrent,
            });
          });
        }
      });

      if (options.length > 0) {
        return options;
      }
    }
  } catch (e) {
    // Dynamic Fallback below
  }

  // Dynamic system date fallback
  const seasonsOrder: Array<'winter' | 'spring' | 'summer' | 'fall'> = ['winter', 'spring', 'summer', 'fall'];
  const options: SeasonOption[] = [];

  for (let y = current.year + 1; y >= current.year - 3; y--) {
    for (let i = 3; i >= 0; i--) {
      const s = seasonsOrder[i];
      const isCurrent = y === current.year && s === current.season;
      const seasonCap = s.charAt(0).toUpperCase() + s.slice(1);
      options.push({
        year: y,
        season: s,
        label: `${seasonCap} ${y}${isCurrent ? ' (Current Season)' : ''}`,
        isCurrent,
      });
    }
  }

  return options;
}

// Fetch Official Anime Genres (GET /genres/anime)
export async function getAnimeGenres(): Promise<AnimeGenre[]> {
  try {
    const url = `${BASE_URL}/genres/anime`;
    const res = await rateLimitedFetch<JikanResponse<AnimeGenre[]>>(url);
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (e) {
    // Fallback genres list
  }
  return [
    { mal_id: 1, name: 'Action', type: 'anime', url: '' },
    { mal_id: 2, name: 'Adventure', type: 'anime', url: '' },
    { mal_id: 4, name: 'Comedy', type: 'anime', url: '' },
    { mal_id: 8, name: 'Drama', type: 'anime', url: '' },
    { mal_id: 10, name: 'Fantasy', type: 'anime', url: '' },
    { mal_id: 14, name: 'Horror', type: 'anime', url: '' },
    { mal_id: 22, name: 'Romance', type: 'anime', url: '' },
    { mal_id: 24, name: 'Sci-Fi', type: 'anime', url: '' },
    { mal_id: 36, name: 'Slice of Life', type: 'anime', url: '' },
    { mal_id: 37, name: 'Supernatural', type: 'anime', url: '' },
    { mal_id: 41, name: 'Suspense', type: 'anime', url: '' },
  ];
}

// Fetch Anime Characters & Seiyuu (GET /anime/{id}/characters)
export interface CharacterMember {
  character: {
    mal_id: number;
    name: string;
    images?: { webp?: { image_url?: string }; jpg?: { image_url?: string } };
  };
  role: string; // "Main" or "Supporting"
  voice_actors: Array<{
    person: {
      mal_id: number;
      name: string;
      images?: { jpg?: { image_url?: string } };
    };
    language: string;
  }>;
}

export async function getAnimeCharacters(animeId: number): Promise<CharacterMember[]> {
  try {
    const url = `${BASE_URL}/anime/${animeId}/characters`;
    const res = await rateLimitedFetch<JikanResponse<CharacterMember[]>>(url);
    if (res?.data && Array.isArray(res.data)) {
      return res.data.slice(0, 10);
    }
  } catch (e) {
    // Silent catch
  }
  return [];
}

// Fetch Top Anime Rankings
export async function getTopAnime(
  type: 'bypopularity' | 'airing' | 'favorite' | 'rating' = 'rating',
  page = 1,
  limit = 20
): Promise<JikanResponse<AnimeItem[]>> {
  const sortMap = {
    rating: 'SCORE_DESC',
    bypopularity: 'POPULARITY_DESC',
    favorite: 'POPULARITY_DESC',
    airing: 'TRENDING_DESC',
  };

  try {
    const aniListResults = await getTopAnimeAniList(sortMap[type] as any, limit, page);
    if (aniListResults && aniListResults.length > 0) {
      return {
        data: deduplicateAnimeList(aniListResults),
        pagination: {
          last_visible_page: 5,
          has_next_page: true,
        },
      };
    }
  } catch (e) {
    // Silent fallback
  }

  try {
    let filterParam = '';
    if (type === 'bypopularity') filterParam = '&filter=bypopularity';
    else if (type === 'airing') filterParam = '&filter=airing';
    else if (type === 'favorite') filterParam = '&filter=favorite';

    const url = `${BASE_URL}/top/anime?page=${page}&limit=${limit}${filterParam}`;
    const response = await rateLimitedFetch<JikanResponse<AnimeItem[]>>(url);
    
    if (response && response.data && response.data.length > 0) {
      return {
        ...response,
        data: deduplicateAnimeList(response.data),
      };
    }
  } catch (err) {
    // Silent fallback
  }

  return {
    data: [],
    pagination: { last_visible_page: 1, has_next_page: false },
  };
}

// Fetch Seasonal Anime (GET /seasons/now or GET /seasons/{year}/{season})
export async function getSeasonalAnime(
  year?: number,
  season?: string,
  page = 1,
  limit = 24
): Promise<JikanResponse<AnimeItem[]>> {
  try {
    const url = year && season
      ? `${BASE_URL}/seasons/${year}/${season.toLowerCase()}?page=${page}&limit=${limit}`
      : `${BASE_URL}/seasons/now?page=${page}&limit=${limit}`;

    const response = await rateLimitedFetch<JikanResponse<AnimeItem[]>>(url);
    if (response && response.data && response.data.length > 0) {
      return {
        ...response,
        data: deduplicateAnimeList(response.data),
      };
    }
  } catch (e) {
    // AniList fallback
  }

  // Fast AniList fallback with dynamic season & year
  const aniListResults = await getCurrentSeasonAnimeAniList(season, year, limit, page);
  return {
    data: deduplicateAnimeList(aniListResults),
    pagination: { last_visible_page: 5, has_next_page: true },
  };
}

// Fetch Current Season Anime
export async function getCurrentSeasonAnime(limit = 20, page = 1): Promise<JikanResponse<AnimeItem[]>> {
  return getSeasonalAnime(undefined, undefined, page, limit);
}

// Fetch Hero Featured Anime
export async function getHeroFeaturedAnime(): Promise<AnimeItem[]> {
  try {
    const aniListResults = await getTopAnimeAniList('TRENDING_DESC', 7);
    if (aniListResults && aniListResults.length > 0) {
      return deduplicateAnimeList(aniListResults);
    }
  } catch (e) {
    // Fallback to Jikan
  }

  try {
    const res = await getCurrentSeasonAnime(10);
    const animeList = deduplicateAnimeList(res.data || []);

    const enhanced = await Promise.all(
      animeList.slice(0, 7).map(async (anime) => {
        let banner = anime.banner_url || 
                     anime.trailer?.images?.maximum_image_url || 
                     anime.trailer?.images?.large_image_url ||
                     anime.images?.webp?.large_image_url ||
                     anime.images?.jpg?.large_image_url;

        if (!banner || banner.includes('placeholder')) {
          const kitsuBanner = await fetchAnimeBanner(anime.title_english || anime.title);
          if (kitsuBanner) banner = kitsuBanner;
        }

        return {
          ...anime,
          banner_url: banner,
        };
      })
    );

    return deduplicateAnimeList(enhanced);
  } catch (err) {
    return [];
  }
}

// Fetch Detailed Anime Info
export async function getAnimeById(id: number | string): Promise<AnimeItem | null> {
  try {
    const aniListAnime = await getAnimeByIdAniList(id);
    if (aniListAnime) {
      if (!aniListAnime.banner_url || aniListAnime.banner_url.includes('placeholder')) {
        const kitsuBanner = await fetchAnimeBanner(aniListAnime.title_english || aniListAnime.title);
        if (kitsuBanner) aniListAnime.banner_url = kitsuBanner;
      }
      return aniListAnime;
    }
  } catch (e) {
    // Proceed to Jikan
  }

  try {
    const url = `${BASE_URL}/anime/${id}/full`;
    const res = await rateLimitedFetch<JikanResponse<AnimeItem>>(url);
    const anime = res.data;
    if (anime) {
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
    }
  } catch (err) {
    // Silent catch
  }

  return null;
}

// Search & Multi-Filter Anime (AniList + Jikan Multi-API with robust genre filtering)
export async function searchAnime(filters: Partial<AnimeFilterState>, page = 1, limit = 24): Promise<JikanResponse<AnimeItem[]>> {
  const genreId = filters.genre ? resolveGenreId(filters.genre) : null;
  const genreName = filters.genre ? resolveGenreName(filters.genre) : null;

  // 1. If filtering by genre, try AniList GraphQL first for fast sub-100ms response (bypassing Jikan 504 timeouts)
  if (genreName) {
    try {
      const aniListResults = await searchAnimeAniList(filters, page, limit);
      if (aniListResults && aniListResults.length > 0) {
        return {
          data: deduplicateAnimeList(aniListResults),
          pagination: {
            last_visible_page: 5,
            has_next_page: aniListResults.length >= limit,
          },
        };
      }
    } catch (e) {
      // Proceed to Jikan
    }
  }

  // 2. Try Jikan API search with parameters
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters.q && filters.q.trim().length > 0) params.append('q', filters.q.trim());
    if (genreId) params.append('genres', genreId.toString());
    if (filters.rating && filters.rating !== 'all') params.append('rating', filters.rating);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.orderBy) params.append('order_by', filters.orderBy);
    if (filters.sort) params.append('sort', filters.sort);

    const url = `${BASE_URL}/anime?${params.toString()}`;
    const response = await rateLimitedFetch<JikanResponse<AnimeItem[]>>(url);
    if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
      return {
        ...response,
        data: deduplicateAnimeList(response.data),
      };
    }
  } catch (err) {
    // Fallback below
  }

  // 3. Secondary AniList search fallback
  try {
    const aniListResults = await searchAnimeAniList(filters, page, limit);
    if (aniListResults && aniListResults.length > 0) {
      return {
        data: deduplicateAnimeList(aniListResults),
        pagination: {
          last_visible_page: 5,
          has_next_page: aniListResults.length >= limit,
        },
      };
    }
  } catch (e) {
    // Silent catch
  }

  const defaultAniList = await getTopAnimeAniList('POPULARITY_DESC', limit);
  return {
    data: deduplicateAnimeList(defaultAniList),
    pagination: {
      last_visible_page: 5,
      has_next_page: true,
    },
  };
}

// Dedicated Genre Search Function (GET /anime?genres={genreId})
export async function searchAnimeByGenre(genreId: number | string, page = 1, limit = 24): Promise<JikanResponse<AnimeItem[]>> {
  const numericId = resolveGenreId(genreId.toString());
  const genreName = resolveGenreName(genreId.toString());

  try {
    const jikanRes = await searchAnime({ genre: numericId ? numericId.toString() : genreId.toString(), orderBy: 'score', sort: 'desc' }, page, limit);
    if (jikanRes && jikanRes.data && jikanRes.data.length > 0) {
      return jikanRes;
    }
  } catch (err) {
    // Fail over to AniList GraphQL genre search
  }

  if (genreName) {
    const aniListResults = await searchAniListByGenre(genreName, page);
    if (aniListResults && aniListResults.length > 0) {
      return {
        data: deduplicateAnimeList(aniListResults),
        pagination: { last_visible_page: 5, has_next_page: aniListResults.length >= limit },
      };
    }
  }

  return { data: [], pagination: { last_visible_page: 1, has_next_page: false } };
}
