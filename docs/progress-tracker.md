# Marvel: Road to Doomsday — Progress Tracker

**Last Updated**: 2026-11-21

## Current Phase
**Phase 02 — Design system: foundation complete, awaiting approval to start Phase 03.** Phase 01 is complete.

## Current Goal
Phase 03 (pending approval). See "Next Work".

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

## Phase 02 — Session Log (in progress)

### Installed (project-local, Claude Code)
- **Impeccable 4.10.0**: `.claude/skills/impeccable`, `.claude/agents/impeccable-*.md`, detector hooks in `.claude/settings.local.json` (git-ignored; contains machine paths). Installed with `npx impeccable install --project --providers=claude --scope=project --yes`.
- **Taste Skill** (`Leonxlnx/taste-skill`, `design-taste-frontend`): `.claude/skills/design-taste-frontend`, lockfile `skills-lock.json` (commit `f6b7657`). Installed with `npx skills add ... --agent claude-code -y` (no `-g`).
- Impeccable engine `0.1.27` in `~/.impeccable/bin/` (user-level binary; the installer added it).

### Install incident (resolved)
- The first Impeccable run defaulted to a **global** install and wrote hooks into `~/.claude/settings.json`, `~/.codex/hooks.json`, `~/.grok/hooks/`, and `~/.hermes/plugins/`, plus skill folders for ten other tools.
- Birth times confirmed all of these were created by that run. They were removed. `~/.claude/settings.json` keeps only `includeCoAuthoredBy: false`.
- Lesson: always pass `--project --providers=... --scope=project --yes` to the Impeccable installer.

### Security note
- The Taste Skill installer rated `design-taste-frontend` **Critical Risk (Gen)**, Socket 0 alerts, Snyk Medium.
- Reviewed scripts: local headless Chrome over `127.0.0.1`; writes limited to project/temp paths; no credential access or fetched-code execution found. Outbound calls: `assets/components/fx-map/bake.mjs` (Overpass, manual) and sample-image URLs.
- Not verified further. Re-review before relying on it.

### Decisions pending (user)
1. Visual direction: three candidates presented; recommendation pending approval.
2. `/impeccable init`: it would interview and rewrite the root `PRODUCT.md` into Impeccable's schema. Recommend skipping it and keeping `PRODUCT.md` as the authority. Impeccable's context check reports `PRODUCT.md` as a legacy schema (`route` severity).
3. `.gitignore` now excludes `.claude/settings.local.json`.

### Conflicts between the Taste Skill and the product spec
- Taste Skill assumes photo-led marketing pages with "one section per screen", hover-lift cards and shader effects on tech pages. The product spec (`docs/ui-context.md`, `CLAUDE.md` §1 and §7) requires a map-first experience, a fixed palette, and two fonts. The product spec wins; exceptions get recorded here.
- Taste Skill's "stand-in" photography rules conflict with TMDB artwork and the "no fabricated media" rule. Not applicable to the foundation.


## Phase 02 — Outcome

### Decided
- Direction: **Sanctum** (user-approved). `init` declined; `PRODUCT.md` kept as the authority.
- Added tokens: `line-strong` (#667369, ≥3:1 control boundaries), `danger-text` (#D98278, error text on dark surfaces).
- Fonts: self-hosted `@fontsource/barlow-condensed` 600/700 and `@fontsource-variable/dm-sans`. Fluid type scale in `main.css`.
- Full spec in `DESIGN.md` (tokens, type, layout, components, eight page specs, accessibility, motion, conflicts, open decisions).

### Files changed in Phase 02
- `app/assets/css/main.css`: tokens, font families, fluid type scale, radii, container width
- `nuxt.config.ts`: font imports
- `app/components/ui/UiButton.vue`, `app/components/ui/UiBadge.vue`: new primitives
- `app/pages/design-system.vue`: style guide, `noindex`
- `DESIGN.md`: rewritten with the approved direction
- `eslint.config.mjs`: `.claude/**` excluded from lint (third-party skill code)
- `.gitignore`: `.claude/settings.local.json` excluded
- `docs/progress-tracker.md`: this file
- `.claude/` (Impeccable + Taste Skill, project-local), `skills-lock.json`: installed, untracked

### Dependencies added
- `@fontsource-variable/dm-sans@5.3.0`, `@fontsource/barlow-condensed@5.3.0`

### Commands run and results
| Command | Result |
|---|---|
| `pnpm typecheck` | exit 0 (after the final edits) |
| `pnpm lint` | exit 0 (after excluding `.claude/**`) |
| `pnpm build` | exit 0 (final build after all edits) |
| `impeccable shot /design-system` at 1440×900, 768×1024, 390×844 | captured and inspected. The 390px table overflow and monospace `<code>` were fixed; the 390 and 768 recaptures were inspected after the fix. |
| WCAG contrast calculation (node script) | run over 24 pairs; see `DESIGN.md` §3 |
| `impeccable install` (first run, global) | **Mistake**: installed globally. Reverted (see install incident above). |

### Not done in this phase (stated, not claimed)
- **Impeccable `critique` and `audit`** were **not run** as skill commands. Only the deterministic design hook (on `main.css`: no findings) and my own checks were applied.
- **Taste Skill's build workflow** (inventory → direction sheet → concept → gate) was **not run**. Its rules were read and mapped to the product spec (`DESIGN.md` §11). Its page-building flow targets marketing pages and does not fit this map-first app.
- **No reduced-motion or keyboard-focus runtime test** was run in a browser. The global rules exist and were checked in code; the focus ring is defined but not exercised by a tab sequence.
- **No horizontal-overflow measurement** by script. Confirmed visually at three widths only.
- **`PRODUCT.md`** still reports as a legacy schema to Impeccable (`route`). Not repaired, by decision.

## Next Work (Phase 03 — awaiting approval)
Phase 03 scope is not defined in the source documents. Per `ai-workflow-rules.md`, the next unit is "Curated data" (typed roadmap schema, migrated title list, TMDB ID validation), then "TMDB integration". Before starting:
1. Confirm the phase order and whether the curated roadmap data is available to migrate.
2. Resolve the `DESIGN.md` §12 open decisions that block the first page (landing needs none; the map needs 1, 2 and 3).
3. Decide whether to run Impeccable `critique`/`audit` and a Taste Skill pass on the landing page when it is built.
4. Commit the Phase 02 work (not committed; awaiting your instruction).
