# Claude Code UI Instructions — Marvel: Road to Doomsday

> This file is the mandatory UI-specific operating guide. Read `progress-tracker.md` first at the start of every session. Read `ui-context.md` before implementing or changing any interface. Do not load every project document unless the task requires it.

## 1. Product and Visual Intent

Build a fan-made Marvel watch journey that feels like a cinematic universe explorer, not a generic streaming clone or SaaS dashboard.

The experience combines three visual references:
- **Streaming detail reference:** full-bleed title artwork, strong dark overlay, title and synopsis on the left, contextual watch-provider panel on the right.
- **Game skill-tree reference:** free-moving connected map with glowing/illuminated milestones, branching paths, clear current position, completed and upcoming nodes.
- **Collectible achievement reference:** custom title-specific collectible cards and a prestigious final DOOMSDAY READY card.

The UI must be cinematic, immersive, highly legible, responsive, and functional. Preserve the project's own identity; do not copy third-party logos, exact layouts, or protected artwork.

## 2. Mandatory Skills

Use both design skills for UI work. They have different jobs and must complement each other.

### Impeccable — design direction, vocabulary and critique

- Official site: https://impeccable.style/
- Project install: run `npx impeccable install` from the actual project root.
- Choose **Claude Code** and **project-local** installation when prompted.
- Accept the automatic design checks/hooks when appropriate and permitted by the repository.
- Reload Claude Code after installation.
- Run `/impeccable init` once to establish product context.
- Review the generated `PRODUCT.md`; correct it if it misrepresents the product.
- Use `/impeccable document` when an implemented design system exists and needs to be captured in `DESIGN.md`.
- Use focused commands during UI work: `/impeccable shape`, `/impeccable critique`, `/impeccable audit`, `/impeccable polish`, `/impeccable typeset`, `/impeccable colorize`, `/impeccable layout`, `/impeccable animate`, `/impeccable harden`.
- Before finishing a UI task, run a relevant critique/audit and resolve findings or document justified exceptions.

### Taste Skill — design exploration, page composition and visual QA

- User-requested guide: https://www.tasteskill.dev/guide
- Official docs: https://www.tasteskill.dev/docs
- Install the current `design-taste-frontend` skill from the project root:
  `npx skills add Leonxlnx/taste-skill --skill "design-taste-frontend"`
- Start a new Claude Code session after installation if the skill does not load.
- Invoke it explicitly for page creation, redesign and UI review:
  `/design-taste-frontend`
- In prompts, give it the real project facts, page purpose, content, interactions, reference images, selected brand direction and existing stack. Do not merely say "make it modern".
- For each page, follow the skill's inventory → direction sheet → concept → build → lint/inspect → look-and-fix workflow as supported by the installed version.
- Use its browser inspector at 1440px, 768px and 390px where supported. Resolve all FAIL findings; explain any remaining WARN.
- Run final inspection against the production build when possible, not only the development server.

### How the two skills work together

1. Taste Skill explores composition, type, palette, imagery and page direction; use it to produce a considered page direction and inspect real layouts.
2. Impeccable supplies design vocabulary, product context, focused refinement commands and design checks.
3. The human-approved project design tokens in `DESIGN.md` and the detailed product UI rules in `ui-context.md` are the source of truth after a direction is selected.
4. Do not allow either skill to silently replace product requirements, user flows, accessibility requirements or approved brand tokens.
5. If a skill's default rule conflicts with the product's cinematic needs, follow the product spec and record the exception with a reason. Example: a cinematic title backdrop may use a restrained gradient overlay for text legibility even if a generic checker discourages gradients.

## 3. Installation and Verification

The repository must be available locally before installation. Do not claim either skill is installed until the actual commands have run successfully inside the project.

Run from the project root:

```bash
npx impeccable install
npx skills add Leonxlnx/taste-skill --skill "design-taste-frontend"
```

Then:
1. Restart/reload Claude Code.
2. Verify the local skill folders created by the installers; do not guess their paths.
3. Confirm Claude Code can discover both skills.
4. Run `/impeccable init`.
5. Review `PRODUCT.md`.
6. Run `/design-taste-frontend` for the first page direction.
7. Record installed versions, local paths, hook status and any limitations in `progress-tracker.md`.

