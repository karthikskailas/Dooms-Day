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
