# Marvel: Road to Doomsday — UI Design Specification

> This document is the product-specific visual and interaction contract. Global tokens and shared component rules belong in the repository's `DESIGN.md`. The first palette/type values below are the approved starting direction to validate with Taste Skill before implementation.

## 1. Experience Definition

The product is a cinematic watch journey, not a streaming service. It helps fans choose what to watch, understand why it matters, explore the wider universe, track completion and collect achievements.

Three visual references define the experience:
1. **Streaming detail screen:** full-bleed artwork, dark readability treatment, information on the left and a contextual watch panel on the right.
2. **Game progression map:** free-moving branching path, connected nodes, highlighted current position and milestone completion.
3. **Collectible achievement card:** a title-specific card unlocked for each completed movie/series, with a final DOOMSDAY READY reward.

## 2. Color System

### Core palette

| Token | Hex | Role |
|---|---|---|
| Void | `#0B0E0C` | Main background |
| Surface | `#131916` | Base panels |
| Surface raised | `#1B231E` | Side panels and overlays |
| Surface soft | `#242D27` | Hover/selected neutral |
| Primary ink | `#F2F0E8` | Main text |
| Secondary ink | `#B7BDB5` | Supporting text |
| Tertiary ink | `#858E86` | Metadata; use carefully for contrast |
| Line | `#354039` | Borders and separators |
| Doom green | `#456B50` | Brand accent, selected paths |
| Green highlight | `#78966D` | Active map accents |
| Relic gold | `#C6A15B` | Rewards, key milestones, countdown emphasis |
| Soft gold | `#E0C98E` | Achievement display type |
| Success | `#83A98A` | Completed state |
| Danger | `#C66B61` | Error/destructive state |

### Color usage by component

- **Landing page:** void background, artwork-derived shadows, primary ink, restrained relic-gold countdown and green/gold journey actions.
- **Timeline canvas:** void background; paths use low-contrast line; essential route uses muted green; current position uses gold; completed nodes use green; optional nodes use subdued surface/line.
- **Title detail:** artwork remains dominant; dark gradient overlay protects text; right provider panel uses raised surface; primary action is green; completion confirmation uses success.
- **Achievement cards:** each title may use a controlled artwork-derived accent, but card typography and information hierarchy remain consistent. The final card uses dark green, antique gold and near-black.
- **Errors:** danger red is reserved for error or destructive actions, not decorative accents.

### State semantics

| State | Visual treatment | Additional signal |
|---|---|---|
| Not started | Neutral outline/surface | Empty progress marker |
| Watching | Green/amber partial indicator | `IN PROGRESS` label |
| Completed | Green treatment | Check icon + `COMPLETED` |
| Current position | Gold outline/highlight | `YOU ARE HERE` label |
| Optional | Muted neutral | `OPTIONAL` label |
| Error | Danger accent | Plain-language error message |
| Disabled | Reduced contrast but readable | Disabled semantics |

Never rely on color alone to communicate status.

## 3. Typography System

Use no more than two font families.

### Display: Barlow Condensed

- Weights: 600 and 700.
- Used for hero title, movie/series title, page headings, countdown numerals where it remains legible, and achievement title.
- Short uppercase labels only; do not set paragraphs in condensed type.
- Letter spacing should be tight but not cramped.

### UI and body: DM Sans

- Weights: 400, 500, 600 and 700.
- Used for navigation, descriptions, metadata, filters, buttons, provider labels, tooltips and all controls.
- Body text should use readable line height and a moderate measure.
- Use tabular numerals for countdown and progress values.

### Responsive hierarchy (starting values)

| Role | Desktop | Mobile |
|---|---:|---:|
| Hero title | 64–88px | 42–56px |
| Page title | 44–60px | 34–44px |
| Title detail heading | 48–64px | 34–42px |
| Section heading | 24–32px | 22–28px |
| Body | 16–18px | 15–17px |
| Metadata | 13–14px | 12–13px |
| Button | 14–16px | 14–16px |

These are initial targets; validate with actual copy and viewport screenshots. Avoid text below 12px for meaningful information.

## 4. Landing Page — `/`

