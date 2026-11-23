// Normalised, UI-oriented TMDB shapes returned by the server routes. Components never see raw TMDB responses.
import type { TmdbMediaType } from './tmdb-mapping'

interface MetadataBase {
  tmdbId: number
  title: string
  originalTitle: string | null
  tagline: string | null
  overview: string | null
  genres: string[]
  status: string | null
  /** Raw TMDB image paths; build URLs with tmdbImageUrl(). */
  posterPath: string | null
  backdropPath: string | null
  posterUrl: string | null
  backdropUrl: string | null
}

export interface MovieMetadata extends MetadataBase {
  mediaType: 'movie'
  releaseDate: string | null
  runtimeMinutes: number | null
}

export interface TvSeasonSummary {
  seasonNumber: number
  name: string | null
  overview: string | null
  airDate: string | null
  episodeCount: number | null
  posterUrl: string | null
}

export interface TvMetadata extends MetadataBase {
  mediaType: 'tv'
  firstAirDate: string | null
  lastAirDate: string | null
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
  episodeRuntimeMinutes: number[]
  seasons: TvSeasonSummary[]
  /** The season this project title represents, when the mapping names one and TMDB lists it. */
  season: TvSeasonSummary | null
}

export type TitleMetadata = MovieMetadata | TvMetadata

export interface CastMember {
  personId: number
  name: string
  character: string | null
  profileUrl: string | null
  order: number
}

export interface CrewMember {
  personId: number
  name: string
  job: string
  department: string | null
  profileUrl: string | null
}

export interface TitleCredits {
  cast: CastMember[]
  crew: CrewMember[]
}

export interface TvEpisode {
  episodeNumber: number
  name: string
  airDate: string | null
  runtimeMinutes: number | null
  overview: string | null
  stillUrl: string | null
}

/** One season of a show, for the episode list. */
export interface TitleEpisodes {
  seasonNumber: number
  name: string | null
  episodes: TvEpisode[]
}

export interface TitleVideo {
  key: string
  name: string
  type: string
  official: boolean
  publishedAt: string | null
  /** Only YouTube is supported for embedding. */
  site: 'YouTube'
}

export interface TitleVideos {
  videos: TitleVideo[]
  /** Best embeddable trailer, or null when none is usable. */
  trailer: TitleVideo | null
}

export interface ProviderOffer {
  providerId: number
  name: string
  logoUrl: string | null
  displayPriority: number | null
}

export interface TitleProviders {
  region: string
  /** TMDB's region page for this title (attribution link); TMDB supplies no per-provider deep links. */
  link: string | null
  flatrate: ProviderOffer[]
  free: ProviderOffer[]
  ads: ProviderOffer[]
  rent: ProviderOffer[]
  buy: ProviderOffer[]
  /** True when at least one offer exists in the region. */
  available: boolean
}

export type ApiErrorCode =
  | 'invalid_title_id'
  | 'invalid_region'
  | 'invalid_season'
  | 'title_not_found'
  | 'tmdb_not_mapped'
  | 'credentials_missing'
  | 'credentials_invalid'
  | 'tmdb_not_found'
  | 'rate_limited'
  | 'upstream_error'
  | 'network_error'
  | 'malformed_response'

export interface ApiErrorBody {
  code: ApiErrorCode
  message: string
}

/** Failure envelope for every /api/titles route (sent with a matching HTTP status). */
export interface ApiErrorResponse {
  error: ApiErrorBody
}

/** Success envelope for every /api/titles route. */
export interface TitleResponse<T> {
  titleId: string
  mediaType: TmdbMediaType
  data: T
}
