# Architecture — Marvel: Road to Doomsday

**Status:** Initial architecture baseline for the foundation phase  
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
TMDB integration is a later approved phase, not part of the initial project foundation.

When implemented:
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
