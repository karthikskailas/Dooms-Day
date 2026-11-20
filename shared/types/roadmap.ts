// Types for the editorial dataset in app/constant/marvel_doomsday_watchlist.json.
// Field names match the JSON exactly (snake_case); the JSON is the source of truth.

export const PRIORITIES = ['essential', 'recommended', 'optional'] as const
export type Priority = (typeof PRIORITIES)[number]

export const CONNECTION_STATUSES = ['confirmed', 'indirect', 'unconfirmed'] as const
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number]

/** Editorial title type. `special` (one-shots, holiday specials) has no TMDB equivalent; see TmdbMediaType. */
export const TITLE_TYPES = ['movie', 'series', 'special'] as const
export type TitleType = (typeof TITLE_TYPES)[number]

// ponytail: the JSON only uses `not_started`; the full set is taken from docs/architecture.md (WatchStatus).
export const COMPLETION_STATUSES = ['not_started', 'watching', 'completed'] as const
export type CompletionStatus = (typeof COMPLETION_STATUSES)[number]

/** Fields shared by both collections. */
export interface TitleBase {
  id: string
  title: string
  release_year: number
  type: TitleType
  priority: Priority
  importance_statement: string
  doomsday_connection: string
  connection_status: ConnectionStatus
  characters: string[]
}

/** An entry in `titles`: part of the ordered Road to Doomsday roadmap. */
export interface RoadmapTitle extends TitleBase {
  watch_order: number
  is_doomsday_relevant: boolean
  completion_status: CompletionStatus
  notes?: string
}

/** An entry in `supplemental_titles`: no watch order, relevance flag or completion status. */
export type SupplementalTitle = TitleBase

export interface CollectionMeta {
  id: string
  title: string
  description: string
  target_title: string
  /** ISO date (YYYY-MM-DD). */
  target_release_date: string
  target_release_date_note: string
  priority_definitions: Record<Priority, string>
  connection_status_definitions: Record<ConnectionStatus, string>
  sources: string[]
}

export interface RoadmapDataset {
  schema_version: '1.0.0'
  collection: CollectionMeta
  titles: RoadmapTitle[]
  supplemental_titles: SupplementalTitle[]
}
