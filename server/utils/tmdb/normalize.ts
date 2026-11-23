// Pure functions: raw TMDB responses in, UI-oriented shapes out. Every optional field becomes null or [].
import type {
  CastMember,
  CrewMember,
  MovieMetadata,
  ProviderOffer,
  TitleCredits,
  TitleEpisodes,
  TitleProviders,
  TitleVideo,
  TitleVideos,
  TvMetadata,
  TvSeasonSummary,
} from '../../../shared/types/tmdb.ts'
import { tmdbImageUrl } from '../../../shared/utils/tmdb-image.ts'
import type { RawMovieCredits, RawMovieDetails, RawProviders, RawTvCredits, RawTvDetails, RawTvSeason, RawVideos } from './schemas.ts'

export const CAST_LIMIT = 20
const CREW_JOBS = new Set(['Director', 'Writer', 'Screenplay', 'Story', 'Creator'])
const VIDEO_TYPES = ['Trailer', 'Teaser', 'Clip'] as const
// YouTube video keys are 11 characters; accept a safe range so a format change does not drop every video.
const YOUTUBE_KEY = /^[A-Za-z0-9_-]{6,32}$/

/** TMDB sends "" for unknown dates and text; treat blank as missing. */
const blank = (s: string | null | undefined): string | null => (s && s.trim() ? s : null)

const profile = (path: string | null | undefined) => tmdbImageUrl(path, 'w185')

export function normalizeMovie(raw: RawMovieDetails): MovieMetadata {
  return {
    mediaType: 'movie',
    tmdbId: raw.id,
    title: blank(raw.title) ?? blank(raw.original_title) ?? '',
    originalTitle: blank(raw.original_title),
    tagline: blank(raw.tagline),
    overview: blank(raw.overview),
    genres: (raw.genres ?? []).map((g) => g.name),
    status: blank(raw.status),
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    posterUrl: tmdbImageUrl(raw.poster_path, 'w500'),
    backdropUrl: tmdbImageUrl(raw.backdrop_path, 'w1280'),
    releaseDate: blank(raw.release_date),
    runtimeMinutes: raw.runtime && raw.runtime > 0 ? raw.runtime : null,
  }
}

function normalizeSeason(raw: NonNullable<RawTvDetails['seasons']>[number]): TvSeasonSummary {
  return {
    seasonNumber: raw.season_number,
    name: blank(raw.name),
    overview: blank(raw.overview),
    airDate: blank(raw.air_date),
    episodeCount: raw.episode_count ?? null,
    posterUrl: tmdbImageUrl(raw.poster_path, 'w342'),
  }
}

/** `seasonNumber` is the season the project title represents, if any; it is looked up, never assumed. */
export function normalizeTv(raw: RawTvDetails, seasonNumber: number | null): TvMetadata {
  const seasons = (raw.seasons ?? []).map(normalizeSeason)
  return {
    mediaType: 'tv',
    tmdbId: raw.id,
    title: blank(raw.name) ?? blank(raw.original_name) ?? '',
    originalTitle: blank(raw.original_name),
    tagline: blank(raw.tagline),
    overview: blank(raw.overview),
    genres: (raw.genres ?? []).map((g) => g.name),
    status: blank(raw.status),
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    posterUrl: tmdbImageUrl(raw.poster_path, 'w500'),
    backdropUrl: tmdbImageUrl(raw.backdrop_path, 'w1280'),
    firstAirDate: blank(raw.first_air_date),
    lastAirDate: blank(raw.last_air_date),
    numberOfSeasons: raw.number_of_seasons ?? null,
    numberOfEpisodes: raw.number_of_episodes ?? null,
    episodeRuntimeMinutes: raw.episode_run_time ?? [],
    seasons,
    season: seasonNumber === null ? null : (seasons.find((s) => s.seasonNumber === seasonNumber) ?? null),
  }
}

const byOrder = (a: CastMember, b: CastMember) => a.order - b.order

