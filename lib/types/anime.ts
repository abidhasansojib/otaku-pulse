export interface AnimeImageUrls {
  image_url: string;
  small_image_url?: string;
  large_image_url?: string;
}

export interface AnimeImages {
  jpg: AnimeImageUrls;
  webp?: AnimeImageUrls;
}

export interface AnimeTrailer {
  youtube_id?: string;
  url?: string;
  embed_url?: string;
  images?: {
    image_url?: string;
    small_image_url?: string;
    medium_image_url?: string;
    large_image_url?: string;
    maximum_image_url?: string;
  };
}

export interface AnimeTitle {
  type: string;
  title: string;
}

export interface AnimeGenre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface AnimeStudio {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface AnimeRelationEntry {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface AnimeRelation {
  relation: string;
  entry: AnimeRelationEntry[];
}

export interface AnimeExternalLink {
  name: string;
  url: string;
}

export interface AnimeItem {
  mal_id: number;
  url: string;
  images: AnimeImages;
  trailer?: AnimeTrailer;
  approved?: boolean;
  titles?: AnimeTitle[];
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  title_synonyms?: string[];
  type?: string;
  source?: string;
  episodes?: number | null;
  status?: string;
  airing?: boolean;
  aired?: {
    from?: string;
    to?: string;
    string?: string;
  };
  duration?: string;
  rating?: string;
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  members?: number | null;
  favorites?: number | null;
  synopsis?: string | null;
  background?: string | null;
  season?: string | null;
  year?: number | null;
  studios?: AnimeStudio[];
  genres?: AnimeGenre[];
  explicit_genres?: AnimeGenre[];
  themes?: AnimeGenre[];
  demographics?: AnimeGenre[];
  relations?: AnimeRelation[];
  external?: AnimeExternalLink[];
  streaming?: AnimeExternalLink[];
  licensors?: AnimeExternalLink[];
  producers?: AnimeExternalLink[];
  // Ongoing Airing Episode tracking metadata
  current_aired_episodes?: number | null;
  nextAiringEpisode?: {
    episode: number;
    timeUntilAiring?: number;
  } | null;
  // Enhanced Banner fallback URL computed at runtime
  banner_url?: string;
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page?: number;
  items?: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface JikanResponse<T> {
  data: T;
  pagination?: JikanPagination;
}

export interface LanguageAvailability {
  language: string;
  isOriginal?: boolean;
  available: boolean;
  note?: string;
}

export interface DubSeasonInfo {
  seasonName: string;
  animeId: number;
  title: string;
  languages: LanguageAvailability[];
}

export interface AnimeFilterState {
  q: string;
  genre: string;
  rating: string;
  status: string;
  year: string;
  dubOnly: boolean;
  type: string;
  orderBy: string;
  sort: 'asc' | 'desc';
}
