# Marvel: Road to Doomsday — Progress Tracker

**Last Updated**: 2026-11-21 (landing rework below)

## Current Phase
**Phase 03 — Data architecture and TMDB integration: complete and verified against live TMDB** (after the token was added). Phases 01–03 are committed (`e53741c`, `04de6c7`, `5b9a378`, plus the live-mapping commit that follows it). Awaiting approval to start Phase 04.

## Current Goal
Phase 04 (pending approval). See "Next Work".

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
Resolved since Phase 01: `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`, `ARCHITECTURE.md`, `STANDARDS.md` and `CLAUDE.md` now exist at the repo root; the project is a git repository; both design skills are installed (see Phase 02).
Still open:
- **`CLAUDE.md` formatting:** the §5 heading is duplicated and there is no §6.

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

## Phase 03 — Outcome

### Status
Architecture, validation, mapping tooling, local persistence and the server integration are implemented and unit tested. The initial commit had no TMDB credential; the token was added afterwards and the mapping and live API checks below were done (see "Live TMDB session").

### Dataset audit (`app/constant/marvel_doomsday_watchlist.json`)
- **Location:** `app/constant/` (singular). `app/constants` does not exist. The file was untracked in git when found.
- **Structure:** `schema_version` `1.0.0`, `collection`, `titles` (82), `supplemental_titles` (10). Counts match the brief.
- **Integrity:** all 92 IDs unique; `watch_order` 1–82, no gaps or duplicates, matches list order and each ID's number; no duplicate title and year; no whitespace or empty-string problems.
- **Observed values:** type 38 movie / 37 series / 7 special; priority 10 essential / 19 recommended / 53 optional; connection 23 confirmed / 59 indirect; `completion_status` all `not_started`. Supplemental: 10 movies, 6 recommended / 4 optional, 6 confirmed / 4 indirect.
- **Findings, none changed:**
  1. `marvel_004` has an optional `notes` field no other title has (kept, allowed).
  2. `special` (7 titles) is a third editorial type with no TMDB equivalent.
  3. `unconfirmed` is defined in `connection_status_definitions` but never used.
  4. Only `not_started` appears for `completion_status`; the other values (`watching`, `completed`) are assumed from `docs/architecture.md`.
  5. 17 titles are season-level ("Daredevil - Season 1"), several sharing one TMDB series; the mapping carries `season_number`.
  6. 6 titles are `recommended` but `is_doomsday_relevant: false`. Independent fields; not an error.
  7. Several 2026 titles are unreleased or newly released; TMDB data may be missing or partial.
- **Integrity of the file:** not modified by this phase. mtime unchanged (2026-11-21 02:32), 53,875 bytes, SHA-256 `16ea2167…7044`. The only file the new code writes is `tmdb_mapping.json`.

### Implemented
- Types (`shared/types`) and Zod schemas with cross-checks (`shared/schemas`); main and supplemental collections kept as separate types.
- `pnpm validate:data`: validates without modifying; names the title and field; `--strict` requires every title verified. `pnpm build` runs it first.
- `app/constant/tmdb_mapping.json` (all 92 `unmapped`) and `pnpm tmdb:map` (search, score, `needs_review`, `--verify` for manual matches). Never takes the first result; never overwrites a verified entry.
- Personal progress: `app/utils/progress-storage.ts`, `app/composables/useProgress.ts`, `app/plugins/progress.client.ts`. Versioned key `marvel-roadmap:v1`, SSR-safe, backs up rejected data.
- Server: four routes under `/api/titles/[titleId]/`, a TMDB client with typed errors, Zod-validated responses, normalisers, in-memory caching.
- Docs: `ARCHITECTURE.md` §11, `STANDARDS.md` §14, `README.md` rewritten, superseded notices on `docs/architecture.md` and `docs/code-standards.md`.

### Files created
`shared/types/{roadmap,tmdb-mapping,progress,tmdb}.ts`, `shared/schemas/{roadmap,tmdb-mapping}.ts`, `shared/utils/{title-query,tmdb-match,tmdb-image}.ts`, `server/utils/roadmap.ts`, `server/utils/tmdb/{client,errors,schemas,normalize,service,cached,respond}.ts`, `server/api/titles/[titleId]/{index,credits,videos,providers}.get.ts`, `app/utils/progress-storage.ts`, `app/composables/useProgress.ts`, `app/plugins/progress.client.ts`, `app/constant/tmdb_mapping.json`, `scripts/{validate-data,tmdb-map,tmdb-map-lib}.ts`, `tests/*` (9 files), `vitest.config.ts`, `tsconfig.tools.json`.
`app/constant/marvel_doomsday_watchlist.json` already existed and is untracked.

