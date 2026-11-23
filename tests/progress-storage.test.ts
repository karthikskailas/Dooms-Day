import { describe, expect, it } from 'vitest'
import {
  PROGRESS_BACKUP_KEY,
  PROGRESS_STORAGE_KEY,
  countWatched,
  createProgressStore,
  parseProgress,
  watchlistEntries,
  type StorageLike,
} from '../app/utils/progress-storage.ts'

/** In-memory Storage that can be told to fail. */
function fakeStorage() {
  const data = new Map<string, string>()
  const flags = { failWrites: false, failReads: false }
  const storage: StorageLike = {
    getItem: (k) => {
      if (flags.failReads) throw new Error('read blocked')
      return data.get(k) ?? null
    },
    setItem: (k, v) => {
      if (flags.failWrites) throw new Error('QuotaExceededError')
      data.set(k, v)
    },
  }
  return { storage, data, flags }
}

let tick = 0
const clock = () => new Date(Date.UTC(2026, 10, 21, 12, 0, tick++))
const newStore = (s: StorageLike | null) => createProgressStore(s, clock)
const ENTRY = (over: object = {}) => ({ titleId: 'marvel_001', watched: true, completedAt: '2026-01-01T00:00:00.000Z', addedToWatchlist: false, addedToWatchlistAt: null, notes: null, ...over })
const STORED = (titles: object, extra: object = {}) =>
  JSON.stringify({ version: 1, titles, preferences: { displayName: null }, updatedAt: '2026-01-01T00:00:00.000Z', ...extra })

describe('persistence across a refresh', () => {
  it('restores watched, watchlist, notes and name in a new store over the same storage', () => {
    const { storage } = fakeStorage()
    const first = newStore(storage)
    first.hydrate()
    first.setWatched('marvel_001', true)
    first.setWatchlist('marvel_002', true)
    first.setNotes('marvel_002', '  Rewatch before Doomsday  ')
    first.setDisplayName('  Nick ')

    const second = newStore(storage)
    const result = second.hydrate()
    expect(result.status).toBe('loaded')
    expect(second.state.titles.marvel_001).toMatchObject({ watched: true, addedToWatchlist: false })
    expect(second.state.titles.marvel_002).toMatchObject({ addedToWatchlist: true, notes: 'Rewatch before Doomsday' })
    expect(second.state.preferences.displayName).toBe('Nick')
  })

  it('writes under the versioned key', () => {
    const { storage, data } = fakeStorage()
    const s = newStore(storage)
    s.hydrate()
    s.setWatched('marvel_001', true)
    expect(JSON.parse(data.get(PROGRESS_STORAGE_KEY)!).version).toBe(1)
    expect(PROGRESS_STORAGE_KEY).toBe('marvel-roadmap:v1')
  })

  it('does not write anything just by hydrating empty storage', () => {
    const { storage, data } = fakeStorage()
    const s = newStore(storage)
    expect(s.hydrate()).toMatchObject({ status: 'empty', dropped: 0 })
    expect(data.size).toBe(0)
  })
})

