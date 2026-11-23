// Versioned, SSR-safe LocalStorage persistence for personal viewing data.
// This is the only code that touches localStorage. Nothing here reads or writes the roadmap JSON.
import type { UserPreferences, UserProgressState, UserTitleProgress, UserWatchlistEntry } from '../../shared/types/progress.ts'

export const PROGRESS_STORAGE_KEY = 'marvel-roadmap:v1'
/** Receives the raw stored text when it cannot be used, so a bad value is never silently destroyed. */
export const PROGRESS_BACKUP_KEY = 'marvel-roadmap:v1:backup'

const NOTES_MAX = 2000
const NAME_MAX = 60
const TITLE_ID = /^[a-z][a-z0-9_]{0,63}$/
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

/** The slice of the Storage API used here, so tests can substitute a fake. */
export interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export type LoadStatus = 'empty' | 'loaded' | 'recovered' | 'unusable'

export interface LoadResult {
  state: UserProgressState
  /** empty: nothing stored. loaded: valid. recovered: some entries were dropped. unusable: whole value rejected. */
  status: LoadStatus
  /** Entries dropped as invalid. */
  dropped: number
}

export function emptyProgress(now: Date = new Date()): UserProgressState {
  return { version: 1, titles: {}, episodes: {}, preferences: { displayName: null }, updatedAt: now.toISOString() }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isIso = (v: unknown): v is string => typeof v === 'string' && ISO_DATE_TIME.test(v) && !Number.isNaN(Date.parse(v))
const isNullableString = (v: unknown, max: number): v is string | null => v === null || (typeof v === 'string' && v.length <= max)

/** A flag and its date must agree: true needs an ISO date, false needs null. `undefined` means invalid. */
function flagDate(flag: boolean, value: unknown): string | null | undefined {
  if (flag) return isIso(value) ? value : undefined
  return value === null ? null : undefined
}

/** An entry is valid only if its flags and dates agree: watched ⇔ completedAt, watchlisted ⇔ addedToWatchlistAt. */
function parseEntry(key: string, value: unknown): UserTitleProgress | null {
  if (!isRecord(value)) return null
  const { titleId, watched, addedToWatchlist, notes } = value
  if (titleId !== key || !TITLE_ID.test(key)) return null
  if (typeof watched !== 'boolean' || typeof addedToWatchlist !== 'boolean') return null
  const completedAt = flagDate(watched, value.completedAt)
  const addedToWatchlistAt = flagDate(addedToWatchlist, value.addedToWatchlistAt)
  if (completedAt === undefined || addedToWatchlistAt === undefined) return null
  if (!isNullableString(notes, NOTES_MAX)) return null
  return { titleId: key, watched, completedAt, addedToWatchlist, addedToWatchlistAt, notes }
}

/** Episode lists are best-effort: a bad entry is dropped, never the whole save. */
function parseEpisodes(value: unknown): Record<string, number[]> {
  const out: Record<string, number[]> = {}
  if (!isRecord(value)) return out
  for (const [id, list] of Object.entries(value)) {
    if (!TITLE_ID.test(id) || !Array.isArray(list)) continue
    const clean = [...new Set(list.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < 1_000_000))].sort((a, b) => a - b)
    if (clean.length) out[id] = clean
  }
  return out
}

function parsePreferences(value: unknown): UserPreferences | null {
  if (!isRecord(value) || !isNullableString(value.displayName, NAME_MAX)) return null
  return { displayName: value.displayName as string | null }
}

/** Parses stored text without throwing. Anything unusable falls back to empty progress and reports why. */
export function parseProgress(raw: string | null, now: Date = new Date()): LoadResult {
  if (raw === null) return { state: emptyProgress(now), status: 'empty', dropped: 0 }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { state: emptyProgress(now), status: 'unusable', dropped: 0 }
  }
  // ponytail: only v1 exists. To change the shape, bump `version` and add a migration step here before parsing.
  if (!isRecord(data) || data.version !== 1 || !isRecord(data.titles) || !isIso(data.updatedAt)) {
    return { state: emptyProgress(now), status: 'unusable', dropped: 0 }
  }

  const titles: Record<string, UserTitleProgress> = {}
  let dropped = 0
  for (const [key, value] of Object.entries(data.titles)) {
    const entry = parseEntry(key, value)
    if (entry) titles[key] = entry
    else dropped++
  }
  const preferences = parsePreferences(data.preferences)
  if (!preferences) dropped++

  return {
    state: { version: 1, titles, episodes: parseEpisodes(data.episodes), preferences: preferences ?? { displayName: null }, updatedAt: data.updatedAt },
    status: dropped > 0 ? 'recovered' : 'loaded',
    dropped,
  }
}

const isDefault = (e: UserTitleProgress) => !e.watched && !e.addedToWatchlist && e.notes === null