### Purpose
Make the visitor understand the project and choose a journey immediately.

### Desktop composition
- Full-viewport cinematic backdrop; use a high-quality licensed/approved project asset or TMDB artwork where applicable.
- Apply layered dark treatment: stronger at text edges, softer over the focal image.
- Top navigation: wordmark on the left; compact links/actions on the right.
- Main content is left-aligned, vertically balanced:
  - Small context label: `THE MARVEL MULTIVERSE`
  - Main heading: `ROAD TO DOOMSDAY`
  - Tagline: `The multiverse is coming. Are you ready?`
  - Countdown in four aligned units: days, hours, minutes, seconds.
  - Two primary actions: `DOOMSDAY JOURNEY` and `WHOLE UNIVERSE`.
- If local progress exists, show a compact progress/continue strip below the actions.
- Avoid placing too many content sections on the initial screen. Below the hero, add a small explanation of the two modes and a recent/continue section only if it supports discovery.

### Mobile composition
- Keep title, countdown and both journey actions within the first one or two view heights.
- Stack actions full width.
- Use a responsive image crop that preserves the subject focal point.
- Ensure no horizontal scrolling.

### Click behavior
- `DOOMSDAY JOURNEY` → `/journey/doomsday`.
- `WHOLE UNIVERSE` → `/universe`.
- `CONTINUE JOURNEY` → restore the user's last active journey and selected/current node.
- Countdown is informational, not clickable.
- Navigation links route to their named pages.
- If no progress exists, do not show a fake progress percentage.

### States
- Countdown configured and future: live countdown.
- Countdown date reached: show a release-day/now-playing message only if product copy is approved.
- Countdown date missing: hide the timer and show a safe fallback; never invent a date.
- No saved progress: show the two journey choices without a continuation strip.

## 5. Timeline Map — Doomsday Journey and Whole Universe

### Purpose
Make the Marvel roadmap feel like a game progression map, not a poster catalogue.

### Canvas layout
- Full viewport beneath a compact top bar.
- Dark void canvas with a subtle atmospheric texture or restrained grid; the map itself must remain visually dominant.
- Curated connected paths and branching routes.
- Nodes are positioned using roadmap data; do not derive story connections from TMDB.
- Provide pan, zoom, fit-to-map, reset, search and filters.
- Show a compact progress summary and an accessible list alternative.

### Node visual design
Each node includes:
- Poster thumbnail or title artwork.
- Short title label on focus/selection.
- Movie/series indicator.
- Priority indicator.
- Watched/current/upcoming status.

Node states:
- Not started: subdued border and artwork treatment.
- Watching: partial progress ring/marker.
- Completed: clear completed mark and green edge.
- Current: gold focus ring and `YOU ARE HERE`.
- Optional: muted node with explicit optional label.
- Selected: raised/outlined state distinct from current.

### Map controls
- Zoom plus and minus.
- Fit map.
- Reset view.
- Search titles.
- Filter by essential/recommended/optional, movie/series, phase/era and completion status.
- Toggle map/list view.
- Progress summary: completed count / applicable total and percentage.

### Click behavior
- Click/tap node → open selected title detail drawer or detail route.
- Click backdrop/outside drawer or close control → close details and preserve exact map pan/zoom position.
- Mark watched from detail → update node immediately, recalculate progress, unlock title achievement.
- Click search result → pan/zoom to node and select it.
- Filter → hide or de-emphasise nonmatching nodes; do not corrupt progress or remove the selected title silently.
- Fit map → animate viewport to show all visible nodes.
- Reset view → restore the curated default camera position.
- Zoom buttons and trackpad/wheel zoom → zoom around pointer/viewport centre without losing map usability.

### Mobile behavior
- Support touch pan and pinch zoom.
- Provide an obvious `LIST VIEW` alternative.
- Filters open in a bottom sheet or compact panel.
- Node hit areas must be large enough for touch.
- Do not rely on hover for essential title information.

### Accessibility
- Keyboard-accessible node list with the same content/actions as the map.
- Visible focus indicators.
- Announce completion changes accessibly.
- Respect reduced motion.

## 6. Title Detail Experience — `/title/:slug`

