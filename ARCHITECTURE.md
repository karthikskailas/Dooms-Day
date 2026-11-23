# Architecture — Marvel: Road to Doomsday

**Status:** Baseline plus the Phase 03 data architecture (§11). Where §3 or §5 differ from §11, §11 describes what is built.  
**Principle:** Keep the first release simple; do not introduce backend infrastructure before it is required.

## 1. Technology baseline
- Nuxt 4
- Vue 3
- TypeScript with strict checking
- Tailwind CSS
- pnpm
- Lucide icons

Use the current Nuxt 4 conventions and verify the actual generated project structure before creating directories. Nuxt 4 commonly uses an `app/` directory for application code; do not force a Nuxt 3 layout if the installed starter differs.

## 2. High-level shape
The initial application is a Nuxt web app with:
- Page-level routes.
- Reusable Vue components.
- Composables for reusable client-side behaviour.
- A typed editorial roadmap data layer.
- A small persistence abstraction over browser storage.
- A future server-side integration boundary for TMDB.

No database, authentication, or external hosting infrastructure is required for the initial version.

## 3. Suggested application organisation
> Phase 03 note: the editorial data lives in `app/constant/` (JSON), not `content/roadmap/`. The as-built layout is in §11.1.

Adapt this to the actual Nuxt 4 starter rather than creating empty folders prematurely.

```text
app/
  assets/
  components/
    layout/
    landing/
    journey/
    title/
    achievements/
    ui/
  composables/
  layouts/
  pages/
  utils/
  app.vue
content/
  roadmap/
    doomsday-journey.ts
    whole-universe.ts
server/
  api/
  utils/
shared/
  types/
  constants/
public/
docs/
```

Responsibilities:
- `app/pages`: route entry points and page composition.
- `app/components`: focused presentational and interactive components.
- `app/composables`: reusable stateful UI behaviour.
- `app/utils`: pure client-safe utility functions.
- `content/roadmap`: curated project-owned roadmap data.
- `server/api` and `server/utils`: future server-side API proxy/integration code, only when the relevant phase is approved.
- `shared`: types/constants shared across client and server where appropriate.
- `docs`: supporting project documentation if the repository uses a docs folder.

## 4. Data ownership
Keep three data categories separate:

### Project-owned editorial data
Owns:
- Stable title IDs.
- Journey membership.
- Watch order and relationships.
- Priority classification.
- Editorial relevance and connection copy.
- Verified TMDB ID and media type mapping.

This data is the source of truth for the roadmap.

### TMDB-sourced metadata
May provide:
- Posters and backdrops.
- Titles and release dates.
- Overview, runtime, and series metadata.
- Cast and crew.
- Videos/trailers.
- Regional watch-provider information.

Treat external data as nullable and potentially stale. Do not assume every title has every field or provider result.

### User-local data
Initial browser-local data may include:
- Watched title IDs and completion dates.
- Watchlist title IDs.
- Display-name preference.
- Achievement records and card preferences.

Version the persisted data shape so future changes can be migrated safely. Handle missing, malformed, or outdated stored data without crashing the application.

## 5. TMDB integration boundary
The server-side TMDB integration was implemented in Phase 03 (§11.5). It has **not been verified against live TMDB data** yet; see `docs/progress-tracker.md`.

Requirements:
- Keep the API key/token out of client bundles and source control.
- Use Nuxt server routes as a controlled proxy where appropriate.
- Validate route parameters and external responses.
- Cache only where justified and within the chosen runtime's capabilities.
- Store verified TMDB IDs and media types in curated project data; do not perform title search on every page load.
- Respect TMDB attribution and applicable API terms.
- Show explicit unavailable states for missing artwork, trailers, cast, or providers.
- Provider availability must be region-aware; initial target region is India.
- Do not fabricate provider availability or trailer links.

Do not add Cloudflare or any other specific hosting/runtime platform as part of this baseline.

## 6. State and persistence
For the initial release:
- Keep user progress client-side.
- Encapsulate storage access behind a composable or small storage module.
- Guard browser-only APIs so server rendering does not access `window` or `localStorage`.
- Make watched status and watchlist updates predictable and testable.
- Persist only the data needed to restore the user's experience.
- Do not add account sync or a database without explicit approval.

