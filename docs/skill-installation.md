# Local Design Skill Installation — Marvel: Road to Doomsday

This guide is for the project owner or coding agent to run from the actual repository root. The skills are third-party tools; inspect their current source and prompts before accepting changes.

## 1. Prerequisites

- Open the actual Marvel project directory in a terminal.
- Confirm Node.js and npm/npx are available.
- Confirm the active coding harness is Claude Code.
- Commit or back up existing work before installing skills.
- Review the repository's `.gitignore` and local hook policy.

## 2. Install Impeccable (Claude Code, project-local)

Official installation guide: https://impeccable.style/tutorials/getting-started/

```bash
npx impeccable install
```

In the installer:
- Select Claude Code.
- Select project-local installation.
- Enable the automatic design hook if acceptable for this repository.
- Review files it proposes to create or modify.

Then reload Claude Code and run:

```text
/impeccable init
```

Review the generated `PRODUCT.md` and correct its product context. Once the design system exists, use:

```text
/impeccable document
```

Review the resulting `DESIGN.md` before treating it as authoritative.

## 3. Install Taste Skill (current guide)

User-provided guide: https://www.tasteskill.dev/guide  
Docs: https://www.tasteskill.dev/docs

The current guide documents the `Leonxlnx/taste-skill` repository and `design-taste-frontend` install name.

```bash
npx skills add Leonxlnx/taste-skill --skill "design-taste-frontend"
```

Reload/start a new Claude Code session if the skill is not discovered. Invoke it explicitly:

```text
/design-taste-frontend
```

## 4. Verify Installation

Do not assume install success from command exit alone.

- Inspect the local Claude skill directories created by the installers.
- Confirm each skill contains its `SKILL.md` and required supporting files.
- Confirm Claude Code lists/discovers both skills.
- Confirm Impeccable commands are available.
- Confirm Taste Skill can run its project scripts.
- Confirm any automatic hook path points to an existing local file.
- Record versions, paths and hook state in `progress-tracker.md`.

## 5. First Design Session

1. Read `progress-tracker.md`.
2. Read `ui-context.md`.
3. Run `/impeccable init` if not already completed.
4. Run `/design-taste-frontend` with the full project brief and landing-page requirements.
5. Ask Taste Skill to explore multiple directions while preserving the proposed charcoal/emerald/antique-gold identity and the two-font limit.
6. Review the direction sheet and choose one direction before implementation.
7. Record final palette, typography, image treatment and motion rules in root `DESIGN.md` and `ui-context.md`.
8. Implement one page at a time.
9. Run Taste Skill lint/inspect and Impeccable critique/audit.
10. Update `progress-tracker.md`.

## 6. Notes

- Impeccable's official docs say `npx impeccable install` installs the provider-specific build and recommends reloading the coding tool. `/impeccable init` captures product context in `PRODUCT.md`.
- Taste Skill's current guide says it can be invoked as `/design-taste-frontend`; it produces a design direction and uses project scripts for linting and browser inspection.
- Taste Skill's documented browser inspector requires Node 22+ and Chrome/Edge/Chromium. Some helper scripts support Node 18, but use Node 22+ for the full inspection workflow.
- If a script or hook proposes changes outside the project scope, stop and review them before accepting.
- Do not install an older fork or similarly named skill by accident. The commands above follow the user's supplied current guide.