### Files modified
`nuxt.config.ts` (server-only `tmdbApiBaseUrl`, explicit in-memory cache storage), `package.json`, `pnpm-lock.yaml`, `.env.example`, `ARCHITECTURE.md`, `STANDARDS.md`, `README.md`, `docs/architecture.md`, `docs/code-standards.md`, `docs/progress-tracker.md`.

### Dependencies added
`zod@4.6.7` (runtime), `vitest@5.1.1` and `@types/node@24.19.2` (dev).

### Commands run and actual results (final code state)
| Command | Result |
|---|---|
| `pnpm validate:data` | exit 0: roadmap OK (82 + 10); mapping OK (verified 0, needs_review 0, unmapped 92) |
| `pnpm validate:data --strict` | exit 1, as designed: 92 titles not verified |
| `pnpm typecheck` (`nuxt typecheck` + `tsc -p tsconfig.tools.json`) | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm test` | exit 0: 9 files, 104 tests passed |
| `pnpm build` | exit 0 (validation runs first); 4.2 MB total |
| `pnpm tmdb:map` with no token | exits 1 with a clear message; writes nothing |
| `pnpm tmdb:map --dry-run --only marvel_007` with an invalid token (real request to TMDB) | stopped with "TMDB rejected the configured credentials"; wrote nothing |

### Runtime check of the routes (production build, temporary placeholder entry, then restored)
A placeholder `verified` entry (ID `1`, never looked up because the token is rejected first) was added to `tmdb_mapping.json` for a smoke test. The file was restored byte for byte (SHA-256 confirmed) and the build redone; the placeholder is not in the final bundle.
- No token → `503 credentials_missing`.
- Invalid token → TMDB's real `401` mapped to `503 credentials_invalid`, for details, credits, videos and providers; 8 of 8 cold starts after the host change.
- `?region=in` accepted; `?region=ZZZ` and `?region=1%20` → `400 invalid_region`.
- Unmapped title → `404 tmdb_not_mapped`; unknown ID → `404 title_not_found`; malformed ID → `400 invalid_title_id`.
- The token did not appear in server logs, responses, the SSR HTML or the client bundle.

### Findings during testing
- **`api.themoviedb.org` is unreliable from this network:** 8 of 10 new connections reset, against 0 of 10 for `api.tmdb.org` (same API). The default base URL is now `https://api.tmdb.org/3` and a reset connection is retried once. This was measured on one machine on 2026-11-21; revisit if the deployment network differs.
- Lint originally linted `.claude/` (third-party skill code). Excluded in Phase 02.

### NOT verified (needs a TMDB token)
- That any endpoint returns correct real metadata, credits, videos or providers.
- India (`IN`) provider results, and the shape of real provider responses beyond the documented fields.
- That a second request is served from the cache (needs a live success).
- Rate-limit behaviour against the real API.
- The mapping tool's search results on the 92 real titles. The matching rules are unit tested with synthetic candidates only; real titles (the 7 `special` entries, season titles, 2026 releases) will likely produce `needs_review` entries.
- The `useProgress` composable in a browser: the store is unit tested; the Nuxt wrapper, the `app:mounted` hydration and a real refresh have not been exercised in a browser.

### Known issues and unresolved decisions
- **Uncommitted:** the live mapping, test and doc updates made after the first Phase 03 commit.
- Open decisions are listed in `ARCHITECTURE.md` §11.9 (full `completion_status` set, `unconfirmed`, `special` mapping, season-level credits and videos, Doomsday Journey membership field).
- `docs/architecture.md` and `docs/code-standards.md` still contain the superseded camelCase model below their notices.
- TMDB requires attribution and its watch-provider data requires JustWatch attribution; the UI must show both when built.
- The in-memory cache is per process and cleared on restart.

## Live TMDB session (after the token was added)

