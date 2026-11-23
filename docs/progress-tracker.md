# Marvel: Road to Doomsday — Progress Tracker

**Last Updated**: 2026-11-23 (Phase 05 map, see "Phase 05 — consolidated status" at the end)

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

## Phase 05 — Interactive timeline (2026-11-23, not committed)

- **Built:** `/journey/doomsday` (82 main titles) and `/universe` (82 main + 10 supplemental) share one map: pan, drag, wheel/trackpad/touch-pinch zoom, fit, reset, search, type/priority/progress filters, node preview with a mark-watched toggle, YOU ARE HERE / START HERE marker, keyboard arrows between nodes, list view, no-scroll `map` layout.
- **Files:** `app/utils/roadmap-map.ts`, `map-viewport.ts`, `roadmap-data.ts`; `app/components/journey/{RoadmapExplorer,MapCanvas,MapNode,TitlePreview,TitleList,MapFilters}.vue`; `app/layouts/map.vue`; both route pages; `tests/roadmap-map.test.ts`; removed `JourneyPending.vue`.
- **Decisions:** Journey = main collection; Universe adds supplemental (the data has no journey field, ARCHITECTURE §11.9.5). Edges join only consecutive `watch_order`; position carries no story meaning (stated in the Filters panel). Supplemental titles sit in a dashed frame with no edges. Current position = first unwatched main title (no "in progress" state exists in progress storage). Non-matching titles are dimmed, not removed. Faint grid texture ships (DESIGN §1 OPEN, resolved). Specials get their own type filter because 7 titles are `special`.
- **Gaps:** progress model has only `watched`; an in-progress state would need a v2 field (`watching: boolean`) plus migration. Watching 2 before 1 leaves the marker on 1. No title detail route exists, so "Full details" is disabled. Supplemental titles have no relevance flag; shown as unclassified. Search box has an accessible label but no visible one.
- **Verified:** `pnpm lint`, `typecheck`, `test` (139 pass), `build` pass. Browser (dev server): 1440 and 390 screenshots, 768 and 1440 overview screenshots inspected; no page scroll at 1440/768/390; wheel zoom, drag, pinch (synthetic pointer events), search, empty state, arrow-key move, list view (82 rows), preview and progress write exercised by script.
- **Not verified:** real touch device, `prefers-reduced-motion` render, keyboard focus rings by screenshot, production-build browser run, `/impeccable critique` and `audit`, Taste Skill inspector, list-view screenshots. No automated component tests (no DOM test setup).
- **Next:** wait for approval of Phase 06 (title detail).

### Phase 05 revision — tree map (2026-11-23, owner request)

- **Doomsday Journey** now shows only the 23 `is_doomsday_relevant` titles in watch order; **Whole Universe** shows all 82 + 10.
- **Tree design:** main titles form a world-tree crown (rows of 3, 4, 5, … up, route winding left/right), trunk and roots as backdrop art (`TreeBackdrop.vue`), supplemental titles in a labelled grove beneath the roots. Position derives from `watch_order` only; the dataset has no branch or realm data, so none is drawn or implied. Blue/violet canopy haze is an approved palette exception (owner reference image).
- **Chrome:** site nav and header removed on map pages (`layouts/map.vue`). Toolbar has Back (to `/`), a Doomsday / Whole Universe tab switch, progress, search, filters and list toggle. The fan-project footer stays.
- **Verified:** lint, typecheck, 141 tests pass; browser screenshots at 1440 (Universe fit, Doomsday default) and 390 (preview open); no page scroll at 1440/390. Not re-verified: 768, reduced motion, production build, critique/audit.
- **Gap:** the Fandom Yggdrasill page was not used for content because titles carry no realm data; only the form (trunk, boughs, roots) is borrowed.

### Phase 05 revision 2 — real tree artwork (2026-11-23, owner request)

