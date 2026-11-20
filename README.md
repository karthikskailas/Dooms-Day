# Marvel: Road to Doomsday

A fan-made cinematic watch journey to Avengers: Doomsday. Not affiliated with or endorsed by Marvel or Disney.

Project documentation lives in [`docs/`](docs/README.md). Start with `docs/CLAUDE.md` and `docs/progress-tracker.md`.

## Requirements

- Node.js 22+ (developed on 26.8.1)
- pnpm (developed on 12.3.4)

## Setup

```bash
pnpm install          # also runs `nuxt prepare` (generates .nuxt types)
cp .env.example .env  # optional until TMDB integration (Phase 03)
```

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server at http://localhost:3000 |
| `pnpm build` | Production build to `.output/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm typecheck` | Strict `vue-tsc` type check |
| `pnpm lint` / `pnpm lint:fix` | ESLint (flat config via `@nuxt/eslint`) |

## Stack

| Package | Version | Role |
|---|---|---|
| `nuxt` | 4.6.x | App framework, routing, SSR, server API (later) |
| `vue` / `vue-router` | 3.5.x / 5.5.x | UI and routing (versions match Nuxt's own deps) |
| `tailwindcss` + `@tailwindcss/vite` | 4.3.x | Styling; tokens defined with `@theme` in `app/assets/css/main.css` |
| `lucide-vue-next` | 1.0.x | Icons (import per icon, e.g. `import { Play } from 'lucide-vue-next'`) |
| `@nuxt/eslint` + `eslint` | 1.17.x / 10.x | Linting |
| `typescript` | 6.0.x | Pinned below 7: Volar and typescript-eslint don't support TS 7 yet |
| `vue-tsc` | 3.3.x | Type checking for `.vue` files |

## Structure

```
app/                  Nuxt 4 source directory (`~` alias)
  app.vue             Root: <NuxtLayout><NuxtPage/>
  assets/css/main.css Tailwind entry, design tokens, global base styles
  components/         Auto-imported components; group by feature folder (timeline/, title/, achievement/)
  layouts/default.vue Default layout (skip link + <main>)
  pages/index.vue     `/` route — placeholder only, landing page not built yet
server/               Nitro server routes (empty; TMDB proxy goes in server/api, server/utils)
docs/                 Product, architecture, UI and workflow documentation
nuxt.config.ts        Modules, Tailwind plugin, strict TS, runtimeConfig, default <head>
eslint.config.mjs     Extends the Nuxt-generated ESLint config
pnpm-workspace.yaml   pnpm settings (allows the esbuild install script)
.env.example          Documented environment variables
```

Planned folders from `docs/code-standards.md` (`app/composables`, `app/utils`, `app/types` or `shared/types`, `data/`) are created when their first file lands.

## Conventions

- **Components:** PascalCase `.vue` files with `<script setup lang="ts">`. Nuxt auto-imports by path, so `components/timeline/MapNode.vue` is used as `<TimelineMapNode>`.
- **Styling:** use the token utilities (`bg-void`, `text-ink-muted`, `border-line`, …), not arbitrary hex values.
- **Environment variables:** read through `useRuntimeConfig()`, never `process.env` in app code.
  - `runtimeConfig.tmdbApiToken` (`NUXT_TMDB_API_TOKEN`) is server-only and must only be read in `server/`.
  - `runtimeConfig.public.tmdbRegion` (`NUXT_PUBLIC_TMDB_REGION`, default `IN`) is safe for the client.
- Never commit `.env`.
