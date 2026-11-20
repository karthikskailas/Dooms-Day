# Agent Instructions

## Purpose
This file defines how AI coding agents must work in the Marvel: Road to Doomsday repository. These instructions apply to every task unless the user explicitly overrides them.

## Mandatory documentation-first workflow
At the beginning of **every session**:
1. Read this `AGENTS.md` completely.
2. Read `CLAUDE.md` completely if it exists.
3. Read `progress-tracker.md` completely if it exists.
4. Read `README.md` and any documentation index if present.
5. Read `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, and `STANDARDS.md` before making decisions or changes relevant to them.
6. Identify missing documents and conflicting instructions. Do not pretend to have read files that do not exist.
7. Inspect the existing repository and current implementation before proposing or editing code.

Before implementation, briefly report:
- Documents actually read.
- Relevant constraints and decisions.
- Repository structure and existing implementation relevant to the task.
- Planned files to create or modify.
- Any assumptions or unresolved conflicts.

Do not begin implementation until this inspection is complete. Do not rely on conversation history as a substitute for reading repository documentation.

## Scope and phase discipline
The project is developed in approved phases. Work only on the phase the user has authorised.
- Complete the current phase's objectives and acceptance criteria.
- Do not implement features belonging to later phases as a convenience.
- Do not silently broaden scope, add infrastructure, or introduce dependencies without a clear need.
- At the end of a phase, update the progress tracker and provide a concise handoff.
- Stop and wait for explicit user approval before beginning the next phase.

## Product source of truth
- `PRODUCT.md` defines product intent, audiences, features, and product boundaries.
- `DESIGN.md` defines the visual and interaction direction. Any explicitly provisional direction must remain provisional until approved.
- `ARCHITECTURE.md` defines the technical structure and integration boundaries.
- `STANDARDS.md` defines implementation and quality conventions.
If implementation conflicts with these documents, stop and explain the conflict rather than choosing silently.

## Technical constraints
Current planned stack:
- Nuxt 4
- Vue 3
- TypeScript
- Tailwind CSS
- pnpm
- Lucide icons

Do not add Cloudflare, hosting/deployment infrastructure, a database, authentication, or a backend service unless the user explicitly authorises a later change. Do not assume these are needed for the initial build.

## Implementation rules
- Prefer the smallest maintainable solution that meets the approved scope.
- Reuse existing patterns and dependencies where reasonable.
- Avoid unnecessary abstractions, dependencies, demo content, and speculative features.
- Keep TypeScript strict; avoid `any` unless justified and documented.
- Never hardcode secrets or commit API credentials.
- Do not invent TMDB metadata, trailer availability, cast details, or streaming providers.
- Preserve existing user work. Do not overwrite or delete files without inspecting them first.
- Make accessibility, responsive behaviour, and reduced-motion support part of implementation rather than afterthoughts.
- Do not claim a command, test, lint, typecheck, or build passed unless it was actually run and its result observed.

## Design implementation rules
- Follow the approved design specification; do not invent a generic SaaS interface.
- In the design phase, use the project's selected design skills if they are installed and available.
- Do not install or invoke design skills before the phase in which the user has authorised them.
- Inspect the rendered UI at the specified viewport sizes when visual implementation is in scope.
- Keep interactions functional; do not use decorative controls that imply unavailable behaviour.

## Security and content
- Treat external API responses and user-provided content as untrusted data.
- Keep API credentials server-side when API integration is implemented.
- Link only to legal viewing-provider destinations. Do not provide piracy or unauthorised streaming links.
- Make clear that progress and achievements are self-reported if there is no verification mechanism.
- Do not imply Marvel, Disney, or any rights holder endorses this fan project.

## Session-end handoff
At the end of each task:
1. Summarise what changed.
2. List files created or modified.
3. Report commands actually run and their exact outcomes.
4. List known issues, blockers, and assumptions.
5. Update `progress-tracker.md` when it exists and the task changes project status.
6. State the exact next step.
7. If the current phase is complete, stop and request approval before proceeding.