- Replaced the generated cone with the owner's tree image (`app/assets/images/yggdrasil-tree.webp`, from their reference) as the map backdrop. Titles are glowing orbs (ring = priority, fill = watched, gold ring = current, bolt = Doomsday-relevant) joined by thin route lines, as in the game-map reference. Labels show above zoom 0.45; below it only numbered orbs remain.
- Layout (`treePoints` in `roadmap-map.ts`): the route climbs a wavy stem up the trunk, then spirals outward through the canopy; the longest line hops the trunk where the spiral crosses it. Position is still derived from `watch_order` only; no branches or realms implied. Supplemental titles sit in a grove below the roots.
- `TreeBackdrop.vue` now just places the image. Image rights are the owner's responsibility (supplied by them; source unknown).
- **Verified:** lint, 142 tests; browser screenshots at 1440 (fit and zoomed). Not re-run after this revision: build, typecheck, 390/768 screenshots, reduced motion.

### Phase 05 revision 3 — reverted (2026-11-23)

The procedural vector tree and the growth intro animation were built and then **removed at the owner's request** (`tree-art.ts`, intro CSS and node delays deleted). The map now shows the still tree image as a temporary backdrop only.

## Phase 05 — consolidated status (2026-11-23, nothing committed)

### Done
- **Data and logic:** `app/utils/roadmap-map.ts` (layout, filters, current position, keyboard neighbours), `map-viewport.ts` (pan/zoom math), `roadmap-data.ts`. Tests in `tests/roadmap-map.test.ts` (142 pass in total). All 92 titles present, original watch order and ids intact, main vs supplemental kept separate.
- **Map UI** (`app/components/journey/`): `RoadmapExplorer`, `MapCanvas`, `MapNode`, `TitlePreview`, `TitleList`, `MapFilters`, `TreeBackdrop`. Pan/drag, wheel and pinch zoom, fit, reset, search, type/priority/progress filters, preview with mark-watched, YOU ARE HERE / START HERE, arrow-key navigation, list view, no page scroll.
- **Routes:** `/journey/doomsday` = the 23 `is_doomsday_relevant` titles in watch order; `/universe` = all 82 main + 10 supplemental (grove under the roots). No site nav on map pages (`layouts/map.vue`); toolbar has Back and a Doomsday / Whole Universe tab switch.
- **Look:** titles are glowing orbs on a tree-shaped route (stem up the trunk, spiral through the canopy), laid out from `watch_order` only. Backdrop is the owner's still image (`yggdrasil-tree.webp`, 2x upscaled, soft).
- **Checks run:** `pnpm lint`, `typecheck`, `test`, `build` pass. Browser screenshots at 1440 and 390 for earlier revisions.

### Not done / not verified
- Backdrop is a low-resolution still; the owner will supply a 4K Yggdrasil video (Loki S2 finale).
- Not re-verified after the orb redesign: 390 and 768 screenshots, reduced motion, keyboard focus rings by screenshot, production build in a browser, `/impeccable critique` and `audit`, Taste Skill inspector.
- No in-progress state in the progress model (needs a v2 `watching` flag).
- "Full details" is disabled until Phase 06.

### Next
1. **Owner:** download the video locally (not committed) and trim/encode per the plan below.
2. **Backdrop video:** place the encoded files in `public/media/`, replace `TreeBackdrop.vue` with a muted, looping, `playsinline` video inside the map layer (poster WebP fallback, still for `prefers-reduced-motion`, pause when hidden). Then re-measure where the trunk and canopy sit in the frame and update the `TREE` constants so the route lies on the tree.
3. Re-run the checks above at 1440, 768 and 390, then `/impeccable critique` and `audit`.
4. Stop and wait for approval before Phase 06 (title detail pages).

### Video plan (for the owner's file)
- **Open decision, rights:** `CLAUDE.md` §1.1 says to use only official embeds or links and not to re-host protected video. Loki footage is Marvel/Disney material, so self-hosting an extracted clip conflicts with that rule. Options: (a) keep the still image or commission/own artwork; (b) the owner accepts the risk and keeps the video out of git (public hosting is still a re-host); (c) an official YouTube embed, which cannot be panned and zoomed with the map. Decide before the video ships.
- **Trim:** only the final tree shot, 8–15 s, seamless loop if possible; strip audio.
- **Desktop:** 1920×1080 (or 2560×1440 max), H.264 High, CRF ~26, about 3–5 Mbps, plus a WebM (AV1 or VP9) variant; `-movflags +faststart`.
- **Mobile:** 720p, ideally a portrait crop around the tree (the tree is tall), H.264 baseline/main, about 1–1.5 Mbps, 24–30 fps; keep each file under about 3 MB.
- **Poster:** one WebP frame per size for first paint and reduced-motion.
- **Delivery:** `<video muted playsinline loop autoplay preload="metadata">` with `<source media>` per breakpoint, no 4K to phones, pause off-screen or when the tab is hidden.
- Example: `ffmpeg -i in.mp4 -ss 0 -t 12 -an -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 26 -preset slow -movflags +faststart tree-1080.mp4`; mobile: change to `scale=720:-2`, `-crf 28`, add `-profile:v main`; poster: `ffmpeg -i tree-1080.mp4 -frames:v 1 -c:v libwebp poster.webp`.

