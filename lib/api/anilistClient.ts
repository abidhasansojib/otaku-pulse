import { AnimeItem, JikanResponse, AnimeFilterState } from '../types/anime';

const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

export const GENRE_NAME_TO_ID: Record<string, number> = {
  'action': 1,
  'adventure': 2,
  'racing': 3,
  'comedy': 4,
  'avant garde': 5,
  'mythology': 6,
  'mystery': 7,
  'drama': 8,
  'ecchi': 9,
  'fantasy': 10,
  'strategy game': 11,
  'historical': 13,
  'horror': 14,
  'kids': 15,
  'martial arts': 17,
  'mecha': 18,
  'music': 19,
  'parody': 20,
  'samurai': 21,
  'romance': 22,
  'school': 23,
  'sci-fi': 24,
  'shoujo': 25,
  'girls love': 26,
  'shounen': 27,
  'boys love': 28,
  'space': 29,
  'sports': 30,
  'super power': 31,
  'vampire': 32,
  'harem': 35,
  'slice of life': 36,
  'supernatural': 37,
  'military': 38,
  'detective': 39,
  'psychological': 40,
  'suspense': 41,
  'thriller': 41,
  'seinen': 42,
  'josei': 43,
};

export const GENRE_ID_TO_NAME: Record<string, string> = {
  '1': 'Action',
  '2': 'Adventure',
  '3': 'Racing',
  '4': 'Comedy',
  '5': 'Avant Garde',
  '6': 'Mythology',
  '7': 'Mystery',
  '8': 'Drama',
  '9': 'Ecchi',
  '10': 'Fantasy',
  '11': 'Strategy Game',
  '13': 'Historical',
  '14': 'Horror',
  '15': 'Kids',
  '17': 'Martial Arts',
  '18': 'Mecha',
  '19': 'Music',
  '20': 'Parody',
  '21': 'Samurai',
  '22': 'Romance',
  '23': 'School',
  '24': 'Sci-Fi',
  '25': 'Shoujo',
  '26': 'Girls Love',
  '27': 'Shounen',
  '28': 'Boys Love',
  '29': 'Space',
  '30': 'Sports',
  '31': 'Super Power',
  '32': 'Vampire',
  '35': 'Harem',
  '36': 'Slice of Life',
  '37': 'Supernatural',
  '38': 'Military',
  '39': 'Detective',
  '40': 'Psychological',
  '41': 'Thriller',
  '42': 'Seinen',
  '43': 'Josei',
};

export function resolveGenreId(genreInput: string): number | null {
  if (!genreInput || genreInput === 'all') return null;
  const numeric = parseInt(genreInput, 10);
  if (!isNaN(numeric) && numeric > 0) {
    return numeric;
  }
  const lower = genreInput.toLowerCase().trim();
  return GENRE_NAME_TO_ID[lower] || null;
}

export function resolveGenreName(genreInput: string): string | null {
  if (!genreInput || genreInput === 'all') return null;
  const numeric = parseInt(genreInput, 10);
  if (!isNaN(numeric) && numeric > 0) {
    return GENRE_ID_TO_NAME[numeric.toString()] || null;
  }
  return genreInput;
}

interface AniListMedia {
  id: number;
  idMal?: number;
  title: {
    english?: string;
    romaji?: string;
    native?: string;
  };
  coverImage: {
    extraLarge?: string;
    large?: string;
    medium?: string;
  };
  bannerImage?: string;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  description?: string;
  seasonYear?: number;
  season?: string;
  type?: string;
  format?: string;
  status?: string;
  episodes?: number;
  duration?: number;
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  favourites?: number;
  genres?: string[];
  studios?: {
    nodes: Array<{ id: number; name: string }>;
  };
  trailer?: {
    id?: string;
    site?: string;
    thumbnail?: string;
  };
  relations?: {
    edges: Array<{
      relationType: string;
      node: {
        id: number;
        idMal?: number;
        title: { english?: string; romaji?: string };
        format?: string;
      };
    }>;
  };
}

