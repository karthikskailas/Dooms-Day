# Marvel: Road to Doomsday — Architecture

> **Superseded in Phase 03 (2026-11-21):** the data model, file layout and module names in this document predate the real dataset. The editorial data is `app/constant/marvel_doomsday_watchlist.json` (snake_case, separate `supplemental_titles`), and the current design is in the root `ARCHITECTURE.md` §11 and `STANDARDS.md` §14. Where they differ, the root documents win.

> This document records feature-specific architecture. Inspect and follow the repository's root `ARCHITECTURE.md` before implementation; this file does not replace global architecture rules.

## Technology Roles

| Technology | Role |
|---|---|
| Nuxt 4 | Vue application, routing, SSR and server API endpoints |
| TypeScript | Typed roadmap models, API responses and application state |
| Tailwind CSS | Responsive styling, using the repository's design tokens |
| Motion for Vue (optional) | Carefully controlled transitions and cinematic UI motion |
| Custom SVG / Vue Flow (decision pending implementation) | Free-moving timeline graph; custom SVG is preferred for a curated map, Vue Flow if graph interactions become complex |
| TMDB API | External metadata, artwork, credits, videos and watch-provider availability |
| Cloudflare Workers | Hosting Nuxt through the supported Nitro Cloudflare preset and running server endpoints |
| Cloudflare Workers KV (optional) | Cache public TMDB responses where appropriate |
| LocalStorage | Initial local progress, display name and achievement preferences |
| Cloudflare Web Analytics | Privacy-conscious aggregate site analytics |

Do not add D1, R2, authentication or a separate database to the first release without a concrete requirement.

## System Boundaries

### This project owns

- Curated title catalogue and stable project IDs.
- Watch order and roadmap mode membership.
- Priority labels (`essential`, `recommended`, `optional`).
- Doomsday relevance, editorial explanations and story connections.
- Timeline node relationships and layout metadata.
- Achievement rules, achievement copy and visual templates.
- User's local progress and card customisation.

### TMDB owns/provides

- TMDB title identifiers and metadata.
- Movie/TV descriptions, genres, release dates, runtime and seasons.
- Posters, backdrops and image paths.
- Cast and crew metadata.
- Video metadata, including YouTube keys when available.
- Watch-provider availability by region and provider category.

TMDB metadata must not overwrite project-authored priority, watch order, story relevance or editorial explanations.

## Data Flow

1. Curated roadmap JSON is loaded by the Nuxt application.
2. Each roadmap item contains a stable project ID and a verified TMDB ID plus media type.
3. Frontend requests title data from Nuxt server endpoints.
4. Nuxt server calls TMDB using a server-only credential.
5. Server normalises the fields required by the UI and may cache suitable public responses.
6. Frontend merges the TMDB metadata with project-owned editorial data.
7. User progress and achievement customisations are stored locally.
8. Achievement components render from local progress + curated achievement configuration + TMDB artwork.

Never call TMDB with a secret credential directly from browser code. Use a server-only environment variable/Cloudflare secret. If a public read token is used, still route through the server to centralise caching, error handling and data shaping.

## Suggested Server Endpoints

- `GET /api/titles/:mediaType/:tmdbId` — core movie or TV details.
- `GET /api/titles/:mediaType/:tmdbId/videos` — trailers and other videos.
- `GET /api/titles/:mediaType/:tmdbId/credits` — cast and crew.
- `GET /api/titles/:mediaType/:tmdbId/images` — image metadata.
- `GET /api/titles/:mediaType/:tmdbId/providers?region=IN` — watch providers.
- `GET /api/search?q=` — optional title discovery/search.

Validate `mediaType` against `movie | tv`, validate IDs, handle TMDB errors, and return predictable typed response shapes. Do not expose the TMDB credential in responses or logs.

## Data Model

### Curated roadmap item

Recommended fields:

```ts
type MediaType = 'movie' | 'tv'
type RoadmapMode = 'doomsday' | 'universe'
type Priority = 'essential' | 'recommended' | 'optional'

interface RoadmapTitle {
  id: string                 // Stable project slug; never use TMDB ID as project identity
  title: string              // Editorial display title
  mediaType: MediaType
  tmdbId: number
  modes: RoadmapMode[]
  priority: Priority
  watchOrder: number
  releaseYear?: number
  storyConnections: string[]
  importanceStatement: string
  doomsdayConnection: string
  spoilerLevel?: 'none' | 'light' | 'full'
  timeline: {
    x: number
    y: number
    connections: string[]    // Other project title IDs
    phase?: string
  }
  achievement: {
    title: string
    subtitle: string
    template: 'movie' | 'series'
    quote?: string
  }
}
```