describe('watched and watchlist rules', () => {
  it('sets a completion date when watched and clears it when unwatched', () => {
    const s = newStore(fakeStorage().storage)
    s.hydrate()
    const watched = s.setWatched('marvel_001', true).titles.marvel_001!
    expect(watched.completedAt).toMatch(/^2026-11-21T12:00:/)
    expect(s.setWatched('marvel_001', false).titles.marvel_001).toBeUndefined()
  })

  it('keeps the original completion date if marked watched twice', () => {
    const s = newStore(fakeStorage().storage)
    s.hydrate()
    const first = s.setWatched('marvel_001', true).titles.marvel_001!.completedAt
    expect(s.setWatched('marvel_001', true).titles.marvel_001!.completedAt).toBe(first)
  })

  it('keeps watched and watchlist independent, and prunes entries with nothing set', () => {
    const s = newStore(fakeStorage().storage)
    s.hydrate()
    s.setWatchlist('marvel_001', true)
    s.setWatched('marvel_001', true)
    s.setWatchlist('marvel_001', false)
    expect(s.state.titles.marvel_001).toMatchObject({ watched: true, addedToWatchlist: false, addedToWatchlistAt: null })
    s.setWatched('marvel_001', false)
    expect(s.state.titles).toEqual({})
  })

  it('does not mutate a previously returned state', () => {
    const s = newStore(fakeStorage().storage)
    s.hydrate()
    const before = s.state
    s.setWatched('marvel_001', true)
    expect(before.titles).toEqual({})
  })

  it('caps notes and names, and treats blank as cleared', () => {
    const s = newStore(fakeStorage().storage)
    s.hydrate()
    expect(s.setNotes('marvel_001', 'x'.repeat(5000)).titles.marvel_001!.notes).toHaveLength(2000)
    expect(s.setNotes('marvel_001', '   ').titles.marvel_001).toBeUndefined()
    expect(s.setDisplayName('y'.repeat(100)).preferences.displayName).toHaveLength(60)
    expect(s.setDisplayName('  ').preferences.displayName).toBeNull()
  })

  it('rejects an invalid title id', () => {
    const s = newStore(null)
    expect(() => s.setWatched('../x', true)).toThrow(/Invalid title id/)
  })

  it('counts watched titles and lists the watchlist oldest first', () => {
    const s = newStore(fakeStorage().storage)
    s.hydrate()
    s.setWatched('marvel_001', true)
    s.setWatchlist('marvel_003', true)
    s.setWatchlist('marvel_002', true)
    expect(countWatched(s.state, ['marvel_001', 'marvel_002', 'marvel_009'])).toBe(1)
    expect(watchlistEntries(s.state).map((e) => e.titleId)).toEqual(['marvel_003', 'marvel_002'])
  })
})

describe('invalid and outdated stored data', () => {
  it('falls back to empty and keeps a backup when the JSON is corrupt', () => {
    const { storage, data } = fakeStorage()
    data.set(PROGRESS_STORAGE_KEY, '{not json')
    const s = newStore(storage)
    expect(s.hydrate().status).toBe('unusable')
    expect(s.state.titles).toEqual({})
    expect(data.get(PROGRESS_BACKUP_KEY)).toBe('{not json')
    s.setWatched('marvel_001', true)
    expect(data.get(PROGRESS_BACKUP_KEY)).toBe('{not json')
  })

  it('treats an unknown version as unusable but backs it up', () => {
    const { storage, data } = fakeStorage()
    const future = JSON.stringify({ version: 2, titles: {}, updatedAt: '2026-01-01T00:00:00.000Z' })
    data.set(PROGRESS_STORAGE_KEY, future)
    const s = newStore(storage)
    expect(s.hydrate().status).toBe('unusable')
    expect(data.get(PROGRESS_BACKUP_KEY)).toBe(future)
  })

  it('keeps valid entries and drops invalid ones, counting them', () => {
    const { storage, data } = fakeStorage()
    const raw = STORED({
      marvel_001: ENTRY(),
      marvel_002: ENTRY({ titleId: 'marvel_002', watched: true, completedAt: null }),
      marvel_003: ENTRY({ titleId: 'marvel_999' }),
      marvel_004: ENTRY({ titleId: 'marvel_004', watched: false, completedAt: '2026-01-01T00:00:00.000Z' }),
      marvel_005: 'nonsense',
      marvel_006: ENTRY({ titleId: 'marvel_006', completedAt: 'yesterday' }),
      marvel_007: ENTRY({ titleId: 'marvel_007', notes: 'x'.repeat(2001) }),
    })
    data.set(PROGRESS_STORAGE_KEY, raw)
    const s = newStore(storage)
    const r = s.hydrate()
    expect(r).toMatchObject({ status: 'recovered', dropped: 6 })
    expect(Object.keys(s.state.titles)).toEqual(['marvel_001'])
    expect(data.get(PROGRESS_BACKUP_KEY)).toBe(raw)
  })

  it('resets invalid preferences without losing titles', () => {
    const r = parseProgress(STORED({ marvel_001: ENTRY() }, { preferences: { displayName: 42 } }))
    expect(r.status).toBe('recovered')
    expect(r.state.preferences.displayName).toBeNull()
    expect(Object.keys(r.state.titles)).toEqual(['marvel_001'])
  })

  it('rejects non-objects and missing fields without throwing', () => {
    for (const bad of ['null', '42', '[]', '"x"', '{}', JSON.stringify({ version: 1 }), JSON.stringify({ version: 1, titles: {}, updatedAt: 'x' })]) {
      expect(parseProgress(bad).status).toBe('unusable')
    }
  })
})

