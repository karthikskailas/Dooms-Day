# Design Direction — Marvel: Road to Doomsday

**Status:** Initial design brief; visual tokens and final compositions are provisional until explored and approved in the design phase.

## 1. Experience principles
The interface should feel like entering a cinematic Marvel-inspired journey: mysterious, dramatic, immersive, and premium. It should communicate progression and discovery rather than resemble a conventional SaaS dashboard or a generic streaming catalogue.

Design for clarity first. Cinematic presentation should never make navigation, reading, or accessibility difficult.

## 2. Core visual principles
- Dark, atmospheric surfaces with controlled contrast.
- Strong typographic hierarchy and restrained use of display typography.
- Artwork should provide visual impact; avoid unnecessary decorative clutter.
- Use lines, paths, markers, and restrained highlights to communicate progression.
- Make essential, recommended, optional, completed, and current states distinguishable without relying on colour alone.
- Use motion purposefully to communicate transitions, focus, and progress.
- Avoid excessive glassmorphism, constant animation, generic gradients, and rainbow accent palettes.

## 3. Provisional palette
The following palette is a starting hypothesis, not a final approved design system. Re-evaluate it during Phase 02.

| Token | Provisional value | Intended use |
|---|---|---|
| Void | `#0B0E0C` | Main page background |
| Surface | `#131916` | Primary panels |
| Raised | `#1B231E` | Elevated panels |
| Surface Soft | `#242D27` | Secondary surfaces |
| Text Primary | `#F2F0E8` | Main text |
| Text Secondary | `#B7BDB5` | Supporting text |
| Text Tertiary | `#858E86` | Muted metadata |
| Line | `#354039` | Borders and dividers |
| Doom Green | `#456B50` | Primary accent |
| Bright Green | `#78966D` | Active/highlight states |
| Relic Gold | `#C6A15B` | Achievement and premium accent |
| Soft Gold | `#E0C98E` | Highlight text/details |
| Success | `#83A98A` | Completed/success states |
| Danger | `#C66B61` | Error/destructive states |

Check text/background combinations for WCAG contrast. Adjust token values where necessary rather than preserving a colour at the expense of readability.

## 4. Provisional typography
Starting proposal:
- **Barlow Condensed**, weights 600–700: display headlines and short cinematic labels.
- **DM Sans**, weights 400–700: body text, metadata, controls, and general UI.

This pairing is not final. Validate legibility, character coverage, loading strategy, and visual fit during Phase 02. Provide sensible system fallbacks.

## 5. Information architecture and page-level intent

### Landing page
- Establish the title and cinematic mood immediately.
- Make the countdown legible but subordinate to the main journey choice.
- Present Doomsday Journey and Whole Universe as the two dominant actions.
- Keep the unofficial fan-project note discoverable and readable.

### Journey map
- Give the map the majority of the available space.
- Keep navigation and map controls discoverable without obscuring nodes.
- Make the current position and completed path obvious.
- Distinguish node types and statuses with shape, labels, line treatment, and accessible text—not colour alone.
- Ensure map navigation works with touch, mouse, and keyboard where practical.
- Provide a linear/list alternative.

### Title detail view
- Use title artwork as the visual anchor with a readable dark overlay where text overlaps imagery.
- Prioritise title, year, overview, and primary actions.
- Group cast/crew, trailer, editorial relevance, and viewing providers into clear sections.
- Never display a non-functional trailer control or an unverified provider as available.

### Achievement cards
- Give each card a clear title-specific identity.
- Keep the title and achievement status readable at social-sharing sizes.
- Make the final DOOMSDAY READY card visibly more prestigious than a standard title-completion card.
- Avoid implying official Marvel branding or certification.

## 6. Interaction and motion
- Use motion to explain map movement, node selection, view transitions, and achievement unlocks.
- Respect `prefers-reduced-motion`.
- Avoid motion that delays access to content or blocks interaction.
- Provide visible focus states and clear hover/pressed/disabled states.
- Touch targets should be comfortably usable on mobile.
- Do not make hover the only way to discover information.

## 7. Responsive requirements
Visual QA targets:
- Desktop: 1440px viewport width.
- Tablet: 768px viewport width.
- Mobile: 390px viewport width.

At each size:
- No horizontal page overflow.
- Main actions remain easy to reach.
- Detail content remains readable.
- Map controls remain usable and do not cover important nodes.
- Achievement cards preserve their hierarchy and export layout.
- Navigation has a usable touch-friendly layout.

## 8. Accessibility requirements
- Semantic landmarks and heading order.
- Keyboard access to all meaningful controls.
- Visible focus indicators.
- Sufficient contrast.
- Accessible names for icon-only controls.
- Text alternatives for meaningful imagery.
- Status communicated without colour alone.
- Reduced-motion support.
- A list alternative to the interactive map.

## 9. Design skill workflow
During the approved design phase:
1. Inspect the existing UI and design brief.
2. Install/use Impeccable and Taste Skill only if the user has authorised that phase and the tools are available.
3. Explore and critique alternative visual directions.
4. Present a coherent proposed design system for approval.
5. Update this document with the approved tokens, typography, component rules, page specifications, and interaction states.
6. Implement only after the design direction is approved.

Do not treat the provisional palette, fonts, or compositions in this document as final instructions before approval.

## 10. Design acceptance criteria
- The experience feels cinematic and purpose-built, not like a generic admin dashboard.
- Users can identify the two journey choices immediately.
- Map states and progress are understandable.
- Content remains readable over artwork.
- Controls have complete interaction states.
- Desktop, tablet, and mobile layouts are intentionally designed.
- Accessibility and reduced-motion behaviour are addressed.
- Final UI matches the approved design specification.