## 7. Achievement generation
Achievement card data should be derived from:
- The title's stable project ID.
- Completion status/date.
- User-selected display name and card preferences.
- The title's available artwork.

The final achievement unlock rule must use the curated `essential` classification, not a hardcoded count or all titles in the universe. Optional and recommended titles must not block it.

Image export and native sharing should be isolated from roadmap/progress logic so browser capability limitations can be handled cleanly.

## 8. Quality and resilience
- Keep domain data and business rules separate from view components.
- Use explicit TypeScript types for roadmap entries, title metadata, progress, and achievements.
- Validate data at external and persistence boundaries.
- Provide loading, empty, error, and unavailable states.
- Avoid coupling components directly to TMDB response shapes.
- Prefer deterministic utilities for unlock rules and progress calculations.

## 9. Future evolution
Potential future additions—only after explicit product approval—may include accounts, cloud sync, database persistence, or deployment-specific infrastructure. None are assumptions of the initial architecture.

## 10. Architecture decisions to revisit
- Exact Nuxt server/client boundary after TMDB integration is designed.
- Storage schema and migration strategy once progress implementation begins.
- Map rendering approach after interaction/performance requirements are prototyped.
- PNG export implementation and browser support.
- Caching and deployment strategy only when a hosting target is selected.

## 11. Data architecture (Phase 03)

### 11.1 As-built layout

```text
app/
  constant/
    marvel_doomsday_watchlist.json   editorial dataset (source of truth, never edited by code)
    tmdb_mapping.json                project ID → verified TMDB identity
  composables/useProgress.ts         Vue wrapper over the progress store
  plugins/progress.client.ts         hydrates progress after mount
  utils/progress-storage.ts          versioned localStorage store (no Vue, no Nuxt)
shared/                              imported by app, server, scripts and tests
  types/                             roadmap.ts, tmdb-mapping.ts, progress.ts, tmdb.ts
  schemas/                           roadmap.ts, tmdb-mapping.ts (Zod + cross-checks)
  utils/                             title-query.ts, tmdb-match.ts, tmdb-image.ts
server/
  api/titles/[titleId]/              index, credits, videos, providers
  utils/roadmap.ts                   titleId → verified TMDB target
  utils/tmdb/                        client, schemas, normalize, service, cached, respond, errors
scripts/                             validate-data.ts, tmdb-map.ts, tmdb-map-lib.ts
tests/                               Vitest unit tests
```

### 11.2 JSON ownership and collections

`app/constant/marvel_doomsday_watchlist.json` (schema_version `1.0.0`) is the permanent editorial source of truth. Code reads it and never writes it. Its SHA-256 when audited was `16ea2167c08645e067dfd8eb463db3d9816ff99f52624043e088ebc6d8457044` (82 titles, 10 supplemental). Any edit is an editorial change, not a code change.

| | `titles` (main roadmap) | `supplemental_titles` |
|---|---|---|
| Count | 82 | 10 (legacy X-Men and related) |
| IDs | `marvel_001`…`marvel_082` | `legacy_xmen_001`…`legacy_xmen_010` |
| `watch_order` | required, unique, contiguous 1..N | **absent** |
| `completion_status` | required | **absent** |
| `is_doomsday_relevant` | required | **absent** |
| `notes` | optional (one entry uses it) | not allowed |

The two collections are separate types and are never merged. IDs are unique across both. The `collection` object carries the priority and connection-status definitions and the target release date (`2026-12-18`, with a source note); the countdown must read it from there.

### 11.3 TypeScript models (`shared/types`)

Field names match the JSON exactly (snake_case). Controlled values are literal unions backed by `as const` arrays: `Priority`, `ConnectionStatus` (`confirmed | indirect | unconfirmed`), `TitleType` (`movie | series | special`), `CompletionStatus` (`not_started | watching | completed`). `RoadmapTitle` and `SupplementalTitle` share `TitleBase` but are distinct. `TmdbMappingEntry` is a discriminated union on `status`. Normalised TMDB shapes (`TitleMetadata`, `TitleCredits`, `TitleVideos`, `TitleProviders`) are UI-oriented; components never see raw TMDB responses.

