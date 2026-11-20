# Product Definition — Marvel: Road to Doomsday

**Status:** Product concept and scope baseline  
**Project type:** Fan-made companion website for entertainment and content creation  
**Initial audience/region:** Marvel fans; viewing-provider information should initially prioritise India  
**Affiliation:** Independent, unofficial fan project; not affiliated with or endorsed by Marvel or Disney

## 1. Product vision
Marvel: Road to Doomsday helps fans follow a curated viewing journey through selected Marvel films and series before *Avengers: Doomsday*. It turns a potentially confusing watch order into a visual, explorable journey and gives fans a fun way to track progress and celebrate completion.

This is a fan experience and content-creation side project, not a streaming service and not an official Marvel product.

## 2. Core user experience
The experience has two entry paths:

1. **Doomsday Journey** — a curated roadmap focused on titles considered relevant to the journey toward *Avengers: Doomsday*.
2. **Whole Universe** — a broader Marvel viewing map for users who want to explore beyond the essential roadmap.

The landing experience introduces the concept and displays a live countdown to the currently configured Doomsday release date. The date must be maintained as configurable data and verified before launch; do not assume a hardcoded date is permanently correct.

After choosing a journey, users explore a connected, game-skill-tree-inspired map. Selecting a title opens a cinematic detail view with useful viewing information and editorial context.

## 3. Target users and needs
- **Marvel fans who want a clear watch order:** need a guided path rather than an unstructured list.
- **Fans who want context:** need to understand why a title matters and how it connects to the larger story.
- **Completion-focused fans:** want to mark titles watched and see their progress.
- **Casual explorers:** want to browse the wider universe without being forced through the essential route.

## 4. Main product areas

### 4.1 Landing page
- Cinematic introduction to the project.
- Doomsday countdown.
- Two clear entry actions: Doomsday Journey and Whole Universe.
- Clear unofficial fan-project positioning.

### 4.2 Interactive journey map
- Full-screen or viewport-filling, free-moving map.
- Pan, zoom, and pinch-to-zoom support.
- Connected title nodes and branching paths.
- Visual states for completed, current, upcoming, and optional titles.
- A clear “You are here” marker based on the user's locally stored progress.
- Search and filters.
- Fit-to-map and reset controls.
- Accessible list-based alternative for users who cannot or do not want to use the visual map.

### 4.3 Title details
Each film or series detail view may include:
- Title, release year, overview, runtime or series information.
- Poster and backdrop artwork.
- Cast and crew.
- Trailer playback when a valid trailer is available.
- Curated “Why this matters” explanation.
- Curated “Doomsday connection” explanation.
- Legal “Where to watch” provider options for the selected region.
- Mark as watched, add/remove from watchlist, and share actions.

TMDB can supply factual media metadata and artwork. Editorial explanations and roadmap classification are maintained by this project and must not be presented as TMDB facts.

### 4.4 Progress tracking
- Users can mark a title as watched or unwatched.
- Users can add or remove titles from a personal watchlist.
- Progress is stored locally in the browser for the initial version.
- No account is required in the initial version.
- Progress is user-reported and is not independently verified.

### 4.5 Achievements
- Completing a title can create an individual achievement card for that title.
- Each card should use that title's artwork and show its title, the user's chosen display name, and completion date when enabled.
- Users can preview and download the card as PNG.
- Use native sharing when supported; provide a sensible fallback.
- Provide a collection view of earned cards.

### 4.6 Final achievement: DOOMSDAY READY
- Unlock when all roadmap titles classified as `essential` are marked watched.
- Optional and recommended titles must not block the final achievement.
- The final card should feel more significant than an individual title card.
- Allow a display name and a small set of presentation options, such as theme, card style, and completion-date visibility.
- Clearly communicate that completion is based on the user's self-reported progress.

## 5. Roadmap data rules
The roadmap is editorial project data and is the source of truth for:
- Watch order and dependencies.
- Journey membership.
- Priority classification (`essential`, `recommended`, `optional`).
- Branching relationships.
- “Why this matters” and “Doomsday connection” copy.

Each title should have a stable internal identifier and a verified TMDB identifier plus media type where available. Do not rely on runtime title searches as the permanent identity mechanism.

The initial data model should be simple and maintainable. The roadmap should be editable without rewriting the map UI.

## 6. Data and integration boundaries
- **TMDB:** artwork, factual metadata, cast/crew, videos, and regional watch-provider data where available.
- **Local browser storage:** watched status, watchlist, display-name preference, and achievement records for the initial release.
- **Curated project data:** roadmap order, classifications, connections, and editorial explanations.

TMDB data and provider availability can be incomplete or region-dependent. Display an honest unavailable state rather than inventing missing data. Keep API credentials out of client-side source code when integration is implemented.

## 7. MVP boundaries
The initial experience is a client-focused website. The first implementation does not require:
- User accounts or authentication.
- A database or cloud synchronisation.
- Social feeds, comments, or community profiles.
- Streaming or hosting video content.
- Cloudflare services or other cloud infrastructure.
- Payment, subscriptions, or monetisation flows.

Do not add these without explicit product approval.

## 8. Non-goals and content safeguards
- This project does not stream films or episodes.
- It does not distribute copyrighted video.
- It does not link to piracy or unauthorised streaming sources.
- It does not claim official affiliation or endorsement.
- It does not claim that user progress is verified.
- It is not intended to replace official release information or provider catalogues.

## 9. Product success criteria
The product is successful when a first-time visitor can:
1. Understand the purpose and unofficial nature of the project.
2. Choose either journey without confusion.
3. Navigate the roadmap on desktop and mobile.
4. Open a title and understand its viewing information and relevance.
5. Mark progress and see it persist after refreshing the page.
6. Earn and share an achievement card.
7. Understand exactly what is required to unlock DOOMSDAY READY.

## 10. Open decisions
These decisions require confirmation during the relevant product/design/data phases:
- Final curated title list and exact order for each journey.
- Exact release date used by the countdown and how it will be maintained.
- Final visual direction and typography.
- Whether the Whole Universe map includes every MCU title or a deliberately selected subset.
- Which browsers and minimum device capabilities are officially supported.
