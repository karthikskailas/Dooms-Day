# Engineering Standards

**Applies to:** All application code and project documentation  
**Baseline stack:** Nuxt 4, Vue 3, TypeScript, Tailwind CSS, pnpm

## 1. General principles
- Prefer readable, straightforward code over clever abstractions.
- Keep components focused and small enough to understand.
- Keep business rules out of large page components.
- Avoid premature optimisation and speculative infrastructure.
- Follow established repository conventions when they do not conflict with this document.
- Do not add a dependency for functionality that can be implemented cleanly with the existing stack.

## 2. TypeScript
- Enable and preserve strict TypeScript settings.
- Avoid `any`; use `unknown` and narrow it when input is not trusted.
- Define explicit types for roadmap entries, title metadata, progress state, and achievements.
- Prefer discriminated unions for finite states.
- Handle nullable external API fields explicitly.
- Do not silence type errors with broad casts or `@ts-ignore` without a documented reason.

## 3. Vue and Nuxt
- Use Vue 3 Composition API and `<script setup lang="ts">` for new components unless the repository establishes another consistent pattern.
- Follow Nuxt 4 routing, data-fetching, and directory conventions.
- Use auto-imports where Nuxt provides them; avoid redundant imports.
- Keep components presentational where possible; place reusable stateful logic in composables.
- Keep server-only secrets and integrations out of client code.
- Never access browser-only globals during server-side rendering without a client guard.

## 4. Naming and file organisation
- Use PascalCase for Vue component filenames when consistent with the project.
- Use camelCase for variables and functions.
- Use PascalCase for TypeScript types and interfaces.
- Use UPPER_SNAKE_CASE only for true constants where it improves clarity.
- Use descriptive names; avoid vague names such as `data`, `item`, or `helper` when a domain-specific name is clearer.
- Keep related files near the feature they support, following the agreed architecture.

## 5. Vue component conventions
- Declare typed props and emits.
- Keep side effects explicit.
- Avoid mutating props.
- Use stable keys for rendered lists.
- Avoid deeply nested conditional templates when a computed value or child component improves clarity.
- Icon-only controls must have accessible labels.
- Interactive controls must have real behaviour; do not ship decorative buttons that appear functional.

## 6. Styling
- Use Tailwind utility classes in a consistent, readable manner.
- Follow the approved `DESIGN.md` tokens and component rules once they are finalised.
- Do not introduce arbitrary colours or one-off spacing values when a design token exists.
- Avoid global CSS overrides unless they are genuinely global.
- Support responsive layouts and reduced motion.
- Do not use colour as the only indicator of status.
- Ensure visible focus, hover, active, disabled, and loading states where relevant.

## 7. Accessibility
- Use semantic HTML elements.
- Maintain a logical heading hierarchy.
- Ensure keyboard access to interactive features.
- Provide visible focus indicators.
- Give controls accessible names and meaningful form labels.
- Provide text alternatives for meaningful images.
- Respect `prefers-reduced-motion`.
- Maintain sufficient contrast and usable touch target sizes.
- Provide a non-map/list alternative for roadmap navigation.

## 8. Data and API handling
- Treat API responses, local storage, query parameters, and user input as untrusted.
- Validate data at boundaries.
- Handle network errors, missing fields, empty results, and rate limits gracefully.
- Do not fabricate media details, trailer availability, or viewing providers.
- Keep API credentials in environment variables and server-side code.
- Never commit `.env` files or secrets.
- Provide an example environment file containing names/placeholders only, never real credentials.

## 9. Browser storage
- Centralise local-storage access.
- Guard access during SSR.
- Version persisted data.
- Handle invalid JSON and outdated schemas safely.
- Do not store secrets or sensitive personal information.
- Ensure a storage failure does not make the whole app unusable.

## 10. Performance
- Avoid unnecessary client-side JavaScript.
- Lazy-load heavy media and non-critical components where appropriate.
- Use appropriately sized artwork and avoid layout shifts.
- Avoid rendering the entire universe map in an expensive way if profiling shows performance issues.
- Measure before adding complex optimisation.

## 11. Testing and verification
For each change, run the checks available and relevant to the repository:
- Type checking.
- Linting.
- Unit/component tests where configured.
- Production build.

Report exactly which commands ran and whether they passed or failed. If a check is not configured or could not be run, say so. Do not claim unrun checks passed.

For visual changes, inspect at:
- 1440px desktop.
- 768px tablet.
- 390px mobile.

Check keyboard behaviour, responsive overflow, reduced motion, and relevant empty/error/loading states.

## 12. Git and change safety
- Inspect `git status` before making changes.
- Do not discard, overwrite, or reformat unrelated user changes.
- Keep changes scoped to the approved task.
- Do not commit unless explicitly requested.
- Summarise modified files and any migration or setup implications.

## 13. Documentation
- Update relevant documentation when architecture, setup, data contracts, or behaviour changes.
- Keep setup commands accurate and verify them where possible.
- Keep `progress-tracker.md` current at phase boundaries.
- Clearly label provisional decisions and unresolved questions.

## 14. Data validation and API integration (Phase 03)

### Editorial data
- `app/constant/marvel_doomsday_watchlist.json` is the source of truth. Code never writes to it. Do not rename fields, change IDs, reorder `watch_order`, reclassify priorities or rewrite editorial text in a code change; make it a deliberate, reviewed data edit.
- Keep the main and supplemental collections separate. Do not give supplemental titles `watch_order` or `completion_status`.
- Field names in code follow the JSON (snake_case) for dataset types. Use camelCase only for app-side shapes such as normalised TMDB data and progress state.
- Every change to either JSON file must pass `pnpm validate:data`. A failing validation is fixed in the data or the schema, never bypassed.
- Schemas are strict. A new field means updating the type, the schema and the tests together.

### TMDB
- TMDB identity lives only in `tmdb_mapping.json`, keyed by project ID. Never put TMDB IDs in the editorial JSON, and never look titles up by name at request time.
- Never record a TMDB ID that was not confirmed against TMDB. Do not take the first or most popular search result. Use `needs_review` when unsure.
- A `verified` entry is changed only by a person, not by a search.
- Do not hardcode metadata, trailers, cast or providers. If TMDB has no data, return `null` or an empty list and let the UI show an unavailable state.
- Never invent streaming availability. Provider links come from TMDB only and must be https on `www.themoviedb.org`.

### Server routes
- Routes take the project title ID, validate it, and resolve the TMDB target server-side.
- Responses are `{ titleId, mediaType, data }` or `{ error: { code, message } }` with a matching status. Add new failure modes as `ApiErrorCode` values, not free text.
- Validate TMDB responses with Zod before use, tolerate missing optional fields, and normalise in `server/utils/tmdb/normalize.ts`.
- Keep pure logic (normalisers, matching, validation) free of Nitro and h3 imports so it can be unit tested.
- The TMDB token stays in server runtime config. It is never logged, returned, or sent to a host other than the two allowed TMDB API hosts.
- Cache only successful lookups, with shorter lifetimes for data that changes (providers).

### Personal data
- All localStorage access goes through `app/utils/progress-storage.ts`. Do not call `localStorage` elsewhere.
- Keys are versioned. A format change bumps the version and adds a migration; it never reinterprets old data silently.
- Treat stored data as untrusted: validate on load, keep a backup of anything rejected, and never let a bad value stop the app.

### Tests
- `pnpm test` (Vitest) covers validation, matching, the TMDB client and normalisers, the progress store and the mapping tool. TMDB test data is synthetic and must not use real-looking IDs for real titles.
- A test that mocks TMDB proves the code handles a response shape, not that TMDB works. Say so when reporting results.
