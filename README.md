# Marvel: Road to Doomsday

A fan-made cinematic watch journey to Avengers: Doomsday. Not affiliated with or endorsed by Marvel or Disney.

Start with [`CLAUDE.md`](CLAUDE.md) and [`docs/progress-tracker.md`](docs/progress-tracker.md). Product, design, architecture and standards are in `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md` and `STANDARDS.md`; the older feature notes are in [`docs/`](docs/README.md).

## Requirements

- Node.js 22.18+ (developed on 26.8.1). The scripts run TypeScript directly (native type stripping) and read `.env` with `--env-file-if-exists`.
- pnpm (developed on 12.3.4)

## Setup

```bash
pnpm install              # also runs `nuxt prepare` (generates .nuxt types)
cp .env.example .env      # then add your TMDB token (see below)
pnpm validate:data        # check the roadmap data and TMDB mapping
pnpm dev                  # http://localhost:3000
```

The app runs without a TMDB token. The `/api/titles/*` routes then answer `503 credentials_missing`.

## TMDB credentials

TMDB supplies posters, descriptions, cast, trailers and watch providers. The token is used only on the server and is never sent to the browser.

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/) and open **Settings → API**.
2. Copy the **API Read Access Token** (the long one, not the short API key).
3. Put it in `.env`:

   ```bash
   NUXT_TMDB_API_TOKEN=your-read-access-token
   ```

4. Restart the dev server.

| Variable | Scope | Default | Purpose |
|---|---|---|---|
| `NUXT_TMDB_API_TOKEN` | server only | none | TMDB API Read Access Token |
| `NUXT_TMDB_API_BASE_URL` | server only | `https://api.tmdb.org/3` | Only `api.tmdb.org` and `api.themoviedb.org` are accepted, because the token is sent there |
| `NUXT_PUBLIC_TMDB_REGION` | public | `IN` | Default watch-provider region. Routes also accept `?region=XX` |

`api.tmdb.org` is the default because `api.themoviedb.org` reset most new connections on the development network. Leave `NUXT_TMDB_API_BASE_URL` blank unless you need to change it: the value must include `/3` (for example `https://api.tmdb.org/3`), and a blank line in `.env` uses the default. If you see `network_error`, check this setting first.

Never commit `.env`.

## Linking titles to TMDB

Each title's TMDB identity is stored in `app/constant/tmdb_mapping.json`, separate from the editorial data. All 92 titles are currently verified. No ID is recorded until it has been confirmed against TMDB, and the commands below are for adding or correcting entries.

```bash
pnpm tmdb:map --dry-run                       # search and show results, write nothing
pnpm tmdb:map                                 # search every title that is not verified yet
pnpm tmdb:map --only marvel_007,marvel_011    # specific titles
pnpm tmdb:map --retry-review                  # re-search titles marked needs_review
pnpm tmdb:map --verify marvel_015=movie:12345 # record a manual match (TV: marvel_021=tv:6789:1)
pnpm validate:data --strict                   # fails while any title is not verified
```

A title is verified automatically only when exactly one TMDB result matches both its title and year. Everything else becomes `needs_review` with candidates for a person to check. Verified entries are never overwritten by a search.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server at http://localhost:3000 |
| `pnpm build` | Validates the data, then builds to `.output/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm validate:data` | Validate the roadmap JSON and the TMDB mapping (`--strict` also requires every title verified) |
| `pnpm tmdb:map` | Search TMDB and update the mapping (needs a token) |
| `pnpm typecheck` | `nuxt typecheck` (app and server) plus `tsc` for scripts and tests |
| `pnpm lint` / `pnpm lint:fix` | ESLint (flat config via `@nuxt/eslint`) |
| `pnpm test` | Vitest unit tests |

## Data

| File | Owner | Purpose |
|---|---|---|
| `app/constant/marvel_doomsday_watchlist.json` | Editorial | 82 roadmap titles plus 10 supplemental titles. Source of truth; code never writes it |
| `app/constant/tmdb_mapping.json` | Tooling and people | Project ID → verified TMDB movie/tv ID |
| Browser `localStorage` (`marvel-roadmap:v1`) | The visitor | Watched, watchlist, notes, display name. Never in the JSON |

`titles` have `watch_order` and `completion_status`; `supplemental_titles` do not, and are never merged into the main list. See `ARCHITECTURE.md` §11.

## Pages

| Route | Status |
|---|---|
| `/` | Landing page (Phase 04): hero, live countdown, journey selection, about |
| `/journey/doomsday`, `/universe` | Holding pages that say the map is not built yet; replaced when the interactive roadmap lands |
| `/design-system` | Internal style guide, not indexed |

The countdown's date and target title come from `collection.target_release_date` and `collection.target_title` in the roadmap JSON, so changing the release date is a data edit (run `pnpm validate:data` after). The countdown targets midnight at the start of that date in the visitor's local time zone, and shows no clock once the date is reached.