The Zod schemas and the hand-written interfaces are checked against each other at compile time (`_RoadmapSchemaMatchesTypes`), so they cannot drift apart silently.

**Assumption to confirm:** the JSON only uses `completion_status: "not_started"`. The other two values come from `docs/architecture.md` (`WatchStatus`).

### 11.4 Validation

`shared/schemas` validates without modifying the data. Schemas are strict: unknown keys are reported, never dropped. Errors name the title and field, for example `[marvel_005] titles[4].priority: Invalid option…`.

- **Roadmap:** required fields and types, enums, ISO collection date, collection definitions, source URLs, unique IDs across both collections, unique and contiguous `watch_order`, no duplicate title and year, and the main/supplemental distinction (a supplemental title with `watch_order` is reported as belonging only to main titles).
- **Mapping:** entry shape, one entry per title and no extras, editorial type versus TMDB media type (`movie`→`movie`, `series`→`tv`, `special`→either), "Season N" titles must carry a matching `season_number`, `season_number` only on `tv`, and no two titles may claim the same TMDB target.

`pnpm validate:data` runs both. `pnpm build` runs it first and stops on failure. `--strict` also fails while any title is not `verified` (use before release).

The server validates once per process on first use and refuses to serve if the data is invalid.

### 11.5 TMDB mapping

`app/constant/tmdb_mapping.json` is keyed by project ID and covers both collections. Each entry is one of:

- `verified`: `tmdb_id`, `media_type` (`movie|tv`), optional `season_number`, `matched_title`, `matched_year`, `method` (`auto_exact|manual`), `verified_on`.
- `needs_review`: a `reason` and up to five `candidates`.
- `unmapped`: nothing recorded.

The editorial JSON is never changed to hold TMDB IDs. TMDB IDs are not looked up at request time.

**Rules** (`shared/utils/tmdb-match.ts`): the first or most popular result is never taken. A title is `verified` automatically only when exactly one candidate matches both the normalised title and the year. A "Season N" title is matched on the show, and TMDB must list that season with an air date in the editorial year. Anything else is `needs_review`. `special` titles search both movie and tv.

**Tooling** (needs a token): `pnpm tmdb:map` searches unverified titles; `--only`, `--dry-run`, `--retry-review`; `--verify id=movie:ID` or `id=tv:ID[:season]` records a manual verification after fetching the record. A verified entry is never overwritten by a search.

**Status (2026-11-21):** all 92 entries are `verified`: 73 by the automatic exact title-and-year rule and 19 manually after review (the Netflix-era Marvel series, whose TMDB titles carry a "Marvel's" prefix; The Fantastic Four, Item 47, X2; and the three "What If...?" seasons, where many unrelated shows share the name). Manual entries record what TMDB returned for the ID, and season titles were checked against TMDB's season list. Re-run `pnpm validate:data --strict` after any edit.

### 11.6 Server API

All routes are keyed by the project title ID, so TMDB IDs stay server-side.

| Route | Returns |
|---|---|
| `GET /api/titles/:titleId` | movie or TV metadata (TV includes the matching `season`) |
| `GET /api/titles/:titleId/credits` | up to 20 cast and key crew (Director, Writer, Screenplay, Story, Creator) |
| `GET /api/titles/:titleId/videos` | embeddable YouTube trailers, teasers and clips, plus the best `trailer` or null |
| `GET /api/titles/:titleId/providers?region=IN` | offers by `flatrate`, `free`, `ads`, `rent`, `buy`, plus `available` |

Success: `{ "titleId", "mediaType", "data" }`. Failure: `{ "error": { "code", "message" } }` with a matching status.