## Phase 05 revision 4 — intro video and branch-mapped titles (2026-11-23, owner request, not committed)

- **Intro:** clicking Doomsday Journey or Whole Universe on the landing sets `useState('playIntro')`; the map page then plays `MapIntro.vue` full screen (sound on, muted fallback if the browser refuses; Skip button, Esc, or end of video), and the map fades up behind it. Direct URLs and tab switches inside the map do not play it. Files: `public/media/intro-1080.mp4` (4.4 MB, tablet and up), `intro-720.mp4` (2.9 MB, phones), both re-encoded from the owner's 10.8 MB `intro.mp4`.
- **Tree image:** `yggdrasil-tree.webp` replaced by the owner's sharper picture (966x1628 source, Lanczos 2x with light sharpening, WebP q82, 539 KB). Lossless source kept at `C:\Users\Workstation X\Downloads\yggdrasil-tree-source.png`, not in the repo.
- **Branch mapping:** `BRANCHES` in `roadmap-map.ts` holds nine polylines traced by eye over the image (trunk, 3 left, 2 crown, 3 right). Titles are split across them by branch length in watch order (trunk first, then left low to high, crown, right high to low), and route lines run along the wood, going back to a bough's root to reach the next. Tree now 3400 map units wide. Nodes whose boxes still overlap are nudged apart. Branch tracing is approximate; retune the points if the artwork changes.
- **Verified:** lint, typecheck, 143 tests, build pass. Browser: landing click played the 720 intro (unmuted), Skip revealed the tree at `/journey/doomsday`; `/universe` fit view shows titles on the branches; no page scroll at 800x600 viewport.
- **Not verified:** 1440 and 390 screenshots of the new layout, intro on a real phone, reduced motion, intro end-of-video path (only Skip tested), production build in a browser.
- **Rights, open:** intro is Marvel/Disney footage self-hosted in `public/media/`. `CLAUDE.md` §1.1 says not to re-host protected video. Owner's call; consider keeping the files out of git.

### Phase 05 revision 5 — blend, numbering, order cues (2026-11-23, owner request, not committed)

- **Intro blend:** videos re-cropped (the source has baked-in letterbox bars, now removed so it fills the screen) and re-encoded at higher quality (1080: CRF 24, 8.3 MB; 720: CRF 26, 3.8 MB). When the intro ends or is skipped, the map is already framed so the tree sits where it does in the video's last shot (`alignToIntro` in `MapCanvas.vue`: trunk foot centred and 80% down, scale 0.84 of the frame, tuned by eye against screenshots at 800x600), crossfades in, then glides 2.2 s into the first title (`diveIn`).
- **Numbering:** map nodes now carry `order` (1-based on the visible map). Doomsday shows 1..23; Universe still shows 1..82 (= watch_order). Orbs, list and preview use it; the editorial `watch_order` is untouched.
- **Order cues:** route lines end in arrowheads pointing to the next title; the title after the current one is tagged NEXT; START HERE / YOU ARE HERE unchanged.
- **Not verified:** other viewport sizes, a real end-of-video run (seek to the end tested), mobile.
- **Revision 5b (same day):** dissolve now starts 3 s before the video ends and lasts 2.5 s (ease-in-out, overlay and map together); the camera holds 2 s, then glides to the first title. Alignment retuned against the frame 1.75 s before the end at 1918x890 (scale 1.05 of the frame, trunk foot 81% down). Checked by screenshot at 1918x890 only.