## API

| Route | Returns |
|---|---|
| `GET /api/titles/:titleId` | Movie or TV metadata |
| `GET /api/titles/:titleId/credits` | Cast and key crew |
| `GET /api/titles/:titleId/videos` | Embeddable YouTube trailers and teasers |
| `GET /api/titles/:titleId/providers?region=IN` | Watch providers for a region |

`:titleId` is the project ID, such as `marvel_007`. Success is `{ titleId, mediaType, data }`; failure is `{ error: { code, message } }` with a matching HTTP status. A title with no verified TMDB match answers `404 tmdb_not_mapped`. Responses are cached in memory per server process (details 24 h, providers 3 h).

## Stack

| Package | Version | Role |
|---|---|---|
| `nuxt` | 4.6.x | App framework, routing, SSR, server routes |
| `vue` / `vue-router` | 3.5.x / 5.5.x | UI and routing (versions match Nuxt's own deps) |
| `tailwindcss` + `@tailwindcss/vite` | 4.3.x | Styling; tokens defined with `@theme` in `app/assets/css/main.css` |
| `@fontsource/barlow-condensed`, `@fontsource-variable/dm-sans` | 5.3.x | Self-hosted display and UI fonts |
| `lucide-vue-next` | 1.0.x | Icons (import per icon, e.g. `import { Play } from 'lucide-vue-next'`) |
| `zod` | 4.6.x | Runtime validation of the dataset, the mapping and TMDB responses |
| `vitest` | 5.1.x | Unit tests |
| `@nuxt/eslint` + `eslint` | 1.17.x / 10.x | Linting |
| `typescript` | 6.0.x | Pinned below 7: Volar and typescript-eslint don't support TS 7 yet |
| `vue-tsc` | 3.3.x | Type checking for `.vue` files |
| `@types/node` | 24.x | Types for scripts and tests |

## Structure

```
app/                    Nuxt 4 source directory (`~` alias)
  constant/             Editorial JSON and the TMDB mapping
  composables/          useProgress (progress store wrapper), useCountdown (live clock)
  plugins/              progress.client.ts hydrates saved progress after mount
  utils/                progress-storage, countdown (pure date logic), collection (release date), navigation
  components/ui/        UiButton, UiBadge
  components/layout/    SiteHeader, SiteFooter, BrandWordmark, PageContainer
  components/landing/   Hero, HeroBackdrop, DoomsdayCountdown, JourneySelection, JourneyCard, JourneyGlyph, ProjectIntro
  components/journey/   JourneyPending (holding state until the map is built)
  pages/                index (landing), journey/doomsday and universe (holding routes), design-system (style guide, noindex)
  layouts/ assets/      Default layout (skip link, header, footer); Tailwind tokens and global styles
shared/                 Used by app, server, scripts and tests
  types/                Dataset, mapping, progress and TMDB types
  schemas/              Zod schemas and cross-checks
  utils/                Title parsing, TMDB matching, image URLs
server/
  api/titles/[titleId]/ details, credits, videos, providers
  utils/                roadmap lookup; tmdb/ (client, schemas, normalisers, cache)
scripts/                validate-data.ts, tmdb-map.ts
tests/                  Vitest tests
docs/                   Product, UI and workflow notes (data model sections superseded; see ARCHITECTURE.md §11)
```

## Conventions

- **Components:** PascalCase `.vue` files with `<script setup lang="ts">`. Nuxt auto-imports by path, so `components/timeline/MapNode.vue` is used as `<TimelineMapNode>`.
- **Styling:** use the token utilities (`bg-void`, `text-ink-muted`, `border-line`, …), not arbitrary hex values.
- **Environment variables:** read through `useRuntimeConfig()`, never `process.env` in app or server code.
- **Data:** do not edit the editorial JSON from code. See `STANDARDS.md` §14.
- Never commit `.env`.

## Deploy to Cloudflare Pages

Live at `https://doomsday-tracker-app.pages.dev`. One-time setup (needs your Cloudflare account; an agent cannot log in for you): `npx wrangler login`, `npx wrangler kv namespace create COLLECTORS` (its id is in `wrangler.jsonc`), then create the Pages project and store the TMDB token as a secret, never in a file:

```powershell
npx wrangler pages project create doomsday-tracker-app --production-branch main
```

```powershell
npx wrangler pages secret put NUXT_TMDB_API_TOKEN --project-name doomsday-tracker-app
```

Every deploy:

```powershell
pnpm build:cf
```

```powershell
npx wrangler pages deploy
```

`pnpm build:cf` builds with the Cloudflare Pages preset into `dist/`; collector codes then live in the `COLLECTORS` KV namespace (locally they stay in `.data/collectors`). `public/media/` holds the intro videos (12 MB, Marvel/Disney footage; publishing them was the owner's decision).
