import {
  countWatched,
  createProgressStore,
  emptyProgress,
  getBrowserStorage,
  watchlistEntries,
  type ProgressStore,
} from '../utils/progress-storage.ts'
import type { UserProgressState } from '../../shared/types/progress.ts'

// One store per browser tab. It stays null on the server so server rendering never touches localStorage.
let store: ProgressStore | null = null

/**
 * Personal viewing progress, shared across components and persisted in localStorage.
 * Stored separately from the roadmap JSON. Hydrates after the app mounts (see plugins/progress.client.ts),
 * so server-rendered HTML and the first client render match; read `hydrated` before showing saved state.
 */
export function useProgress() {
  const state = useState<UserProgressState>('user-progress', () => emptyProgress())
  const hydrated = useState('user-progress-hydrated', () => false)
  const persistError = useState<string | null>('user-progress-error', () => null)

  const sync = (s: ProgressStore) => {
    state.value = s.state
    persistError.value = s.persistError
  }

  const ensureStore = (): ProgressStore | null => {
    if (!import.meta.client) return null
    store ??= createProgressStore(getBrowserStorage())
    return store
  }

  /** Loads saved progress. Safe to call more than once. Client only. */
  function hydrate() {
    const s = ensureStore()
    if (!s || hydrated.value) return
    s.hydrate()
    hydrated.value = true
    sync(s)
  }

  // Mutations before hydration would overwrite saved data, so they are ignored until hydrate() has run.
  const mutate = (change: (s: ProgressStore) => unknown) => {
    const s = ensureStore()
    if (!s || !hydrated.value) return
    change(s)
    sync(s)
  }

  return {
    state: readonly(state),
    hydrated: readonly(hydrated),
    /** Non-null when the last save failed; changes are kept in memory only. */
    persistError: readonly(persistError),
    hydrate,
    isWatched: (titleId: string) => state.value.titles[titleId]?.watched === true,
    isOnWatchlist: (titleId: string) => state.value.titles[titleId]?.addedToWatchlist === true,
    progressFor: (titleId: string) => state.value.titles[titleId] ?? null,
    watchlist: computed(() => watchlistEntries(state.value)),
    watchedCount: (titleIds: readonly string[]) => countWatched(state.value, titleIds),
    setWatched: (titleId: string, watched: boolean) => mutate((s) => s.setWatched(titleId, watched)),
    resetWatched: () => mutate((s) => s.resetWatched()),
    watchedEpisodes: (titleId: string): readonly number[] => state.value.episodes[titleId] ?? [],
    setEpisodeWatched: (titleId: string, key: number, on: boolean) => mutate((s) => s.setEpisodeWatched(titleId, key, on)),
    setWatchlist: (titleId: string, on: boolean) => mutate((s) => s.setWatchlist(titleId, on)),
    setNotes: (titleId: string, notes: string | null) => mutate((s) => s.setNotes(titleId, notes)),
    setDisplayName: (name: string | null) => mutate((s) => s.setDisplayName(name)),
  }
}