### Revision 6 — shorter intro, Doomsday list checked against Disney+ (2026-11-23)

- **Timing cut:** dissolve starts 1.8 s before the end and lasts 1.5 s; hold 1 s; dive 1.4 s.
- **Doomsday list audit:** compared with Disney+'s official "Countdown to Avengers: Doomsday" (15 titles: X-Men, X2, Cap: First Avenger, Avengers, Infinity War, Endgame, Loki, Shang-Chi, No Way Home, Multiverse of Madness, Wakanda Forever, Deadpool & Wolverine, Brave New World, Thunderbolts*, Fantastic Four: First Steps; VisionQuest reportedly added later, unconfirmed). All except X-Men and X2 were already Doomsday-relevant. Those two were only in the supplemental grove, so the Doomsday route now starts with them (`DOOMSDAY_FOX_IDS` in `roadmap-map.ts`): 25 steps. Dataset JSON untouched. X-Men '97 is not on any official or major required list; left out. Sources: thedirect.com and slashfilm.com articles on the collection.
- **Not changed:** the dataset's `is_doomsday_relevant` flags beyond that; VisionQuest (flagged `recommended`, not relevant) pending confirmation.

## Phase 06 — Title detail (2026-11-23, owner request, not committed)

- **Flow:** clicking a node or list row opens a full-screen title screen over the map (`TitleDetail.vue`); the old preview card (`TitlePreview.vue`) is removed. Top bar: Timeline (back to the map, where completed titles show), Previous / Next title in route order, close.
- **Left:** TMDB backdrop, title, date, runtime, genres, synopsis, editorial "why it matters", Trailer button (YouTube nocookie embed in a modal, only when TMDB has one) and Mark as watched.
- **Right (movie or special):** where to watch for the configured region (IN): subscription, free, ads, rent, buy, with logos and JustWatch/TMDB attribution. **Right (series):** season selector (a season-level title shows its own season only; whole-show titles list all seasons), episode list with stills, tap to mark an episode watched; season is marked watched exactly when all episodes are. No cast section yet.
- **Server:** new `GET /api/titles/:id/episodes?season=N` (service, schema, normaliser, 12 h cache, `invalid_season` error).
- **Progress:** `UserProgressState.episodes` (title id -> keys `season*1000+episode`); optional in old saves, no version bump; 2 new tests (145 pass).
- **Verified:** lint, typecheck, test, build; browser at 800x600 and 390x844: X-Men (movie, India providers, backdrop), Loki S1 (6 episodes, mark one, mark all -> title shows Completed, saved in localStorage). Not verified: trailer playback, 1440/768, reduced motion, a series with no mapped season, other regions.
- **Not done:** poster images on the map orbs (would need a TMDB fetch per title); cast; the `special` titles were not individually checked.

### Phase 06 revision — Marvel look, tracker, platform links (2026-11-23, owner request, not committed)

- Installed the project-local skills again in this checkout (`impeccable` 0.1.27 engine and `design-taste-frontend`; `.claude/` is untracked). Impeccable's design hook found no issues on the edited component; `/impeccable critique` and `audit` were not run. Impeccable reports `PRODUCT.md` as legacy schema and `DESIGN.md` as naming moved files (known, left as is by decision).
- **Look:** halftone print screen over artwork, slanted red STEP plate (new `comic-red` token, DESIGN.md 14), oversized condensed title, cut-corner gold-edged panel, route tracker strip (green watched, gold current, tap to jump, count). Mobile stacks without overlap (checked 390x844).
- **Platform links:** each provider row opens the platform in a new tab (`app/utils/provider-links.ts`, 3 tests): YouTube, Netflix, Prime Video, Google Play search for the title; JioHotstar, Apple TV, Sony LIV go to the platform home (no title deep link is available from TMDB); unknown platforms fall back to TMDB's JustWatch region page. Series screens have no provider list (owner spec).
- **Verified:** lint, typecheck, 148 tests; browser at 800x600 and 390x844 (Thunderbolts*, X2). Not verified: build after this change, trailer playback, 1440 screenshot, other titles.
- **Mobile pass (same day):** phones show artwork, step plate, title, meta, short synopsis and two full-width buttons; the where-to-watch / episodes panel is folded behind a toggle bar and opens in place (synopsis hides while open). Checked 390x844 (X2, panel closed and open).
- **Phone adapt (same day, /impeccable adapt):** the panel is now a bottom sheet (72% height, scrim, close button, Esc) instead of squeezing the page; synopsis hides under 680px height; buttons sit side by side. Checked 390x620 closed and open (Civil War). The owner's two real-phone screenshots drove this; the real devices were not tested.
- **Prev/next moved (same day):** Previous and Next now sit in a bottom row above the route strip, showing the neighbour titles, on desktop and phone; Left/Right arrow keys also move. Top bar keeps only Timeline and close. Checked 390x660 and 800x600.