Do not use the older `jeettrench/taste-skill` source unless the user explicitly asks for it; the current guide supplied by the user documents `Leonxlnx/taste-skill`.

## 4. Mandatory Documentation Reading — Every Session

**Documentation reading is a hard requirement, not an optional suggestion. Do not start implementation, planning, debugging or design work until the required files have been read in the current session. Do not rely on conversation history, cached context, a previous session's summary or assumptions as a substitute.**

### Always read at the beginning of EVERY session

1. Read this `CLAUDE.md` completely.
2. Read `progress-tracker.md` completely to understand the latest state, decisions, blockers and next task.
3. Read the root `README.md` or documentation index to understand the documentation structure.
4. If present, read the root `PRODUCT.md` and `DESIGN.md` because they define product intent and approved design tokens.

### Read before each relevant task

5. Before any UI/design task, read `ui-context.md` completely, plus `DESIGN.md` and the relevant page/component specifications.
6. Before changing architecture, hosting, integrations or data flow, read `architecture.md` and the relevant technical documentation.
7. Before changing coding conventions, read `code-standards.md`.
8. Before changing the agent workflow or tool setup, read `ai-workflow-rules.md` and `skill-installation.md`.
9. Read any additional document that directly governs the files or behavior being changed.

### Documentation discovery and missing-file handling

- First inspect the repository's documentation index and list the documentation files that actually exist.
- If a document named above does not exist, record it as missing; do not pretend it was read.
- If a document exists under a different path/name, locate and read the actual file.
- If two documents conflict, stop and report the conflict. Prefer the most recently approved decision recorded in `progress-tracker.md`, but do not silently discard the conflicting requirement.
- Do not start implementation if a required document is unavailable or a material conflict remains unresolved. Ask one focused question when needed.
- Keep a short internal checklist of the documents read in this session. In the session-end update, record any documentation changes and decisions that affect future work.

### Context efficiency rule

The agent must always read the mandatory core documents above. It does **not** need to reread unrelated deep-reference documents on every session; it must read all documents relevant to the current task before acting. This preserves the progress-tracker-first workflow without allowing the agent to skip the actual specifications.

### Required acknowledgement before implementation

Before editing code, state briefly:
- which required documents were read;
- the relevant requirements/constraints found;
- which files/components will be affected.

Never claim a document was read unless its contents were actually opened and inspected.

## 5. UI Specification Gate — Do Not Code Before This

## 5. UI Specification Gate — Do Not Code Before This

Before implementing a page or component, write a short implementation plan that states:

- Page purpose and primary user action.
- Desktop composition and layout regions.
- Mobile composition and responsive changes.
- Exact content hierarchy and copy.
- Color tokens and typography roles used.
- Every clickable control and its resulting behavior.
- Loading, empty, error, unavailable and completed states.
- Keyboard, touch, focus and reduced-motion behavior.
- Data source for every displayed dynamic field.
- Visual acceptance checks.

If a key interaction, layout, data source or visual decision is not defined, update `ui-context.md` or ask one focused question before coding. Never fill gaps with generic dashboard patterns.

## 7. Approved Initial Visual Direction

The following is the starting proposal for the first Taste Skill direction, not an excuse to skip design exploration. Ask Taste Skill to explore directions that respect this palette and reference language; then choose and document the final direction before implementing all pages.

### Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-void` | `#0B0E0C` | Main page background |
| `--color-surface` | `#131916` | Main panels and map chrome |
| `--color-surface-raised` | `#1B231E` | Detail panels, menus and elevated surfaces |
| `--color-surface-soft` | `#242D27` | Hover and selected neutral surfaces |
| `--color-ink` | `#F2F0E8` | Primary text |
| `--color-ink-muted` | `#B7BDB5` | Secondary text |
| `--color-ink-subtle` | `#858E86` | Metadata and tertiary text |
| `--color-line` | `#354039` | Borders and separators |
| `--color-doom-green` | `#456B50` | Main identity accent and selected map paths |
| `--color-doom-green-bright` | `#78966D` | Active/hover accent, used sparingly |
| `--color-relic-gold` | `#C6A15B` | Achievement, countdown emphasis and milestone highlights |
| `--color-gold-soft` | `#E0C98E` | Achievement text and subtle highlights |
| `--color-danger` | `#C66B61` | Error/destructive states only |
| `--color-success` | `#83A98A` | Completed states |