### Purpose
Answer: what is this title, why should I watch it, where can I watch it, and what should I do next?

### Desktop composition (inspired by the first reference screenshot)
- Full-bleed TMDB backdrop as the page background.
- Multi-stop dark overlay; left side receives the strongest readability treatment.
- Left/main column:
  1. Back button.
  2. Poster or key artwork thumbnail.
  3. Title and release year.
  4. Media type, runtime or season count.
  5. Synopsis.
  6. `WHY THIS MATTERS` project-authored section.
  7. `DOOMSDAY CONNECTION` project-authored section with spoiler level.
  8. Primary actions: `WATCH TRAILER`, `MARK AS WATCHED`, `ADD TO WATCHLIST`, `SHARE`.
- Right panel:
  - Heading: `WHERE TO WATCH`.
  - Provider logo/name.
  - Availability category: subscription, free, ads, rent or buy, only if returned by provider data.
  - External destination when the API supplies a valid destination.
  - If no providers exist for India, show `Availability not listed for India`.
- Cast strip and related titles can sit below the primary detail content.

### Mobile composition
- Backdrop at top with a dark gradient.
- Title, synopsis and editorial connection stacked.
- Provider panel becomes a normal content section.
- Trailer player scales to viewport width.
- Completion action remains prominent and reachable.

### Click behavior
- Back → return to prior map state where possible.
- Trailer → open an accessible modal/player; playback starts only after user action.
- Close trailer → return to detail without losing scroll position.
- Mark as watched → confirm or update status; persist locally; show achievement-unlocked state.
- Add to watchlist → toggle saved state and update label to `REMOVE FROM WATCHLIST`.
- Share → use native share where supported; fallback to copying a canonical title URL.
- Provider row → open only a validated legitimate destination in a new tab.
- Cast member → optional person detail panel only if that feature is implemented.
- Related title → open its detail route.

### Data and fallback behavior
- TMDB provides metadata, images, credits and videos.
- Curated project data provides watch order, priority, importance and Doomsday connection.
- Missing poster/backdrop → project fallback artwork.
- Missing trailer → show `No trailer available`.
- Missing provider → show explicit unavailable state, not guessed providers.
- TMDB failure → keep curated title and editorial information visible.

## 7. Trailer Player / Modal

- Modal overlays the current title detail.
- Large responsive player with 16:9 aspect ratio.
- Show title and video type (Trailer/Teaser/Clip) where supplied.
- User must explicitly press play.
- Close button and Escape close the modal.
- Focus is trapped while open and restored to the trigger on close.
- If no supported video host/key is available, do not render a broken iframe.

## 8. Individual Achievement Cards

### Unlock rule
A title achievement unlocks when that title is marked completed. The initial system is local/self-reported.

### Card composition
- Title artwork or backdrop crop.
- Project identity/fan-made label.
- Achievement heading: `MISSION COMPLETE`.
- Title name.
- User's display name.
- Supporting line: `HAS COMPLETED THIS MISSION`.
- Completion date.
- Achievement ID or roadmap reference.
- Small story-themed accent/quote, only if curated.

### Variants
- Movie card: movie artwork and movie title.
- Series card: series artwork and accurate series completion wording.
- Season card: only if season tracking is implemented.
- Avoid implying an entire series was watched when only a season or episode was completed.

### Click behavior
- `MARK AS WATCHED` → persist completion, unlock card and show an achievement reveal.
- `VIEW ACHIEVEMENT` → open full card preview.
- `DOWNLOAD PNG` → export high-resolution image.
- `SHARE` → use native share if image sharing is supported; otherwise download and offer copy-link fallback.
- `EDIT NAME` → update display name across future generated cards; ask before changing a previously exported image (exported files are static).

## 9. Achievement Collection — `/achievements`

### Layout
- Page title: `MY ACHIEVEMENTS`.
- Summary of unlocked achievements and roadmap progress.
- Featured final achievement area when unlocked.
- Gallery grouped by movies, series and special achievements.
- Locked achievements may appear as subdued silhouettes only when they do not reveal spoilers.
- Filters: all, movies, series, special.
- Avoid generic equal three-column dashboard cards; use a poster-led collection grid with varied but consistent visual hierarchy.