The existing supplied roadmap list should be migrated into this shape carefully. Preserve its editorial explanations and verify TMDB IDs before wiring dynamic data. Do not invent missing IDs.

### Local progress

```ts
type WatchStatus = 'not_started' | 'watching' | 'completed'

interface TitleProgress {
  titleId: string
  status: WatchStatus
  completedAt?: string       // ISO date/time
  seasonProgress?: Record<string, {
    completed: boolean
    completedAt?: string
  }>
}
```

For a series, the first release may support title-level completion only. Season-level/episode-level tracking is a later enhancement; do not falsely mark a series complete when only one season is finished.

### Achievement

```ts
interface AchievementRecord {
  id: string                 // e.g. "title:iron-man"
  type: 'title_completed' | 'season_completed' | 'doomsday_ready'
  titleId?: string
  unlockedAt: string
  displayName: string
  theme: string
  style: 'cinematic' | 'minimal'
}
```

Achievements are derived from local progress and can be reconstructed. Do not treat client-side LocalStorage as proof of a verified achievement.

## Achievement Rules

- Marking a roadmap title as completed unlocks its individual title achievement.
- A title achievement uses that title's artwork, display title, user display name and completion date.
- Series achievement wording must not imply every episode/season was watched unless that is what the tracker verifies.
- The final `doomsday_ready` achievement unlocks when every title included in the Doomsday Journey with `priority === 'essential'` has `status === 'completed'`.
- `recommended` and `optional` titles do not block the final achievement.
- Completion is reversible if a user changes a title from completed to another status; the UI must explain the effect on the final achievement.
- The initial achievement is self-reported and locally stored.

## Storage / Auth / Access Control

- Initial release: no authentication.
- Store progress and preferences in versioned LocalStorage keys, e.g. `marvel-roadmap:v1`.
- Handle invalid, missing or outdated stored JSON safely; provide a migration/version strategy.
- Keep TMDB credentials in Cloudflare Worker secrets/server runtime only.
- Do not store personal data beyond the locally supplied display name and progress unless a later product decision explicitly requires it.

## Caching and Failure Handling

- Cache public TMDB responses server-side where practical; respect TMDB terms and any applicable cache guidance.
- Use a short configurable cache policy for provider availability because it changes more frequently than basic metadata.
- Provide graceful states for missing posters, missing videos, unavailable providers, rate limits, network errors and unknown TMDB IDs.
- The curated title and its editorial content must remain visible if TMDB is unavailable.
- Do not invent provider availability. If the endpoint returns no provider data, show “Availability not listed” rather than guessing.

## Invariants

- Project IDs are stable and distinct from TMDB IDs.
- TMDB data never decides editorial priority or Doomsday connection.
- All provider availability is region-specific; default region for initial audience is India (`IN`), but keep region configurable.
- A trailer is embedded only when a usable video key and supported host are returned.
- Use official/legitimate provider destinations; never show torrent sources.
- No TMDB secret is shipped to the client.
- No Marvel/Disney affiliation or endorsement is implied.
- Local achievements are labelled as user progress, not independently verified.
- Optional roadmap titles do not block DOOMSDAY READY.

## Architectural Decisions

- **Decision**: Use Nuxt 4 with Cloudflare Workers as the deployment target.
  - **Why**: One Nuxt application can provide the frontend and server-side TMDB proxy without a separately operated backend.
  - **Alternatives considered**: Cloudflare Pages static hosting; separate API server.
  - **Date**: 2026-11-21.

- **Decision**: Use TMDB IDs stored in the curated JSON to retrieve metadata.
  - **Why**: Stable, deterministic matching; avoids title-name ambiguity at runtime.
  - **Alternatives considered**: Search TMDB by title on each page load.
  - **Date**: 2026-11-21.

- **Decision**: Use LocalStorage for the first release's viewing progress and achievements.
  - **Why**: Fun project, no login required, minimal infrastructure.
  - **Alternatives considered**: Cloudflare D1 and user accounts.
  - **Date**: 2026-11-21.

- **Decision**: Use a free-moving, pannable and zoomable timeline map.
  - **Why**: The map is a central discovery experience, not merely a static ordered list.
  - **Alternatives considered**: Guided-only horizontal timeline.
  - **Date**: 2026-11-21.

- **Decision**: Generate an individual achievement card for each completed title and a final DOOMSDAY READY card for completion of all essential Doomsday titles.
  - **Why**: Makes each viewing milestone rewarding and gives users shareable content.
  - **Alternatives considered**: One final completion card only.
  - **Date**: 2026-11-21.
