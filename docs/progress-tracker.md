# Marvel: Road to Doomsday — Progress Tracker

**Last Updated**: 2026-11-21

## Current Phase
**Phase 01 — Foundation: COMPLETE.** Awaiting approval to start Phase 02.

## Current Goal
Phase 02 (pending approval). See "Next Work".

## Completed Work
- Product flows, two journey modes, pan/zoom timeline, title detail layout, achievements and UI contract defined (pre-Phase 01).
- **Phase 01:** Nuxt 4 project at repo root (`/home/ncrypt/GITHUB/marvel-doomsday`). It has:
  - strict TypeScript
  - Tailwind v4 with the provisional palette tokens
  - Lucide icons
  - ESLint
  - a default layout and a placeholder `/` route
  - `runtimeConfig` with a server-only TMDB token and a public region setting
  - root `README.md` documenting the structure, commands and dependencies

## Phase 01 Handoff

### Files created
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` (allows the esbuild build script)
- `nuxt.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`, `.env.example`
- `app/app.vue`, `app/layouts/default.vue`, `app/pages/index.vue` (placeholder), `app/assets/css/main.css`, `app/components/.gitkeep`
- `README.md` (root)
- `server/` (empty, created by Nuxt), plus the generated `.nuxt/`, `.output/` and `.data/` (all git-ignored except `server/`)

### Files modified
- `docs/progress-tracker.md`

### Dependencies
- **Runtime:**
  - nuxt 4.6.4
  - vue 3.5.45
  - vue-router 5.5.1
  - tailwindcss 4.3.5
  - @tailwindcss/vite 4.3.5
  - lucide-vue-next 1.0.0
- **Dev:**
  - @nuxt/eslint 1.17.0
  - eslint 10.15.0
  - typescript 6.0.3
  - vue-tsc 3.3.14

TypeScript is pinned to `~6.0.0`. TS 7.0.2 installed first but broke the peer ranges of Volar (<7) and typescript-eslint (<6.1). `pnpm peers check` now reports no issues.

### Commands run and actual results
| Command | Result |
|---|---|
| `pnpm install` | OK (Node 26.8.1, pnpm 12.3.4) |
| `pnpm typecheck` | exit 0. I also injected a deliberate type error, which made it exit 2, so the check really runs. |
| `pnpm lint` | exit 0, no findings |
| `pnpm build` | exit 0, built in 4.6 s |
| `node .output/server/index.mjs` | Served `/`: `lang="en"`, title, skip link and placeholder text present; compiled CSS contains the tokens |
| `pnpm dev` | `/` returned HTTP 200; no errors or warnings in the log |

No browser screenshots were taken because there is no UI to review in this phase.

### Decisions and deviations
- **Cloudflare deferred.** `ai-workflow-rules.md` puts the Cloudflare baseline in Foundation, but the Phase 01 brief explicitly excluded it. Configure it in a later phase (`nitro.preset`, wrangler, secrets).
- **Palette tokens are provisional.** They come from `CLAUDE.md` §7 and must be confirmed through the Taste Skill and Impeccable flow and `DESIGN.md`.
- **Fonts not loaded yet.** Barlow Condensed and DM Sans wait for the design-direction phase; choose the font strategy then.
- **No test runner installed.** No logic exists yet. Add Vitest when progress and achievement rules are written (Phase 7–9 in `ai-workflow-rules.md`).

## Open Issues
- **Documents referenced but missing:**
  - `PRODUCT.md` and `DESIGN.md` (expected; produced by the design skills)
  - root `AGENTS.md`, `ARCHITECTURE.md` and `STANDARDS.md`, which `ai-workflow-rules.md`, `architecture.md` and `code-standards.md` say they inherit from. Either create them or remove those references.
- **`CLAUDE.md` is in `docs/`, not at the repo root**, so Claude Code won't auto-load it. Consider moving it or adding a root `CLAUDE.md` that points to it.
- **Not a git repository yet.** `skill-installation.md` asks for a commit or backup before installing skills.
- **`CLAUDE.md` formatting:** the §5 heading is duplicated and there is no §6.
- **Design skills not installed:** Impeccable and Taste Skill are deliberately deferred per the Phase 01 brief.

## Next Work (Phase 02 — awaiting approval)
1. `git init` and make the first commit (the foundation).
2. Resolve where `CLAUDE.md` lives (repo root or a pointer file).
3. From the repo root, run `npx impeccable install` (Claude Code, project-local) and `npx skills add Leonxlnx/taste-skill --skill "design-taste-frontend"`. Then reload Claude Code and verify both skill folders.
4. Run `/impeccable init`, then review `PRODUCT.md`.
5. Run `/design-taste-frontend` for the landing-page direction. Confirm the palette and fonts, then write the root `DESIGN.md`.
6. Update `app/assets/css/main.css` tokens and load the approved fonts. After that, start the curated-data or landing-page unit as approved.