function mapAniListToAnimeItem(media: AniListMedia): AnimeItem {
  const mal_id = media.idMal || media.id;
  const score = media.averageScore ? media.averageScore / 10 : media.meanScore ? media.meanScore / 10 : null;
  const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || '/banner-placeholder.webp';
  const banner = media.bannerImage || media.trailer?.thumbnail || poster;

  const trailerEmbed = media.trailer?.site === 'youtube' && media.trailer?.id
    ? `https://www.youtube.com/embed/${media.trailer.id}`
    : undefined;

  const relations = media.relations?.edges?.map((edge) => ({
    relation: edge.relationType.replace(/_/g, ' '),
    entry: [
      {
        mal_id: edge.node.idMal || edge.node.id,
        type: 'anime',
        name: edge.node.title?.english || edge.node.title?.romaji || 'Related Title',
        url: `https://anilist.co/anime/${edge.node.id}`,
      },
    ],
  })) || [];

  return {
    mal_id,
    url: `https://anilist.co/anime/${media.id}`,
    title: media.title?.english || media.title?.romaji || media.title?.native || 'Untitled Anime',
    title_english: media.title?.english || null,
    title_japanese: media.title?.native || null,
    images: {
      jpg: {
        image_url: poster,
        large_image_url: poster,
        small_image_url: media.coverImage?.medium || poster,
      },
      webp: {
        image_url: poster,
        large_image_url: poster,
        small_image_url: media.coverImage?.medium || poster,
      },
    },
    trailer: {
      embed_url: trailerEmbed,
      youtube_id: media.trailer?.id,
      images: {
        maximum_image_url: banner,
      },
    },
    type: media.format || media.type || 'TV',
    episodes: media.episodes || null,
    duration: media.duration ? `${media.duration} mins per ep` : undefined,
    status: media.status === 'RELEASING' ? 'Currently Airing' : media.status === 'FINISHED' ? 'Finished Airing' : media.status || 'Finished',
    airing: media.status === 'RELEASING',
    score,
    rank: media.popularity ? Math.max(1, Math.floor(1000 - media.popularity / 100)) : null,
    popularity: media.popularity || null,
    favorites: media.favourites || null,
    synopsis: media.description ? media.description.replace(/<[^>]*>?/gm, '') : null,
    year: media.seasonYear || media.startDate?.year || null,
    season: media.season ? media.season.toLowerCase() : null,
    banner_url: banner,
    genres: media.genres ? media.genres.map((g, idx) => ({ mal_id: idx + 1, name: g, type: 'genre', url: '' })) : [],
    studios: media.studios?.nodes ? media.studios.nodes.map((s) => ({ mal_id: s.id, name: s.name, type: 'studio', url: '' })) : [],
    relations,
  };
}

// AniList GraphQL Fetch Wrapper
async function fetchAniListGraphQL<T>(query: string, variables: Record<string, any>): Promise<T | null> {
  try {
    const res = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    return null;
  }
}

// Direct Lookup by ID (Checking idMal and AniList ID)
export async function getAnimeByIdAniList(id: number | string): Promise<AnimeItem | null> {
  const numericId = typeof id === 'number' ? id : parseInt(id, 10);
  if (isNaN(numericId)) return null;

  const queryByMal = `
    query ($idMal: Int) {
      Media (idMal: $idMal, type: ANIME) {
        id
        idMal
        title { english romaji native }
        coverImage { extraLarge large medium }
        bannerImage
        startDate { year month day }
        description
        seasonYear
        season
        format
        status
        episodes
        duration
        averageScore
        popularity
        favourites
        genres
        studios { nodes { id name } }
        trailer { id site thumbnail }
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { english romaji }
              format
            }
          }
        }
      }
    }
  `;

  const queryByAniListId = `
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
        id
        idMal
        title { english romaji native }
        coverImage { extraLarge large medium }
        bannerImage
        startDate { year month day }
        description
        seasonYear
        season
        format
        status
        episodes
        duration
        averageScore
        popularity
        favourites
        genres
        studios { nodes { id name } }
        trailer { id site thumbnail }
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { english romaji }
              format
            }
          }
        }
      }
    }
  `;

  // 1. Query by MyAnimeList ID
  let data = await fetchAniListGraphQL<any>(queryByMal, { idMal: numericId });
  if (data?.Media) {
    return mapAniListToAnimeItem(data.Media);
  }

  // 2. Query by AniList Native ID
  data = await fetchAniListGraphQL<any>(queryByAniListId, { id: numericId });
  if (data?.Media) {
    return mapAniListToAnimeItem(data.Media);
  }

  return null;
}

// Dynamic Helper for System Date Season
export function getCurrentSeasonAndYear(): { season: 'winter' | 'spring' | 'summer' | 'fall'; year: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 to 11

  let season: 'winter' | 'spring' | 'summer' | 'fall';
  if (month >= 0 && month <= 2) season = 'winter';
  else if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else season = 'fall';

  return { season, year };
}