const assertTitleId = (id: string) => {
  if (!TITLE_ID.test(id)) throw new Error(`Invalid title id "${id}"`)
}

/**
 * A persisted progress store. Mutations return the new state, never edit the old one, and write through
 * to storage. A storage failure (quota, privacy mode) keeps the change in memory and sets `persistError`.
 * Pass null as storage on the server: everything works in memory and nothing is persisted.
 */
export function createProgressStore(storage: StorageLike | null, clock: () => Date = () => new Date()) {
  let state = emptyProgress(clock())
  let persistError: string | null = null

  const save = () => {
    if (!storage) return
    try {
      storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state))
      persistError = null
    } catch (err) {
      persistError = err instanceof Error ? err.message : 'Could not save progress.'
    }
  }

  const backUp = (raw: string) => {
    try {
      // Keep the first backup: it is the earliest evidence of whatever went wrong.
      if (storage && storage.getItem(PROGRESS_BACKUP_KEY) === null) storage.setItem(PROGRESS_BACKUP_KEY, raw)
    } catch {
      // Nothing more to do; the original value is still in place until the next save.
    }
  }

  const update = (titleId: string, change: (e: UserTitleProgress) => UserTitleProgress): UserProgressState => {
    assertTitleId(titleId)
    const now = clock().toISOString()
    const current = state.titles[titleId] ?? {
      titleId, watched: false, completedAt: null, addedToWatchlist: false, addedToWatchlistAt: null, notes: null,
    }
    const next = change(current)
    // An entry with nothing set is removed rather than stored.
    const titles = isDefault(next)
      ? Object.fromEntries(Object.entries(state.titles).filter(([id]) => id !== titleId))
      : { ...state.titles, [titleId]: next }
    state = { ...state, titles, updatedAt: now }
    save()
    return state
  }

  return {
    get state() {
      return state
    },
    get persistError() {
      return persistError
    },

    /** Loads stored progress. Unusable or partly invalid values are backed up before anything overwrites them. */
    hydrate(): LoadResult {
      let raw: string | null
      try {
        raw = storage ? storage.getItem(PROGRESS_STORAGE_KEY) : null
      } catch {
        raw = null
      }
      const result = parseProgress(raw, clock())
      if (raw !== null && (result.status === 'unusable' || result.status === 'recovered')) backUp(raw)
      state = result.state
      return result
    },

    setWatched(titleId: string, watched: boolean) {
      const now = clock().toISOString()
      return update(titleId, (e) => ({ ...e, watched, completedAt: watched ? (e.completedAt ?? now) : null }))
    },

    setWatchlist(titleId: string, on: boolean) {
      const now = clock().toISOString()
      return update(titleId, (e) => ({ ...e, addedToWatchlist: on, addedToWatchlistAt: on ? (e.addedToWatchlistAt ?? now) : null }))
    },

    /** Marks one episode (season * 1000 + episode) of a series title watched or not. */
    setEpisodeWatched(titleId: string, episodeKey: number, on: boolean) {
      assertTitleId(titleId)
      const have = new Set(state.episodes[titleId] ?? [])
      if (on) have.add(episodeKey)
      else have.delete(episodeKey)
      const { [titleId]: _old, ...rest } = state.episodes
      const episodes = have.size ? { ...rest, [titleId]: [...have].sort((a, b) => a - b) } : rest
      state = { ...state, episodes, updatedAt: clock().toISOString() }
      save()
      return state
    },

    /** Blank clears the note; text is trimmed and capped at 2000 characters. */
    setNotes(titleId: string, notes: string | null) {
      const clean = notes?.trim().slice(0, NOTES_MAX) || null
      return update(titleId, (e) => ({ ...e, notes: clean }))
    },

    /** Blank clears the name; text is trimmed and capped at 60 characters. */
    setDisplayName(name: string | null) {
      const clean = name?.trim().slice(0, NAME_MAX) || null
      state = { ...state, preferences: { ...state.preferences, displayName: clean }, updatedAt: clock().toISOString() }
      save()
      return state
    },
  }
}

export type ProgressStore = ReturnType<typeof createProgressStore>

/** Watchlisted titles, oldest first. */
export function watchlistEntries(state: UserProgressState): UserWatchlistEntry[] {
  return Object.values(state.titles)
    .flatMap((e) => (e.addedToWatchlist && e.addedToWatchlistAt ? [{ titleId: e.titleId, addedAt: e.addedToWatchlistAt }] : []))
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt))
}

/** How many of the given roadmap IDs are watched. IDs the user has no record for count as not watched. */
export function countWatched(state: UserProgressState, titleIds: readonly string[]): number {
  return titleIds.filter((id) => state.titles[id]?.watched === true).length
}

/** localStorage, or null when unavailable (server render, or access blocked by the browser). */
export function getBrowserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
