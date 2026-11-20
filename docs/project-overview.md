# Marvel: Road to Doomsday — Project Overview

## Purpose

Create a fan-made, cinematic website that helps Marvel fans decide what to watch before Avengers: Doomsday, explore a wider Marvel universe timeline, track viewing progress, and celebrate progress through personalised achievement cards.

This is a fun content-creation project, not a commercial streaming service or a replacement for TMDB/IMDb.

## Users

- Marvel fans preparing for Avengers: Doomsday.
- Casual viewers who do not know which films and series are important.
- Fans who want to explore a larger Marvel timeline.
- Visitors who enjoy collecting and sharing progress achievements.

## Product Principles

1. **Cinematic first:** the experience should feel like entering a fictional universe, not managing a spreadsheet.
2. **Clarity over completeness:** explain why a title matters and distinguish essential from optional.
3. **Progress is rewarding:** every completed title can unlock a personalised achievement.
4. **User-controlled:** no account is required for the initial experience.
5. **Editorial accuracy:** roadmap order, priority and story connections are curated by the project.
6. **Respect rights and availability:** use TMDB under its terms, link to legitimate providers, and avoid unauthorised content sources.

## Primary Goals

- Present a countdown-led cinematic landing page.
- Offer two entry points: **Doomsday Journey** and **Whole Universe**.
- Provide a free-moving interactive timeline map with pan and zoom.
- Provide rich detail pages for each movie or series.
- Fetch posters, backdrops, descriptions, cast, videos and provider availability from TMDB.
- Let users track watched titles without registration.
- Generate a unique achievement card for each completed title.
- Unlock a final personalised **DOOMSDAY READY** card after all essential roadmap titles are completed.
- Make achievements easy to download and share.

## Core User Flows

### Flow A — Start a journey

1. Visitor lands on the cinematic homepage.
2. Visitor sees the Doomsday countdown and project identity.
3. Visitor chooses **Doomsday Journey** or **Whole Universe**.
4. The selected experience opens its corresponding map/timeline.

### Flow B — Explore the map

1. Visitor pans and zooms around the map.
2. Nodes communicate title type, priority and completion status.
3. Visitor selects a node.
4. A title detail view opens with synopsis, artwork, trailer, cast, provider information and project-authored story relevance.
5. Visitor can mark the title as watched or return to the map.

### Flow C — Complete a title and earn an achievement

1. Visitor marks a movie or series as watched/completed.
2. The app records local completion state and completion date.
3. The app generates the matching title achievement card using the visitor's display name and the title's artwork.
4. Visitor can preview, download or share the card.
5. The timeline node and achievement collection update immediately.

### Flow D — Unlock the final achievement

1. App checks completion of every roadmap item marked `essential`.
2. Optional titles do not block completion.
3. When all essential items are complete, unlock the **DOOMSDAY READY** achievement.
4. Visitor personalises the final card and shares it.

## In Scope — Initial Release

- Responsive cinematic landing page.
- Configurable countdown date.
- Doomsday Journey and Whole Universe modes.
- Free-moving timeline/map with pan, zoom, connected nodes and a current-position indicator.
- Curated roadmap data stored in the project.
- TMDB metadata and image integration.
- Official trailer/video discovery through TMDB video metadata and supported embeds.
- Title details and legitimate watch-provider availability for India (`IN`) initially.
- Local viewing progress.
- Per-title achievement generation.
- Achievement collection page.
- Final DOOMSDAY READY achievement.
- Display-name and card-theme customisation.
- PNG export and supported native sharing.
- SEO basics, social preview metadata, error/loading/empty states.

## Out of Scope — Initial Release

- User accounts, authentication and cloud sync.
- Server-verified achievements or public profile pages.
- User-generated reviews, comments or social feed.
- Hosting, downloading or redistributing movies, episodes or trailers.
- Torrent sources or links to unauthorised streams.
- Building a full replacement for TMDB.
- Complex admin CMS unless roadmap maintenance proves it necessary.
- Paid subscriptions or monetisation.
- Storing TMDB images or trailers in the project's own asset storage without a clear rights and licensing basis.

## Success Criteria

- A first-time visitor can understand the two journey modes without explanation.
- A visitor can navigate the timeline using mouse, trackpad and touch.
- Selecting a node opens the correct title detail view.
- TMDB metadata is matched by stored TMDB ID, not fragile title-name search at runtime.
- TMDB failure does not break the curated roadmap; a useful fallback is shown.
- A user can mark a title complete and see the state persist after refresh on the same browser.
- Every completed title can produce the correct personalised achievement card.
- The final achievement unlocks only when all essential titles are complete.
- Optional titles never prevent the final unlock.
- Card export is legible at social-sharing dimensions.
- No private TMDB API credential is exposed to browser code.
- Build, typecheck, tests and responsive visual checks pass before release.