### Click behavior
- Achievement tile → open large preview.
- Download → export PNG.
- Share → native share or fallback.
- Locked tile → show the exact completion requirement, without claiming it is unlocked.

## 10. Final DOOMSDAY READY Card

### Unlock rule
Unlock only when every Doomsday Journey title with priority `essential` is marked completed. `recommended` and `optional` titles must not block the final achievement.

### Visual treatment
- More prestigious than an individual title card.
- Dark emerald/charcoal background, antique gold details and silver accents.
- Original abstract multiverse/armor-inspired geometry; do not copy a protected character illustration or logo.
- Main heading: `DOOMSDAY READY`.
- User display name.
- Supporting line: `HAS COMPLETED THE ROAD TO DOOMSDAY`.
- Completion statement: `100% ESSENTIAL ROADMAP COMPLETE`.
- Completion date.
- Fan-made project label.

### Customisation
- Display name.
- Theme: Doom-inspired, Multiverse, Avengers-inspired, Minimal.
- Card style: Cinematic or Minimal.
- Show/hide completion date.
- Preview updates immediately when a setting changes.
- Save customisation locally.

### Click behavior
- Final essential item completed → recalculate gate and unlock final card.
- `CUSTOMISE CARD` → open customiser.
- Name input → live preview update.
- Theme selector → update palette and decorative treatment.
- Style selector → change composition density, not just color.
- Date checkbox → add/remove date from preview and export.
- `DOWNLOAD` → export PNG.
- `SHARE` → native image share where supported; otherwise download.
- If a user changes a title from completed to incomplete, recompute eligibility and explain that the final card is no longer currently earned. Do not silently erase an already downloaded image.

## 11. Search, Filters and Global Interactions

- Search matches curated title names and aliases.
- Search results show poster, title, year, type and priority.
- Selecting a result opens its detail or focuses its map node depending on current context.
- Filters are combinable and visibly active.
- Clear filters restores the default view.
- Empty search results show a helpful message and clear-search action.
- Every menu, tooltip, modal and popover supports keyboard and touch.

## 12. Responsive and Accessibility Contract

Test at:
- 1440px desktop.
- 768px tablet.
- 390px mobile.

Requirements:
- No horizontal overflow.
- No text clipped or hidden behind artwork/panels.
- Touch targets meet comfortable mobile sizing.
- Keyboard focus visible.
- Dialog focus managed correctly.
- Contrast meets WCAG AA for normal text and controls.
- Reduced-motion mode disables nonessential transitions and parallax.
- No autoplay audio.
- Images have appropriate alt text; decorative backdrops are hidden from assistive technology.

## 13. Loading, Empty, Error and Fallback States

Every dynamic area must define:
- Loading skeleton sized like the final content.
- Empty state with useful next action.
- Error state with clear message and retry where appropriate.
- Missing artwork fallback.
- Missing trailer state.
- Missing provider state.
- Offline/network failure behavior.

A TMDB outage must not blank the curated roadmap or block local progress.

## 14. Visual Acceptance Checklist

- [ ] Page follows the approved visual direction and palette.
- [ ] Display and body fonts are loaded and correct.
- [ ] Desktop, tablet and mobile screenshots reviewed.
- [ ] The hero hierarchy and both journey actions are clear.
- [ ] Timeline can pan, zoom, select nodes and preserve viewport state.
- [ ] Mobile list alternative works.
- [ ] Detail view matches the streaming-inspired composition.
- [ ] Watch-provider data is real and region-specific.
- [ ] Trailer modal has valid video data and accessible controls.
- [ ] Mark watched updates local progress and unlocks the correct title achievement.
- [ ] Achievement PNG export is inspected.
- [ ] Final achievement unlocks on essential-only completion.
- [ ] All visible controls have working click behavior.
- [ ] Loading, empty, error and unavailable states are implemented.
- [ ] Reduced motion, keyboard focus and contrast are checked.
- [ ] Taste Skill inspection has no unresolved FAIL.
- [ ] Impeccable critique/audit findings are resolved or justified.
