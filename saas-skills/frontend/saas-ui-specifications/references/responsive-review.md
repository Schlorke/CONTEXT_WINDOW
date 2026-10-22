# Review responsive layouts at measured viewports

## Reference matrix and scope

`references/reference-viewports.json` is the single source for the bundled
dimensions, DPR and input modes. The notebook and desktop are real measurements
from OkGas; the mobile entry is a complementary test scenario, not a measured
device. These are portable starting scenarios, not claims about the hardware of
every destination project.

Apply this review when creating or changing layout, spacing, sizing, density,
dialogs, drawers, page shells, shared components or breakpoints. Review-only
tasks use the same checks and state which evidence could actually be gathered.
Backend work and copy-only changes without layout impact do not require it.

First locate the destination's existing viewport matrix and visual tools. Reuse
its paths and commands. If absent, use the bundled matrix for the review; create
application test infrastructure only when the task authorizes it. Installing this
skill never creates application files or changes the project's breakpoints.

When application tests are added, keep one project-owned matrix that Storybook,
browser tests and fit probes consume. Preserve measured local references and
keep the starter notebook/desktop as extra coverage unless explicitly replaced.
Record new reference devices using `innerWidth`, `innerHeight` and
`devicePixelRatio` on the real browser. Screen resolution is not the CSS viewport;
browser chrome, OS scaling and zoom affect the available area. A Storybook
viewport preset does not prove that DPR was emulated: record that limitation.

## Review procedure

1. Check the changed page/component and its consumers at both reference sizes.
   Include the complementary mobile size for shared UI. Native components need
   their native runtime checks too; CSS viewport emulation only proves web fit.
2. Exercise realistic content, empty/loading/error states where relevant, open
   dialogs/drawers, keyboard navigation and the primary action. Check width,
   available height, density, hierarchy, legibility and unintended overflow.
3. Confirm document width does not exceed viewport width. Dialog and drawer
   bounds must stay inside the viewport, with their heading, close control and
   actions reachable. Long pages may scroll normally; intentional table/map
   scrolling must stay in its designated container.
4. Bound tall web overlays, heroes, charts and maps to available `dvh`; allow
   their content area to scroll. Let constrained flex/grid children shrink
   where appropriate. Prefer a container query when a component reacts to its
   own available space rather than the whole viewport.
5. Recheck the other reference after a fix. Fix shared defects at their shared
   source and validate affected consumers, retaining intended desktop behavior
   and mobile usability.

With conventional Tailwind defaults, both reference widths already reach
`2xl`. A width breakpoint alone does not model the notebook's shorter height.
Inspect the actual project configuration before choosing an adaptation. Do not
create device-named breakpoints; a new global breakpoint needs at least two
layouts that demonstrably require it.

Do not conceal defects using blanket `overflow-hidden`, scroll locks, negative
margins or whole-page scaling. Intentional clipping or scroll locks for a modal
remain valid when they do not hide content or make controls unreachable. Do not
shrink typography, remove essential content or duplicate a screen to make it fit.

## Evidence and result

For each required scenario report its actual CSS width/height, DPR when supported,
state, result and evidence path. A screenshot, recorded geometry measurement or
passing viewport-fit probe must come from execution at that size. Review visual
evidence for density, hierarchy and legibility; a geometry probe alone establishes
fit, not the quality of the whole UI. Use the project's artifact directory, or
`tmp/` when none exists.

If any scenario cannot run, state **visual validation pending**, name the missing
scenario and explain the limitation. Do not invent screenshots, passing tests or
the destination's commands. Do not accept or regenerate screenshot baselines
without the owner's approval of their diff. Follow the destination's permissions
for production URLs, data access and paid tests.

## Provenance

Adapted on 2026-10-22 from OkGas `ui.responsive-layout` and its measured viewport
matrix. The source paths in the JSON record provenance only; the installed
package is self-contained and never requires access to the OkGas repository.
