# Design System — Marvel: Road to Doomsday

**Status:** Approved direction **Sanctum** (2026-11-21). Tokens, type and primitives are implemented in `app/assets/css/main.css` and `app/components/ui/`. Items marked **OPEN** are unresolved and must not be decided silently.

**Source of truth order:** `PRODUCT.md` (what the product is) → `docs/ui-context.md` (page and interaction contract) → this file (visual system). The conflicts recorded in §11 are resolved in favour of the first two.

## 1. Experience principles
- Mysterious, dramatic and premium: a fictional-universe journey, not a SaaS dashboard or a streaming catalogue.
- Clarity first. Cinematic presentation never blocks navigation, reading or accessibility.
- Progression is shown with lines, paths and markers. Colour is never the only signal.
- Motion explains state. Nothing autoplays, and nothing pulses permanently.

## 2. Direction: Sanctum
Doom-forward and armoury-like. Dark charcoal-green surfaces, etched hairline structure (armour seams on the map, corner marks on cards), and gold kept for the current position and achievements. Chosen over *Dossier* (too quiet for the countdown's sense of anticipation) and *Atlas* (leans on glow and motion the spec restricts). One idea from Atlas is kept: a faint coordinate grid as a map background texture. **OPEN:** whether the grid texture ships; decide with the map page.

## 3. Colour tokens

All tokens are defined once in `app/assets/css/main.css` under `@theme`. Use the utilities (`bg-void`, `text-ink-muted`); never write hex values in components.

| Token | Hex | Use | Verified pairing |
|---|---|---|---|
| `void` | `#0B0E0C` | Page background | Base |
| `surface` | `#131916` | Primary panels, map chrome | ink 15.6:1 |
| `surface-raised` | `#1B231E` | Detail panels, menus, overlays | ink 14.1:1 |
| `surface-soft` | `#242D27` | Hover and selected neutral | ink 12.4:1, muted 7.4:1 |
| `ink` | `#F2F0E8` | Primary text | 17.0:1 on void |
| `ink-muted` | `#B7BDB5` | Secondary text | 10.1:1 on void |
| `ink-subtle` | `#858E86` | Metadata. **Not on `surface-soft`** (4.2:1) | 5.7:1 on void, 4.8:1 on raised |
| `line` | `#354039` | Decorative dividers only (1.8:1, not a control boundary) | — |
| `line-strong` | `#667369` | **Added.** Control boundaries, inputs, unselected outlines (≥3:1) | 3.5 / 3.2 / 2.9 on void / surface / raised |
| `doom-green` | `#456B50` | Primary button fill, essential badge, selected paths | ink 5.3:1 |
| `doom-green-bright` | `#78966D` | Hover fill, watching state, active paths | void 5.9:1 |
| `relic-gold` | `#C6A15B` | Current position, focus ring, achievement emphasis | 8.0:1 on void |
| `gold-soft` | `#E0C98E` | Achievement and current-state text | 9.9:1 on raised |
| `success` | `#83A98A` | Completed state | 7.4:1 on void |
| `danger` | `#C66B61` | Error icons and fills | non-text 5.2:1 on void |
| `danger-text` | `#D98278` | **Added.** Error text on dark surfaces (`danger` is 4.35:1 on raised) | 6.3 / 5.8 / 5.3 / 5.0 on void / surface / raised / soft |

**Rules**
- Gold is a reward and current-position accent, not a second primary colour.
- Green identifies the journey and completed progression. Use `doom-green` for fills and `doom-green-bright` for text or active states.
- No pure black, neon, purple gradients, permanent glows or rainbow accents.
- Gradients appear only as image overlays for legibility (title detail, hero). Never as decoration on components.
- Glass effects: opaque panels by default. Backdrop blur is limited to at most two overlay types (trailer modal backdrop and the map's floating control bar, **OPEN**).

## 4. Typography

Two families only.

| Role | Family | Weights | Loaded from |
|---|---|---|---|
| Display: hero, page titles, title names, section headings, short uppercase labels | Barlow Condensed | 600, 700 | `@fontsource/barlow-condensed` (self-hosted) |
| UI and body: navigation, copy, controls, metadata, forms | DM Sans (variable) | 400–700 | `@fontsource-variable/dm-sans` (self-hosted) |

Self-hosting avoids third-party font requests and layout shift from late loading. Fallbacks are system sans-serif stacks.

| Token | Desktop | Mobile (fluid) | Line height | Notes |
|---|---|---|---|---|
| `text-hero` | 88px | 42px | 0.95 | Display, 700, uppercase |
| `text-page` | 60px | 34px | 1.02 | Display, 600–700, uppercase |
| `text-heading` | 32px | 22px | 1.1 | Display, 600 |
| `text-body` | 18px | 15px | 1.6 | DM Sans, measure ≤ 65ch |
| `text-meta` | 13px | 13px (min 12px) | 1.4 | DM Sans |
| `text-control` | 14px | 14px | 1.25 | DM Sans, 600, uppercase, tracking 0.06em |

- Uppercase is for short labels and buttons only. Do not set paragraphs in condensed type.
- Countdown and progress numerals use `tabular-nums`. No third font for numbers.
- No monospace anywhere in the UI.

## 5. Layout system
- **Content width:** `--container-content` = 80rem (1280px). Full-bleed for heroes, maps and artwork.
- **Gutters:** 16px on mobile, 24px at 768px, 40px at desktop.
- **Spacing:** Tailwind's 4px-based scale. Section rhythm: 64px between page sections on desktop, 48px on mobile.
- **Grid:** 12 columns at desktop, 8 at tablet, 4 at mobile. Detail views use a 7/5 split (main/panel) on desktop and a single column below 1024px.
- **Radius:** `control` 4px (buttons, badges, inputs); `panel` 8px (cards, panels); `media` 16px (hero media and modals).
- **Borders:** 1px. `line` for dividers, `line-strong` for controls.
- **Shadows:** none at rest. Overlays may use a single `0 24px 48px` shadow at 40% black.
- **Breakpoints:** Tailwind defaults. Design targets 390px (mobile), 768px (tablet), 1440px (desktop). Check each for horizontal overflow.

## 6. Component language

Implemented:
- **`UiButton`** (`app/components/ui/UiButton.vue`). Variants: `primary` (doom-green, ink text; hover turns bright green with void text), `secondary` (raised surface, `line-strong` border; hover gold border), `ghost` (muted text). Disabled: soft surface, muted text, not-allowed cursor; the label stays readable. Minimum height 44px. Press: 1px translate. Renders a `NuxtLink` when `to` is set.
- **`UiBadge`** (`app/components/ui/UiBadge.vue`). Tones: essential, recommended, optional, current, watching, completed, not-started, error. Each has a text label and a Lucide icon. Optional uses a dashed border. Labels are uppercase meta text.

Specified, not yet built (built when the owning page is built):
- **Links:** inline links use `doom-green-bright` text with a 2px underline offset; visited state unchanged.
- **Navigation:** top bar, wordmark left, links right. Mobile collapses to a labelled menu button. **OPEN:** the mobile menu pattern (sheet vs. disclosure).
- **Cards:** `surface` panel, `panel` radius, hairline border. No card inside a card. Hover lifts 2px only where the whole card is a link.
- **Dialogs and modals:** `surface-raised`, `media` radius, focus trapped, Escape closes, focus returns to the trigger.
- **Inputs:** `surface` fill, `line-strong` border, `gold` focus ring, visible labels (not placeholder-only).
- **Tooltips:** supplementary only. Never the sole source of information.
- **Progress indicators:** a labelled bar plus a numeric value, e.g. "7 of 12 essential".
- **Map nodes:** shape encodes type (rounded square = movie, rounded rectangle with stacked edge = series — **OPEN**, confirm with the map page). Priority: essential = solid outline, recommended = dashed-light, optional = dashed. Status uses the badge tones.
- **Achievement cards:** fixed 4:5 export frame. Title artwork crop, label row, title, user name, date. Final card uses `doom-green`/`void` backgrounds, gold details.
- **Loading:** skeletons sized like the final content. **Empty:** one sentence and one action. **Error:** what happened, what to do, retry when meaningful.

## 7. Page specifications

Each page must satisfy `docs/ui-context.md` in full. The summaries below set the visual intent.

**1. Landing (`/`).** Full-viewport backdrop artwork with layered dark treatment. Wordmark top left. Heading `ROAD TO DOOMSDAY` in hero display. Countdown in four units, relic-gold numerals, subordinate to the choices. Two primary actions side by side (desktop) or stacked full width (mobile). Fan-project note visible below the fold. Continue strip only when progress exists. Mobile: title, countdown and both actions within the first two screens.

**2. Doomsday Journey map (`/journey/doomsday`).** Full viewport under a compact top bar. Map fills the viewport. Floating control group (zoom, fit, reset, search, filters, list toggle) that never covers the current node. Essential route in doom-green; current node gold with "You are here". Progress summary in the top bar. List view is a first-class alternative, not a fallback.

**3. Whole Universe map (`/universe`).** Same map system as Doomsday, denser node field, default filter excludes nothing. Essential/recommended/optional shown via priority badges and outline styles. Phase or era is a filter, not a colour.

**4. Movie detail (`/title/:slug`, movie).** Full-bleed backdrop with left-weighted dark overlay. Left column: back, poster, title and year, runtime, synopsis, "Why this matters", "Doomsday connection" with spoiler level, actions (Watch trailer, Mark as watched, Add to watchlist, Share). Right panel: "Where to watch" for India, or "Availability not listed for India". Mobile: single column, provider panel as a normal section.

**5. Series detail (`/title/:slug`, series).** Same structure as movies. Season count replaces runtime. Completion copy must not imply every episode was watched; completion is title-level only (per `docs/ui-context.md` §8).

**6. Watchlist and progress (`/progress`).** **OPEN:** this page is named in the brief but has no specification in `docs/ui-context.md`. Proposed: a list grouped by Watching, Watchlist and Completed, with a progress summary per journey. Confirm before building.

**7. Achievement collection (`/achievements`).** Page title `MY ACHIEVEMENTS`. Summary row (earned count, essential progress). Final card featured when unlocked. Poster-led grid, not equal dashboard tiles. Filters: all, movies, series, special. Locked tiles show the exact requirement, never a spoiler.

**8. DOOMSDAY READY (`/achievements/doomsday-ready`, **OPEN** route).** Full-viewport card preview with the customiser beside it on desktop, below it on mobile. Dark emerald and void, antique gold details, silver accents, original geometry (no protected illustration or logo). Heading `DOOMSDAY READY`, display name, completion statement, date (toggle), fan-project label. Download and share actions.

## 8. Interaction and motion
- Durations: 150ms for controls, 250–400ms for panel entry, map pan and zoom follow the input, unlock reveal ≤ 1.2s.
- Easing: `ease-out` for entry, `ease-in-out` for state changes.
- Motion explains: map movement, node selection, panel entry, progress completion, achievement unlock, countdown digits changing.
- **Reduced motion:** `prefers-reduced-motion: reduce` shortens all animation and transition durations to effectively instant (global rule in `main.css`). Map pan and zoom switch to instant jumps. Parallax is disabled.
- No autoplay audio. Trailers start only after an explicit press.
- Hover is never the only way to reveal information.

## 9. Responsive and accessibility

**Responsive** (checked at 1440, 768 and 390px):
- No horizontal page overflow. Wide content (tables) scrolls inside its own container with a visible edge.
- Touch targets at least 44px. Map nodes at least 44px hit area on touch.
- Heroes use a responsive crop that keeps the subject's focal point.

**Accessibility:**
- Semantic landmarks (`header`, `main`, `nav`, `footer`) and one `h1` per page with ordered headings.
- Visible focus: 2px `relic-gold` outline, 2px offset, on every interactive element. Keyboard reaches all controls.
- Text contrast: AA minimum, AAA where achieved (see §3). Non-text control boundaries use `line-strong` (≥3:1).
- Status is never colour-only: every badge has a text label and an icon.
- Icon-only controls have accessible names. Meaningful images have alt text; decorative backdrops are `aria-hidden`.
- A skip link is the first focusable element (in `layouts/default.vue`).
- The map has a keyboard-navigable list equivalent with the same actions.

## 10. Design acceptance criteria
- Cinematic and purpose-built, not a generic admin dashboard.
- Both journey choices are identifiable on the first screen.
- Map states and progress are understandable without colour.
- Content stays readable over artwork.
- Every control has complete interaction states.
- Desktop, tablet and mobile layouts are intentionally designed and inspected.
- Reduced motion, keyboard focus and contrast are verified.
- The final UI matches this specification.

## 11. Conflicts and resolutions

| Source | Conflict | Resolution |
|---|---|---|
| Taste Skill (`design-taste-frontend`) | Assumes photograph-led marketing pages, one section per screen, hover-lift cards, shader effects on tech pages, and stand-in photography. | Product spec wins. No stand-in photography (TMDB artwork is used, with fallbacks). No shader or scene effects. Its checker is applied only where its rules match. |
| Taste Skill | Its skill file registers a Stop hook that runs its `gate.mjs` checker. | Not verified whether it fires in this project. Treat it as active until checked; the checker is only meaningful for its own build folders. |
| `CLAUDE.md` §7 | Provisional fonts and palette. | Confirmed in §3–§4. Two tokens added for contrast (`line-strong`, `danger-text`). |
| `PRODUCT.md` | Legacy Impeccable schema. | Kept as the product authority. `init` was declined by the user. |

## 12. Open decisions

| # | Decision | Owner | Needed before |
|---|---|---|---|
| 1 | Whether the map background shows the faint coordinate grid | Design | Journey map |
| 2 | Map node shape for series vs. movie | Design | Journey map |
| 3 | Mobile navigation pattern (sheet or disclosure) | Design | Navigation |
| 4 | Route and spec for `/progress` | Product + design | Watchlist page |
| 5 | DOOMSDAY READY route | Product | Final achievement |
| 6 | Backdrop blur on the map control bar | Design | Map |