export function normalizeMovieCredits(raw: RawMovieCredits): TitleCredits {
  const cast: CastMember[] = (raw.cast ?? [])
    .map((c) => ({
      personId: c.id,
      name: c.name,
      character: blank(c.character),
      profileUrl: profile(c.profile_path),
      order: c.order ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort(byOrder)
    .slice(0, CAST_LIMIT)
  const crew: CrewMember[] = (raw.crew ?? [])
    .filter((c) => c.job && CREW_JOBS.has(c.job))
    .map((c) => ({
      personId: c.id,
      name: c.name,
      job: c.job!,
      department: blank(c.department),
      profileUrl: profile(c.profile_path),
    }))
  return { cast, crew }
}

export function normalizeTvCredits(raw: RawTvCredits): TitleCredits {
  const cast: CastMember[] = (raw.cast ?? [])
    .map((c) => ({
      personId: c.id,
      name: c.name,
      character: blank(c.roles?.[0]?.character),
      profileUrl: profile(c.profile_path),
      order: c.order ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort(byOrder)
    .slice(0, CAST_LIMIT)
  const crew: CrewMember[] = (raw.crew ?? []).flatMap((c) => {
    const job = (c.jobs ?? []).map((j) => j.job).find((j): j is string => !!j && CREW_JOBS.has(j))
    return job
      ? [{ personId: c.id, name: c.name, job, department: blank(c.department), profileUrl: profile(c.profile_path) }]
      : []
  })
  return { cast, crew }
}

const typeRank = (type: string) => {
  const i = (VIDEO_TYPES as readonly string[]).indexOf(type)
  return i === -1 ? VIDEO_TYPES.length : i
}

/** Keeps only embeddable YouTube trailers/teasers/clips; `trailer` is the best official-first Trailer, or null. */
export function normalizeVideos(raw: RawVideos): TitleVideos {
  const videos: TitleVideo[] = raw.results
    .filter((v) => v.site === 'YouTube' && YOUTUBE_KEY.test(v.key) && v.type && (VIDEO_TYPES as readonly string[]).includes(v.type))
    .map((v) => ({
      key: v.key,
      name: blank(v.name) ?? v.type!,
      type: v.type!,
      official: v.official === true,
      publishedAt: blank(v.published_at),
      site: 'YouTube' as const,
    }))
    .sort(
      (a, b) =>
        typeRank(a.type) - typeRank(b.type) ||
        Number(b.official) - Number(a.official) ||
        (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
    )
  return { videos, trailer: videos.find((v) => v.type === 'Trailer') ?? null }
}

const toOffers = (list: NonNullable<RawProviders['results'][string]['flatrate']> | null | undefined): ProviderOffer[] =>
  (list ?? [])
    .map((o) => ({
      providerId: o.provider_id,
      name: o.provider_name,
      logoUrl: tmdbImageUrl(o.logo_path, 'w92'),
      displayPriority: o.display_priority ?? null,
    }))
    .sort((a, b) => (a.displayPriority ?? 9999) - (b.displayPriority ?? 9999) || a.name.localeCompare(b.name))

/** TMDB's region link is the only link it provides; accept it only on TMDB's own site. */
function safeProviderLink(link: string | null | undefined): string | null {
  if (!link) return null
  try {
    const url = new URL(link)
    return url.protocol === 'https:' && url.hostname === 'www.themoviedb.org' ? url.toString() : null
  } catch {
    return null
  }
}

/** Offers for one region. A region absent from the response means "not listed", never "unavailable everywhere". */
export function normalizeProviders(raw: RawProviders, region: string): TitleProviders {
  const r = raw.results[region]
  const flatrate = toOffers(r?.flatrate)
  const free = toOffers(r?.free)
  const ads = toOffers(r?.ads)
  const rent = toOffers(r?.rent)
  const buy = toOffers(r?.buy)
  return {
    region,
    link: safeProviderLink(r?.link),
    flatrate,
    free,
    ads,
    rent,
    buy,
    available: flatrate.length + free.length + ads.length + rent.length + buy.length > 0,
  }
}

export function normalizeSeasonEpisodes(raw: RawTvSeason): TitleEpisodes {
  return {
    seasonNumber: raw.season_number,
    name: blank(raw.name),
    episodes: (raw.episodes ?? [])
      .map((e) => ({
        episodeNumber: e.episode_number,
        name: blank(e.name) ?? `Episode ${e.episode_number}`,
        airDate: blank(e.air_date),
        runtimeMinutes: e.runtime && e.runtime > 0 ? e.runtime : null,
        overview: blank(e.overview),
        stillUrl: tmdbImageUrl(e.still_path, 'w300'),
      }))
      .sort((a, b) => a.episodeNumber - b.episodeNumber),
  }
}
