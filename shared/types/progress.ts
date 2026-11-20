// Personal viewing data. Stored locally in the browser, never in the roadmap JSON.

/** Keyed by the roadmap `id`. */
export interface UserTitleProgress {
  titleId: string
  watched: boolean
  /** ISO date-time; null when not watched. */
  completedAt: string | null
  addedToWatchlist: boolean
  /** ISO date-time the title joined the watchlist; null when not on it. */
  addedToWatchlistAt: string | null
  notes: string | null
}

export interface UserPreferences {
  displayName: string | null
}

/** Current persisted shape. Bump `version` and add a migration in progress-storage.ts to change it. */
export interface UserProgressState {
  version: 1
  titles: Record<string, UserTitleProgress>
  preferences: UserPreferences
  updatedAt: string
}

/** Projection of a watchlisted title, for views that list the watchlist. */
export interface UserWatchlistEntry {
  titleId: string
  addedAt: string
}
