import { describe, expect, it } from 'vitest'
import { tmdbImageUrl } from '../shared/utils/tmdb-image.ts'
import {
  normalizeMovie,
  normalizeMovieCredits,
  normalizeProviders,
  normalizeTv,
  normalizeTvCredits,
  normalizeVideos,
} from '../server/utils/tmdb/normalize.ts'
import {
  movieCreditsSchema,
  movieDetailsSchema,
  providersSchema,
  tvCreditsSchema,
  tvDetailsSchema,
  videosSchema,
} from '../server/utils/tmdb/schemas.ts'

// All data below is synthetic: it exercises shapes and missing fields, not real TMDB records.

describe('tmdbImageUrl', () => {
  it('builds URLs for safe paths and rejects anything else', () => {
    expect(tmdbImageUrl('/abc123.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg')
    expect(tmdbImageUrl(null, 'w500')).toBeNull()
    expect(tmdbImageUrl('', 'w500')).toBeNull()
    for (const bad of ['/../x.jpg', '//evil.example/x.jpg', 'x.jpg', '/a/b.jpg', '/x.jpg?y=1', 'javascript:alert(1)']) {
      expect(tmdbImageUrl(bad, 'w500')).toBeNull()
    }
  })
})

describe('normalizeMovie', () => {
  it('turns blank and missing fields into null and a missing runtime into null', () => {
    const m = normalizeMovie(
      movieDetailsSchema.parse({ id: 10, title: 'Fixture', tagline: '', overview: '  ', release_date: '', runtime: 0, poster_path: null }),
    )
    expect(m).toMatchObject({
      mediaType: 'movie',
      tmdbId: 10,
      title: 'Fixture',
      tagline: null,
      overview: null,
      releaseDate: null,
      runtimeMinutes: null,
      genres: [],
      posterUrl: null,
      backdropUrl: null,
    })
  })

  it('keeps real values and builds image URLs', () => {
    const m = normalizeMovie(
      movieDetailsSchema.parse({
        id: 10, title: 'A', release_date: '2000-01-02', runtime: 123, genres: [{ id: 1, name: 'Action' }],
        poster_path: '/p.jpg', backdrop_path: '/b.jpg',
      }),
    )
    expect(m).toMatchObject({ releaseDate: '2000-01-02', runtimeMinutes: 123, genres: ['Action'], posterUrl: 'https://image.tmdb.org/t/p/w500/p.jpg', backdropUrl: 'https://image.tmdb.org/t/p/w1280/b.jpg' })
  })
})

describe('normalizeTv', () => {
  const raw = tvDetailsSchema.parse({
    id: 20, name: 'Show', first_air_date: '2015-01-01', number_of_seasons: 2,
    seasons: [
      { season_number: 1, name: 'S1', air_date: '2015-01-01', episode_count: 13, poster_path: '/s1.jpg' },
      { season_number: 2, name: 'S2', air_date: '2016-03-18', episode_count: 13 },
    ],
  })

  it('selects the season a project title represents', () => {
    const t = normalizeTv(raw, 2)
    expect(t.season).toMatchObject({ seasonNumber: 2, airDate: '2016-03-18', episodeCount: 13, posterUrl: null })
    expect(t.seasons).toHaveLength(2)
  })

  it('leaves season null when none is requested or TMDB does not list it', () => {
    expect(normalizeTv(raw, null).season).toBeNull()
    expect(normalizeTv(raw, 9).season).toBeNull()
  })

  it('tolerates a show with no seasons or runtimes', () => {
    expect(normalizeTv(tvDetailsSchema.parse({ id: 1, name: 'X' }), 1)).toMatchObject({ seasons: [], season: null, episodeRuntimeMinutes: [], numberOfSeasons: null })
  })
})

describe('credits', () => {
  it('orders and limits cast, and keeps only key crew roles', () => {
    const cast = Array.from({ length: 30 }, (_, i) => ({ id: i, name: `P${i}`, character: i === 0 ? '' : `C${i}`, order: 29 - i, profile_path: i === 25 ? '/p.jpg' : null }))
    const c = normalizeMovieCredits(
      movieCreditsSchema.parse({
        cast,
        crew: [{ id: 1, name: 'D', job: 'Director', department: 'Directing' }, { id: 2, name: 'G', job: 'Gaffer' }, { id: 3, name: 'N' }],
      }),
    )
    expect(c.cast).toHaveLength(20)
    expect(c.cast[0]).toMatchObject({ name: 'P29', order: 0 })
    expect(c.cast.find((p) => p.name === 'P25')).toMatchObject({ profileUrl: 'https://image.tmdb.org/t/p/w185/p.jpg' })
    expect(c.crew).toEqual([{ personId: 1, name: 'D', job: 'Director', department: 'Directing', profileUrl: null }])
  })

  it('returns empty lists when TMDB has no credits', () => {
    expect(normalizeMovieCredits(movieCreditsSchema.parse({}))).toEqual({ cast: [], crew: [] })
    expect(normalizeTvCredits(tvCreditsSchema.parse({}))).toEqual({ cast: [], crew: [] })
  })

  it('reads aggregate TV credits', () => {
    const c = normalizeTvCredits(
      tvCreditsSchema.parse({
        cast: [{ id: 1, name: 'A', roles: [{ character: 'Hero' }, { character: 'Other' }], order: 0 }, { id: 2, name: 'B', order: 1 }],
        crew: [{ id: 3, name: 'C', jobs: [{ job: 'Gaffer' }, { job: 'Writer' }] }, { id: 4, name: 'D', jobs: [{ job: 'Gaffer' }] }],
      }),
    )
    expect(c.cast.map((p) => p.character)).toEqual(['Hero', null])
    expect(c.crew).toEqual([{ personId: 3, name: 'C', job: 'Writer', department: null, profileUrl: null }])
  })
})

describe('normalizeVideos', () => {
  const v = (over: object) => ({ key: 'abcDEF12345', name: 'V', site: 'YouTube', type: 'Trailer', official: true, published_at: '2020-01-01T00:00:00.000Z', ...over })

  it('keeps only embeddable YouTube trailers, teasers and clips', () => {
    const out = normalizeVideos(
      videosSchema.parse({
        results: [
          v({ key: 'vimeo1234567', site: 'Vimeo' }),
          v({ key: 'bad key!' }),
          v({ type: 'Featurette', key: 'feat1234567' }),
          v({ type: 'Teaser', key: 'teas1234567' }),
          v({ key: 'trai1234567' }),
        ],
      }),
    )
    expect(out.videos.map((x) => x.key)).toEqual(['trai1234567', 'teas1234567'])
    expect(out.trailer?.key).toBe('trai1234567')
  })

  it('prefers official, then newer, trailers', () => {
    const out = normalizeVideos(
      videosSchema.parse({
        results: [
          v({ key: 'unoff123456', official: false, published_at: '2022-01-01T00:00:00.000Z' }),
          v({ key: 'old12345678', published_at: '2019-01-01T00:00:00.000Z' }),
          v({ key: 'new12345678', published_at: '2021-01-01T00:00:00.000Z' }),
        ],
      }),
    )
    expect(out.videos.map((x) => x.key)).toEqual(['new12345678', 'old12345678', 'unoff123456'])
  })

  it('has no trailer when only teasers exist, or nothing at all', () => {
    expect(normalizeVideos(videosSchema.parse({ results: [v({ type: 'Teaser' })] })).trailer).toBeNull()
    expect(normalizeVideos(videosSchema.parse({ results: [] }))).toEqual({ videos: [], trailer: null })
  })
})

describe('normalizeProviders', () => {
  const offer = (id: number, name: string, priority: number | null) => ({ provider_id: id, provider_name: name, logo_path: '/l.png', display_priority: priority })
  const raw = providersSchema.parse({
    results: {
      IN: {
        link: 'https://www.themoviedb.org/movie/1/watch?locale=IN',
        flatrate: [offer(2, 'Beta', 5), offer(1, 'Alpha', 5), offer(3, 'Gamma', 1)],
        rent: [offer(4, 'Rentco', null)],
      },
      US: { link: 'http://evil.example/x', buy: [offer(9, 'Z', 1)] },
    },
  })

  it('separates offer categories and sorts by priority then name', () => {
    const p = normalizeProviders(raw, 'IN')
    expect(p.region).toBe('IN')
    expect(p.flatrate.map((o) => o.name)).toEqual(['Gamma', 'Alpha', 'Beta'])
    expect(p.rent.map((o) => o.name)).toEqual(['Rentco'])
    expect(p.free).toEqual([])
    expect(p.buy).toEqual([])
    expect(p.available).toBe(true)
    expect(p.link).toBe('https://www.themoviedb.org/movie/1/watch?locale=IN')
    expect(p.flatrate[0]!.logoUrl).toBe('https://image.tmdb.org/t/p/w92/l.png')
  })

  it('reports a region TMDB does not list as not available, without inventing offers', () => {
    expect(normalizeProviders(raw, 'FR')).toEqual({ region: 'FR', link: null, flatrate: [], free: [], ads: [], rent: [], buy: [], available: false })
  })

  it('drops a link that is not on TMDB over https', () => {
    expect(normalizeProviders(raw, 'US').link).toBeNull()
    expect(normalizeProviders(raw, 'US').buy).toHaveLength(1)
  })

  it('handles an empty results object', () => {
    expect(normalizeProviders(providersSchema.parse({ results: {} }), 'IN').available).toBe(false)
  })
})