describe('storage that is missing or failing', () => {
  it('works in memory with no storage (server render)', () => {
    const s = newStore(null)
    expect(s.hydrate().status).toBe('empty')
    s.setWatched('marvel_001', true)
    expect(s.state.titles.marvel_001!.watched).toBe(true)
    expect(s.persistError).toBeNull()
  })

  it('keeps changes in memory and reports an error when writes fail, then recovers', () => {
    const { storage, flags, data } = fakeStorage()
    const s = newStore(storage)
    s.hydrate()
    flags.failWrites = true
    s.setWatched('marvel_001', true)
    expect(s.state.titles.marvel_001!.watched).toBe(true)
    expect(s.persistError).toMatch(/Quota/)
    expect(data.has(PROGRESS_STORAGE_KEY)).toBe(false)
    flags.failWrites = false
    s.setWatched('marvel_002', true)
    expect(s.persistError).toBeNull()
    expect(JSON.parse(data.get(PROGRESS_STORAGE_KEY)!).titles).toHaveProperty('marvel_001')
  })

  it('starts empty if reading storage throws', () => {
    const { storage, flags } = fakeStorage()
    flags.failReads = true
    const s = newStore(storage)
    expect(s.hydrate().status).toBe('empty')
    expect(() => s.setWatched('marvel_001', true)).not.toThrow()
  })
})

describe('watched episodes', () => {
  it('stores, sorts, dedupes and removes episode keys, and survives a reload', () => {
    const { storage } = fakeStorage()
    const s = newStore(storage)
    s.hydrate()
    s.setEpisodeWatched('marvel_048', 1002, true)
    s.setEpisodeWatched('marvel_048', 1001, true)
    s.setEpisodeWatched('marvel_048', 1001, true)
    expect(s.state.episodes.marvel_048).toEqual([1001, 1002])
    const again = newStore(storage)
    again.hydrate()
    expect(again.state.episodes.marvel_048).toEqual([1001, 1002])
    again.setEpisodeWatched('marvel_048', 1001, false)
    again.setEpisodeWatched('marvel_048', 1002, false)
    expect(again.state.episodes).toEqual({})
  })

  it('loads old saves without an episodes field and drops bad episode data', () => {
    const { storage, data } = fakeStorage()
    data.set(PROGRESS_STORAGE_KEY, STORED({}))
    const s = newStore(storage)
    expect(s.hydrate().status).toBe('loaded')
    expect(s.state.episodes).toEqual({})
    const b = fakeStorage()
    b.data.set(PROGRESS_STORAGE_KEY, STORED({}, { episodes: { marvel_048: [1, 'x', -3, 2.5, 1], BAD: [1] } }))
    const bad = newStore(b.storage)
    bad.hydrate()
    expect(bad.state.episodes).toEqual({ marvel_048: [1] })
  })
})

describe('reset', () => {
  it('clears titles and episodes but keeps the display name', () => {
    const s = newStore(fakeStorage().storage)
    s.hydrate()
    s.setWatched('marvel_001', true)
    s.setEpisodeWatched('marvel_048', 1001, true)
    s.setDisplayName('Nick')
    s.resetWatched()
    expect(s.state.titles).toEqual({})
    expect(s.state.episodes).toEqual({})
    expect(s.state.preferences.displayName).toBe('Nick')
  })
})