## Revision 7 — tracker upgrades after the roadtodoomsday.com review (2026-11-23, owner request, not committed)

- **Doomsday set:** checked against Disney's official page (movies.disney.com/avengers-doomsday: cast incl. Kathryn Newton as Cassie Lang; Rebecca Romijn, James Marsden, Channing Tatum, Kelsey Grammer). Quantumania now `is_doomsday_relevant` / `confirmed` (Cassie Lang); X-Men: The Last Stand joins the Fox block, so the route has 27 steps. Age of Ultron, WandaVision, Thor: Love and Thunder, The Marvels, VisionQuest and Brand New Day are not cast-confirmed on that page and were left as they were (a rival site marks them core; its reasons were not verified).
- **Up-next bar** (`RouteStrip.vue`): next title with Open, watched count, titles per week to finish by the release date (`app/utils/pace.ts`), Share (native share or copy), two-tap Reset (`resetWatched`, keeps the display name). No hours-left figure: the data has no runtimes.
- **Phones** open on the list view (the intro path still lands on the tree); list rows now show the editorial Doomsday note and stack the badges.
- **SEO:** page titles reworded ("What to Watch Before Avengers: Doomsday ..."); each map page now server-renders an ordered, screen-reader-only list of the route with each title's connection text (the map itself is browser-only).
- **Verified:** lint, typecheck, 151 tests, build; browser at 800x600 and 390x660 (bar, list, SSR text present). Not done: "mark all in part" groups, side-quest notes, stop points, per-title "watch for" text, hours-left, a visible written guide page.

## Phase 08 start — achievement card (2026-11-23, owner's Canva design)