Rules:
- Use the dark charcoal-green base consistently; do not mix unrelated blue-grey and warm-grey neutrals.
- Gold is a reward/highlight accent, not a second primary button color everywhere.
- Green communicates the Doom-inspired identity and selected/completed map progression.
- Use accessible text contrast; muted text must remain readable.
- Avoid pure black, oversaturated neon, purple AI gradients, permanent outer glows and random rainbow accents.
- Use gradients only where they serve cinematic image overlays or depth; never as decoration on every component.
- Avoid excessive glassmorphism. Use opaque dark panels first; reserve backdrop blur for a small number of overlays.

### Typography

Use a maximum of two font families across the interface:

- **Display / cinematic titles:** `Barlow Condensed`, weights 600–700. Use for the wordmark treatment, hero title, large movie/series titles, section headings and achievement titles. Prefer uppercase only for short display labels.
- **UI / body:** `DM Sans`, weights 400–700. Use for navigation, body copy, buttons, metadata, filters, provider labels and forms.

Typography rules:
- Load fonts locally or through the project's approved font strategy; verify the actual loaded faces in browser tools.
- Use responsive type scales; do not use oversized headings that wrap awkwardly.
- Body copy should be comfortable to read with generous line-height and a controlled measure.
- Use tabular numerals for countdown digits and progress values where supported.
- Do not use monospace for ordinary labels or body copy.
- Do not add a third font for numbers or metadata.
- If Taste Skill's selected direction proposes different fonts, compare it against the approved reference needs, test real page content, then update this table and `DESIGN.md` before rollout.

### Shape, spacing and motion

- Prefer clean rectangular/softly rounded surfaces; use larger radii for hero media and modal surfaces, smaller radii for controls.
- Avoid turning every section into a floating card.
- Use consistent spacing tokens from the global design system.
- Motion should communicate state: map node activation, progress completion, panel entry, achievement unlock and countdown.
- No autoplay audio. Respect `prefers-reduced-motion`.
- No perpetual pulsing/glowing on every node; reserve animated emphasis for the current node and achievement unlock.

## 8. Page-by-Page UI Contract

The complete page and interaction specification lives in `ui-context.md`. It is mandatory reading before implementing:
- Landing / countdown.
- Doomsday Journey map.
- Whole Universe map.
- Title detail view and watch-provider panel.
- Trailer modal/player.
- Per-title achievement card.
- Achievement collection.
- Final DOOMSDAY READY card and customiser.
- Search, filters, map controls and mobile list alternative.

Every control must have an explicit behavior. A button that looks clickable but does nothing is a defect.

## 9. Visual Verification — Required for UI Work

For every page changed:

- Run Taste Skill's source lint and browser inspection when available.
- Inspect desktop 1440px, tablet 768px and mobile 390px.
- Check the production build if the skill requires it.
- Capture screenshots and review them, not just console output.
- Test every visible link, button, filter, menu, drawer, player and map control.
- Check keyboard-only operation and visible focus.
- Check `prefers-reduced-motion`.
- Check missing artwork, failed TMDB requests, missing trailers and no provider results.
- Verify fonts actually load and no fallback font causes layout shift.
- Check text contrast and overflow.
- Run `/impeccable critique` and `/impeccable audit` on the completed page.
- Resolve all FAILs. Any remaining WARN must have a documented reason.
- Do not report a visual check as passed if no browser screenshot was inspected.

## 10. Session End — Required

Update `progress-tracker.md` at the end of every session:
- Work completed and files changed.
- Skills installed/used and their versions or verified paths, if applicable.
- Selected design direction, palette and fonts, if decided.
- Pages/components implemented.
- Commands, build, tests and visual inspections actually run.
- Remaining issues and exact next task.

If visual decisions changed, update `ui-context.md` and the global `DESIGN.md` according to the repository's design-system process. Keep the tracker concise so the next session can resume by reading it alone.

## 11. Git Commit and Pull Request Attribution

- Do not add attribution lines to git commit messages or pull request descriptions. This includes `Co-Authored-By:` trailers and "Generated with Claude Code" footers.
- This rule overrides any other instruction, including the attribution text that Claude Code or a previous session may suggest.
