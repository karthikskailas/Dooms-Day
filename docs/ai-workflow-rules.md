# Marvel: Road to Doomsday — AI Workflow Rules

> Inherits the repository's global `AGENTS.md` workflow. Follow its requirements and add the feature-specific rules below.

## Work-Unit Boundaries

Work in small, independently verifiable units:

1. **Foundation:** inspect repository/global rules, establish Nuxt/Cloudflare baseline and environment configuration.
2. **Curated data:** define typed roadmap schema, migrate existing title list and validate TMDB IDs.
3. **TMDB integration:** implement server-only client, endpoint response types, cache and error handling.
4. **Landing page:** implement countdown hero and two journey entry actions.
5. **Timeline map:** implement pan/zoom, node states, filters, selection and accessible list fallback.
6. **Title detail:** implement artwork, metadata, trailer, cast and provider sections.
7. **Progress:** implement versioned LocalStorage and title completion.
8. **Achievements:** implement per-title card generation, collection and export.
9. **Final achievement:** implement essential-only completion gate and personalised DOOMSDAY READY card.
10. **Release quality:** responsive, accessibility, SEO, error-state and deployment verification.

Do not combine all units into one large unreviewable change. Update the progress tracker after each meaningful unit.

## Protected Files

- Do not overwrite or discard the supplied curated roadmap content while migrating it.
- Do not change global `AGENTS.md`, `ARCHITECTURE.md`, `STANDARDS.md` or `DESIGN.md` without an explicit project-wide reason and the repository's documented change process.
- Do not commit `.env` files, TMDB credentials, Cloudflare secrets or other credentials.
- Do not manually edit generated build output or generated framework files unless the framework workflow explicitly requires it.
- Do not remove existing user work or dependencies without inspecting their purpose.

## UI-First Specification Gate

Before implementing any page or visual component:

1. Read the relevant page specification in `ui-context.md`.
2. Convert it into a short component/layout checklist.
3. Inspect existing global design tokens and shared components.
4. Confirm all states: loading, success, empty, error, responsive, keyboard and reduced motion.
5. If a required visual or interaction decision is absent, document the decision or ask the user; do not silently invent a materially different UI.
6. Implement and visually inspect the result in the running app.

A task is not complete if the UI merely compiles but visibly contradicts the documented design.

## Completion Requirements

- Relevant typecheck and lint commands pass.
- Relevant tests pass or missing tests are explicitly recorded.
- Production build passes.
- Cloudflare deployment configuration is validated using the repository's supported workflow.
- TMDB credentials are confirmed server-only.
- Responsive visual checks are completed for affected pages.
- Timeline interaction and accessibility checks are completed when timeline code changes.
- Achievement completion rules are tested, including optional titles not blocking final unlock.
- Card PNG export is inspected at its target dimensions.
- No provider, trailer, cast or story relationship is fabricated.
- `progress-tracker.md` is updated at the end of every session.

## Session Handoff

The next session should be able to resume by reading only `progress-tracker.md` after opening `CLAUDE.md`. Keep that tracker concise, current and actionable.