- The owner's Canva SVG was not a real vector: 18 embedded PNG layers plus text outlines. Rebuilt it by dropping the text, rendering layers headlessly with Chrome, and saving `app/assets/cards/{frame,bg,ring,knight}.webp` (frame has a transparent window; ~230 KB total).
- `AchievementCard.vue` lays everything out in the design's 810x1080 space (card scales as one piece via container units): header, vertical title and serial `ACH-NNN-YYYY`, step number in the medallion, player and date, priority label, tagline. Character window shows the title's TMDB poster (knight fallback); finish by priority: essential gold/green, recommended steel, optional bronze (CSS filters, checked visually for recommended only). Locked cards are dimmed with no title.
- `/achievements` (`app/pages/achievements.vue`): one card at a time over the Doomsday route, arrows and Left/Right keys, unlocked count, editable name on cards (stored as `displayName`).
- **Not done:** PNG export/share, unlock animation, per-character colour themes (needs the owner's picks), a link to the page from the map, final DOOMSDAY READY card, 390px layout check, no-scroll check beyond 800x600, tests for the card. Frame pixel positions were measured from the render; header/vertical text positions are by eye.
- Another session has uncommitted edits in the tree (dataset, roadmap-map, journey components); this work only adds files.

### Achievement cards: per-title look, PNG export, unlock animation (2026-11-23)

- **Every title has a card** (`/achievements`: All titles, numbered by watch order, or the Doomsday route, numbered 1, 2, 3). Each card is built from its own title: poster in the window, frame colours turned toward the poster's dominant hue (`app/utils/card-theme.ts`, priority sets the richness), vertical title, serial `ACH-NNN-YYYY`, step number, player, date, main characters from the roadmap data, type and year.
- **Export:** `Download PNG` draws the card on a canvas (`card-export.ts`, 1080x1440, same layout constants as the screen, `card-layout.ts`). Checked in the browser: file name, size and a visual match for Civil War. Limits: Safari versions without `ctx.filter` save the frame in its original colours; the poster needs TMDB's CORS headers (worked here).
- **Unlock:** the card swings in with a gold flash and light sweep; marking a title watched shows an "Achievement card unlocked · View card" notice (7 s) on the title screen that opens its card with the animation; `Replay unlock` repeats it. Reduced motion shortens it through the global rule. Unlock notice not exercised in a browser.
- **Not done:** per-character hand-picked themes, share sheet, link from the map to the page, final DOOMSDAY READY card, 390px check, tests for the card utilities. Hydration mismatch warning seen once in the console on `/achievements` (likely date or saved-name text); not investigated.
- **Story format + share (same day):** `Story 9:16` (default) and `Card 3:4` export formats. The story is 1080x1920: the card (900 px wide, between Instagram's top and bottom controls) over the poster blurred and dimmed, with `#ROADTODOOMSDAY` and the fan-project line. `Share` uses the Web Share API with the image file, which on phones opens the share sheet where Instagram Stories is offered; where file sharing is unsupported (desktop) it saves the image and says to add it to the story in Instagram. Instagram has no web link that posts a story directly. Verified: story file 1080x1920 generated and viewed in the browser; the share sheet itself was not tested (needs a phone).
- **Card cleanup (same day):** removed the dark scene behind the card (the card is now just the frame, cropped to its own outline, transparent corners; the story keeps the blurred poster backdrop). The Essential/Recommended/Optional label is gone: the plate under the name shows a one-line tagline written for each of the 82 titles (`app/utils/card-taglines.ts`, fallback "Chapter N unlocked"). Priority now only sets how rich the frame colour is. Taglines are my own wording; edit freely. Checked Civil War card and story export in the browser.
- **Doors, gallery, phones (same day):** the tagline now shrinks to one line (or wraps to two) so it never touches the plate's ornaments (`taglineFit`, shared by screen and PNG). An earned card stays behind two sliding doors ("Achievement unlocked, tap to open") until tapped once; opening plays a glow (three pulses, then a steady halo), is remembered per card, and the round arrow replays it. A Gallery view lists every unlocked card and shares one collection image (9:16, up to nine newest cards, name and collector code). Each browser gets a collector code (`useCardState`, own storage key `marvel-roadmap:cards:v1`), printed in every card's serial (`ACH-001-2PUMU`) and the collection image. Phones: bar wraps, name field on its own row, icon-only buttons. Checked at 390x700: sealed doors, open + glow, gallery image. Not tested: real phone share sheet to Instagram or Telegram (the share sheet lists them; there is no direct Telegram link because the site has no public URL yet), desktop width after this change.
- Interpretation to confirm: "each person gets a unique set of names" is done as a unique collector code plus the player's own name on every card; say if you meant something else.
- **Fixes (same day):** opening a card from the unlock notice for a Fox X-Men title showed card 1 locked, because those films only exist in the Doomsday route; the page now lands on the mode that holds the card, and the Doomsday route is the default mode (taglines added for the 10 Fox titles). Shared images no longer say "an independent fan project" or the hashtag: the footer reads "Countdown to Avengers: Doomsday" and the release date with "Collect them all", from the roadmap data. The non-affiliation notice stays in the site footer. Checked X-Men: sealed, open, story export.
- **Unlock on the title screen, unique cards, calm glow (same day):** marking a title watched now opens the doors right over the title screen (`AchievementReveal.vue`, wired in `TitleDetail.vue`): "Achievement unlocked", tap, doors slide, the card appears with Share, Download and a Collection link. Every copy is unique: the frame's hue shift and brightness and where the poster is framed are seeded by the player's collector code plus the title (`variationOf`), the serial carries the code, and a player with no name gets a codename made from that code (`codenameOf`, e.g. "Crimson Sentinel"). The glow is now a slow breathing halo only; the flash, sweep and three-pulse glow are gone. Checked in the browser with X2. The `TitleDetail.vue` and `RoadmapExplorer.vue` edits are uncommitted because those files also hold unrelated in-progress work (route strip, pace, phone list default) from another session.

### Name step and map toolbar (2026-11-23, owner request)

- **Name first:** "Doomsday Journey" and "Whole Universe" on the landing now open a dialog, "Who is walking the road?", prefilled with the saved name; Enter saves it (blank = codename) and then the intro and the map follow. Nothing about it appears on the countdown. Files: `app/components/landing/NamePrompt.vue`, `LandingHero.vue`. Checked in the browser: dialog, saved name, intro starts on the right route.
- **Map toolbar:** was one left-packed row. Now left = Back + Doomsday/Universe tabs, centre = progress, right = search, Filters, List/Map and a gold **Cards** button (trophy and unlocked count, opens `/achievements`). Phones: two rows (Back + tabs; search, filters, list, cards). Short tab labels and no progress bar graphic below 1280 px so 1100 px fits. Checked 1440, 1100 and 390. `RoadmapExplorer.vue` is uncommitted: it also holds the unrelated route-strip, pace and phone-list work in the tree.

### Loki gate, full card list, collector registry (2026-11-23)

- **Gate:** after the name, the screen fades to black, Loki's TMDB backdrop rises out of it with "Entering Yggdrasil / Welcome, NAME / Every branch is a story. Walk them in order.", then fades back to black into the intro video (about 4 s; click or Skip goes on). `LokiGate.vue`. The welcome line is my own wording, not a quote.
- **Gallery:** lists every card of the chosen set (27 Doomsday or 82 All): unlocked ones as cards, locked ones as dark slots showing only their number. Header: "4 of 27 unlocked · name · Collector #0003 · 2PUMU".
- **Unique codes, stored on the server:** `POST /api/collector` hands out a code no other player has, with a running collector number, saved in Nitro storage `collectors` (`.data/collectors` on disk, git-ignored). A code a browser already had is registered as is. 20 new codes per address per hour (in memory). Logic in `server/utils/collector.ts`, 5 tests (156 pass). On Cloudflare the storage needs a KV binding instead of `fs`. A player who clears their browser gets a new code; there are no accounts to restore one.
- Checked in the browser: gate shows Loki and hands over to the intro on `/journey/doomsday`; gallery shows 27 slots, 4 unlocked; the API returns the same number for a repeat code.
- **Smoother hand-over (same day):** the gate no longer fades to transparent (that showed the countdown page while the map loaded). It now runs about 7 s (slower rise, lines at 1.4/2.3/3.4 s), sinks its picture into black, raises a black curtain (`app.vue`, `useState('curtain')`, 8 s safety) and navigates; the intro lowers the curtain when its first frame plays. The intro video now fades up from black over 1.8 s and its sound climbs from silence over 2.5 s (eased); at the end picture and sound fade out together. `START_AT` in `MapIntro.vue` sets where the video starts if the opening needs trimming. Measured in the browser: gate -> black curtain (about 3 s in dev while the map compiles) -> intro, no frame of the landing in between.

## Deployment preparation (2026-11-23)

- Committed all outstanding work (`a9e7492`); lint, typecheck and 156 tests pass.
- Cloudflare Workers config: `wrangler.jsonc` (assets from `.output/public`, KV binding `COLLECTORS`), `pnpm build:cf` (Nitro `cloudflare_module` preset), collector storage switches to KV for that preset. `wrangler deploy --dry-run` validates (56 asset files). README has the steps.
- **Not deployed.** `wrangler` is not logged in here, the KV namespace id is a placeholder, and the TMDB token secret is not set. These need the owner's Cloudflare account.
- **Not finished:** Phase 9 (final DOOMSDAY READY card) and Phase 10 (accessibility, SEO, reduced motion, real-device and production-build checks). Intro videos are published by the owner's decision despite CLAUDE.md section 1.1.
- **Moved the target from Workers to Cloudflare Pages (same day):** Workers addresses always carry the account subdomain; Pages gives `doomsday-tracker.pages.dev`. Preset `cloudflare_pages` (output in `dist/`), `wrangler.jsonc` now has `pages_build_output_dir`. The earlier Worker `road-to-doomsday` (and its subdomain `doomsdaytracker.workers.dev`) can be deleted in the dashboard after the Pages site works.