// Fast Search & Genre Filter via AniList
export async function searchAnimeAniList(
  filters: Partial<AnimeFilterState> | string,
  page = 1,
  perPage = 24
): Promise<AnimeItem[]> {
  let searchQuery = typeof filters === 'string' ? filters : filters.q || '';
  let genreInput = typeof filters === 'object' ? filters.genre : undefined;
  let genreName = genreInput ? resolveGenreName(genreInput) : null;

  const variables: Record<string, any> = { page, perPage };
  if (searchQuery && searchQuery.trim().length > 0) {
    variables.search = searchQuery.trim();
  }
  if (genreName) {
    variables.genre = genreName;
  }

  const hasSearch = !!variables.search;
  const hasGenre = !!variables.genre;

  const query = `
    query (${hasSearch ? '$search: String, ' : ''}${hasGenre ? '$genre: String, ' : ''}$page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        media (${hasSearch ? 'search: $search, ' : ''}${hasGenre ? 'genre: $genre, ' : ''}type: ANIME, sort: [POPULARITY_DESC]) {
          id
          idMal
          title { english romaji native }
          coverImage { extraLarge large medium }
          bannerImage
          startDate { year month day }
          description
          seasonYear
          season
          format
          status
          episodes
          averageScore
          popularity
          genres
          trailer { id site thumbnail }
        }
      }
    }
  `;

  const data = await fetchAniListGraphQL<any>(query, variables);
  const mediaList: AniListMedia[] = data?.Page?.media || [];
  return mediaList.map(mapAniListToAnimeItem);
}

// Fast Top Anime via AniList (Supports fetching 100-item batches dynamically by page)
export async function getTopAnimeAniList(
  sortType: 'SCORE_DESC' | 'POPULARITY_DESC' | 'TRENDING_DESC' = 'SCORE_DESC',
  perPage = 20,
  page = 1
): Promise<AnimeItem[]> {
  if (perPage > 50) {
    const page1Count = Math.min(50, perPage);
    const page2Count = Math.max(0, perPage - page1Count);

    const aniPage1 = (page - 1) * 2 + 1;
    const aniPage2 = (page - 1) * 2 + 2;

    const [res1, res2] = await Promise.all([
      getTopAnimeAniList(sortType, page1Count, aniPage1),
      page2Count > 0 ? getTopAnimeAniList(sortType, page2Count, aniPage2) : Promise.resolve([]),
    ]);

    return [...res1, ...res2];
  }

  const query = `
    query ($sort: [MediaSort], $page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        media (type: ANIME, sort: $sort) {
          id
          idMal
          title { english romaji native }
          coverImage { extraLarge large medium }
          bannerImage
          startDate { year month day }
          description
          seasonYear
          season
          format
          status
          episodes
          averageScore
          popularity
          genres
          trailer { id site thumbnail }
        }
      }
    }
  `;

  const data = await fetchAniListGraphQL<any>(query, { sort: [sortType], page, perPage });
  const mediaList: AniListMedia[] = data?.Page?.media || [];
  return mediaList.map(mapAniListToAnimeItem);
}

// Fast Seasonal Anime via AniList (Dynamic Season & Year)
export async function getCurrentSeasonAnimeAniList(
  season?: string,
  year?: number,
  perPage = 24,
  page = 1
): Promise<AnimeItem[]> {
  if (perPage > 50) {
    const page1Count = Math.min(50, perPage);
    const page2Count = Math.max(0, perPage - page1Count);

    const aniPage1 = (page - 1) * 2 + 1;
    const aniPage2 = (page - 1) * 2 + 2;

    const [res1, res2] = await Promise.all([
      getCurrentSeasonAnimeAniList(season, year, page1Count, aniPage1),
      page2Count > 0 ? getCurrentSeasonAnimeAniList(season, year, page2Count, aniPage2) : Promise.resolve([]),
    ]);

    return [...res1, ...res2];
  }

  const current = getCurrentSeasonAndYear();
  const targetSeason = (season || current.season).toUpperCase(); // e.g., "SUMMER"
  const targetYear = year || current.year; // e.g., 2026

  const query = `
    query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        media (type: ANIME, season: $season, seasonYear: $seasonYear, sort: [POPULARITY_DESC]) {
          id
          idMal
          title { english romaji native }
          coverImage { extraLarge large medium }
          bannerImage
          startDate { year month day }
          description
          seasonYear
          season
          format
          status
          episodes
          averageScore
          popularity
          genres
          trailer { id site thumbnail }
        }
      }
    }
  `;

  const data = await fetchAniListGraphQL<any>(query, {
    season: targetSeason,
    seasonYear: targetYear,
    page,
    perPage,
  });

  const mediaList: AniListMedia[] = data?.Page?.media || [];
  if (!mediaList || mediaList.length === 0) {
    return getTopAnimeAniList('TRENDING_DESC', perPage, page);
  }
  return mediaList.map(mapAniListToAnimeItem);
}