| Code | Status | Meaning |
|---|---|---|
| `invalid_title_id` | 400 | ID is malformed |
| `invalid_region` | 400 | region is not two letters |
| `title_not_found` | 404 | not in the roadmap |
| `tmdb_not_mapped` | 404 | no `verified` mapping yet |
| `tmdb_not_found` | 404 | TMDB has no record |
| `credentials_missing` / `credentials_invalid` | 503 | server token absent or rejected |
| `rate_limited` | 429 | with `Retry-After` when TMDB sends it |
| `upstream_error` / `malformed_response` / `network_error` | 502 / 502 / 502 or 504 | TMDB failed, replied with an unexpected shape, or was unreachable |

Missing optional TMDB fields become `null` or empty lists. Responses are validated with Zod before use. The token is sent only to `api.tmdb.org` or `api.themoviedb.org`; any other base URL is refused. Errors never contain the token. A connection reset is retried once; timeouts are not.

**Host choice:** the default is `https://api.tmdb.org/3`. On the development network `api.themoviedb.org` reset 8 of 10 new connections and `api.tmdb.org` 0 of 10. Override with `NUXT_TMDB_API_BASE_URL`.

**Provider limits:** TMDB supplies one region-level link (its own watch page, which requires JustWatch attribution), not per-provider deep links. Season titles use show-level credits, videos and providers.

### 11.7 Personal progress

Personal data lives only in the browser, separate from the JSON, keyed by the roadmap `id`.

- Key `marvel-roadmap:v1`; value `{ version: 1, titles, preferences, updatedAt }`.
- Per title: `watched`, `completedAt`, `addedToWatchlist`, `addedToWatchlistAt`, `notes` (≤2000). Preference: `displayName` (≤60). A title with nothing set has no entry.
- `watched` ⇔ `completedAt`, and `addedToWatchlist` ⇔ `addedToWatchlistAt`; entries that break this are dropped.
- An unreadable, wrong-version or partly invalid value is copied to `marvel-roadmap:v1:backup` (first backup kept) before anything is overwritten. Valid entries survive; the rest are counted and dropped.
- Server render uses no storage. `useProgress` hydrates after the app mounts (`app:mounted`), and mutations are ignored until then so saved data cannot be overwritten. Storage failure (quota, privacy mode) keeps changes in memory and sets `persistError`.
- Not implemented: cross-tab sync, and achievement records (the versioned shape allows adding them).

Progress is self-reported and unverified.

### 11.8 Caching

`server/utils/tmdb/cached.ts` wraps each lookup in Nitro's `defineCachedFunction`, on an explicit in-memory store (`nitro.storage.cache`).

| Lookup | Cache | Browser `Cache-Control` |
|---|---|---|
| details | 24 h (key includes season) | 1 h |
| credits | 24 h | 1 h |
| videos | 12 h | 30 min |
| providers (per region) | 3 h | 10 min |

Failures are never cached and stale entries are not served (`swr: false`). **Limits:** the cache is per server process, empties on restart, and is not shared between instances or serverless isolates, so each instance fetches its own copy. No Redis, KV, or database is used.

**Verified live (2026-11-21):** a repeat request is served from cache (cold 160–550 ms, repeat about 3 ms), and each region is cached separately. Rate-limit behaviour has not been exercised against the real API.

### 11.9 Open decisions

1. Full `completion_status` values (see §11.3).
2. Whether `unconfirmed`, defined but unused, stays in the allowed set (it does now).
3. How the 7 `special` titles map to TMDB (movie, tv, or not present). Decided per title during mapping.
4. Season-level credits, videos and providers instead of show-level.
5. Doomsday Journey membership: the JSON has `priority` and `is_doomsday_relevant` but no journey field. The DOOMSDAY READY gate currently has 10 `essential` titles to count.

## 12. Roadmap map (Phase 05)

`app/utils/roadmap-map.ts` builds the layout (a trunk stem then a canopy spiral laid on a temporary still backdrop (`yggdrasil-tree.webp`, to be replaced by a video), derived from `watch_order` only; Doomsday view filters to `is_doomsday_relevant`), filters, current position and keyboard neighbours; `map-viewport.ts` holds pan/zoom math. Both are pure and tested in `tests/roadmap-map.test.ts`. Nodes are HTML buttons in one CSS-transformed layer with an SVG edge layer behind; no graph library. Edges exist only between consecutive watch orders. Progress is read through `useProgress`; nothing is written to the JSON.