- **`.env` problem found and fixed:** `NUXT_TMDB_API_BASE_URL` was `https://api.themoviedb.org` (blocked from this network, 0 of 5 reachable, and missing `/3`), so mapping runs used a command-line override. The owner then corrected `.env` to `https://api.tmdb.org/3`; confirmed with a live request using `.env` as saved (HTTP 200). The code default is also `https://api.tmdb.org/3` (`nuxt.config.ts`, `server/utils/tmdb/client.ts`).
- **Mapping run:** `pnpm tmdb:map`: 92 searched, 0 failed. 73 verified automatically, 19 `needs_review`. Every automatic match was listed and read; titles and years agree with the editorial data.
- **19 manual verifications** with `pnpm tmdb:map --verify` (each fetches the TMDB record and checks season existence): `marvel_005` (TMDB title "The Fantastic 4: First Steps"), `marvel_014` (Item 47), Daredevil S1–3, Jessica Jones S1–3, Luke Cage S1–2, Iron Fist S1–2, The Defenders, The Punisher S1–2, What If...? S1–3, and `legacy_xmen_002` (TMDB title "X2"). The Defenders and The Punisher were found by searching their TMDB titles ("Marvel's The Defenders", "Marvel's The Punisher") because the first search only returned unrelated shows. These judgements were mine, based on title, year and franchise; they are not independently reviewed.
- **Result:** `pnpm validate:data --strict` passes: verified 92, needs_review 0, unmapped 0.
- **API, live (dev server):** all four routes returned 200 for a movie (`marvel_007`) and a season title (`marvel_025`). Movie: Iron Man, 126 min, 20 cast, real trailer, India provider JioHotstar (subscription) plus YouTube (rent, buy). Season title: Daredevil with season 2 (aired 2016-03-18, 13 episodes), India providers JioHotstar and VI movies and tv. `?region=US` and lowercase `?region=in` behave correctly.
- **Cache, live:** cold requests 160–550 ms, repeats about 3 ms, per-region entries separate.
- **Tests:** 105 passing. Tests no longer depend on the real mapping's progress (they use a blank baseline).

### Still not verified
- Rate-limit behaviour against the real API.
- Unreleased or sparse 2026 titles (`marvel_067`, `079`, `080`, `081`, `082`) were matched but their routes were not called; metadata may be partial.
- Crew lists for TV are show-level aggregates (48 entries for Daredevil); check what the UI needs.
- The `useProgress` composable in a browser (store is unit tested; wrapper and hydration are not).

## Next Work (Phase 04 — awaiting approval)
Before Phase 04:
1. Optionally spot-check the 19 manual mappings (list above) against themoviedb.org.
2. Decide the open data questions in `ARCHITECTURE.md` §11.9, and the `DESIGN.md` §12 items the first page needs.
Phase 04's scope is not defined in the source documents. `ai-workflow-rules.md` points to the landing page next; it needs the countdown date from `collection.target_release_date` (`2026-12-18`).

## Landing, minimal (2026-11-21, owner directives)

- **Done:** landing is the official live countdown (`f17J3AXVK5w`) full-bleed plus the two buttons, in a new `layouts/bare.vue` (no navbar or footer). Greens brightened to `#1F7A47` / `#4FD07F` (no official Doom hex; chosen by contrast). `DESIGN.md` §3 and §13, `docs/ui-context.md` updated. Deleted `DoomsdayCountdown.vue` and the four below-the-fold landing components.
- **Verified (dev server, browser):** 1440×900 and 390×844 screenshots inspected; no page scroll, no horizontal overflow at either. `pnpm lint`, `typecheck`, `test` (118) and `build` pass (build ran before the minimal rewrite; re-run it).
- **Not verified:** 768px screenshot for the final layout, reduced-motion render, keyboard focus, blocked-embed fallback, `/impeccable critique` and `audit`, Taste Skill inspector, other pages after the green and shell changes.
- **Open:** where the fan-project notice lives now; countdown date comes from the video, not `collection.target_release_date`; portrait layout has empty space around the video strip.

- **Update (same day):** portrait screens now show the poster from `app/assets/images/` with our own countdown (`DoomsdayCountdown.vue`, rewritten) and no video; landscape keeps the live video, now driven by the YouTube IFrame API so it calls `playVideo()` itself and has no reduced-motion exception. Checked at 390×844 (screenshot inspected; no page scroll). The user reported the video showing only YouTube icons in their own browser; cause unknown, not reproduced here (needs their browser's symptom). Landscape was not re-screenshotted after the scrim change.
