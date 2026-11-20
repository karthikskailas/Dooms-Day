# Marvel: Road to Doomsday — Code Standards

> Inherits the repository's root `STANDARDS.md`. Inspect and follow it; this file records feature-specific conventions only.

## Feature-Specific Conventions

- Use TypeScript for application logic, API response types and roadmap data.
- Keep curated roadmap data separate from fetched TMDB response data.
- Use stable kebab-case project IDs for roadmap entries.
- Store TMDB numeric IDs and media type explicitly; do not perform title-name matching on every page load.
- Keep TMDB credentials server-only.
- Normalise external TMDB responses in server utilities; components should consume typed, UI-oriented data.
- Use composables for progress and achievement logic; avoid duplicating completion rules across components.
- Keep achievement templates data-driven and reusable.
- Version LocalStorage keys and validate parsed values before using them.
- Treat all TMDB fields and provider links as external/untrusted data; validate URLs before rendering external links.
- Use semantic buttons/links and accessible labels for map controls.
- Keep visual tokens in the global design system when available; do not scatter arbitrary colors and spacing values.
- Do not introduce new dependencies without checking whether the existing stack already provides the capability.

## Suggested Modules

- `types/roadmap.ts` — roadmap, priority, media and timeline types.
- `data/roadmap.json` — curated project-owned catalogue.
- `server/utils/tmdb.ts` — TMDB client and response normalisation.
- `server/api/titles/` — server-side TMDB endpoints.
- `composables/useProgress.ts` — local progress persistence.
- `composables/useAchievements.ts` — per-title and final unlock rules.
- `components/timeline/` — map canvas, nodes and controls.
- `components/title/` — detail view, trailer and provider sections.
- `components/achievement/` — reusable achievement card and export.
- `utils/storage.ts` — versioned LocalStorage parsing/migration.

These are suggested boundaries, not permission to reorganise an existing repository blindly. Inspect current structure first.
