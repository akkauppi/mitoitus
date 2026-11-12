# Visual iteration record

## Iteration 01 — 12 November 2026

User asked for responsive pastel outlined dioramas while preserving the existing
content; clarified that 3D should have a vector-graphic appearance. Initial
implementation: three scenes × three treatments, orthographic presets, six
original metric assets, screen-space dimensions and experimental SVG export.
User previewed locally and called it a very good starting point. **No final
style accepted and no push/deployment authorized.**

Observed initial checks: 24 Node geometry tests passed. Chromium headless/software
WebGL exercised 54 combinations (3 scenes × 3 styles × 3 views × desktop/mobile),
plus a320px overflow check, label/dimension toggles, keyboard, bookmarks, SVG XML
and raster-free content, no-WebGL fallback and zero runtime external requests.
The private course checker also passed: 6 weeks,38 items,46 source hashes;
canonical exports matched its temporary build.

A subsequent independent review found overlapping dimension text at320px,
floating tram platform slabs, and incomplete contour edges in the SVG export.
These are concrete follow-up issues; the original checks did not establish
collision-free labels or vector visual fidelity.

## Iteration 02 — requested during preview

- Move labels outside the illustration into orderly stacks, connected by two
  leader segments with aligned text-side directions and dot endpoints. Leaders
  must never cross; prefer aligned inner directions too.
- Replace peg-like people with more stylish, naturally proportioned silhouettes.
- Retain light-grey metric scale and existing dimensional content.

Implemented locally: a reusable routing solver reserves outside piles, tries
parallel45° inner segments, falls back to validated minimum-distance matching,
and draws horizontal tails plus anchor dots. Mobile uses one outside pile;
desktop can use either side. Orbit/resize update metric anchors and routing.
Revised people use natural proportions with standing/walking/waiting poses.
Tram platforms now have solid sides. Narrow-screen dimension collisions are
resolved, touch instructions match controls, and Front accurately names the
elevation preset. SVG export includes source context and matches image clipping.

Second-iteration checks:36 Node tests pass, including180 deterministic randomized
callout clouds and human proportions. Browser checks cover81 combinations across
1440,390 and320px viewports, with text overlap and leader intersection checks,
plus48 orbit states and15 zoom steps. No runtime external requests. All existing
baseline reference files remain unchanged. Selected rendered references are in
[references/](references/). The user subsequently accepted this refined direction and requested the full
implementation plan; see the next entry.

Known remaining limitation: SVG export can lose contour edges behind coplanar
faces due to SVGRenderer painter ordering. It is a draft export, not a faithful
print replacement. The interactive WebGL view has the intended edges. No
production-sheet conversion, physical-device check or publication was done.

## Repeating verification

```sh
npm test
PLAYWRIGHT_MODULE=/home/antti/cityscape-cam/node_modules/playwright node tests/browser.cjs
```

The latter uses an already installed Playwright package and browser on this
machine. On another machine install Playwright in a separate development
environment and point `PLAYWRIGHT_MODULE` to it, or use a locally available
`playwright` package. Preview server must be running on127.0.0.1:8765.
Outputs go into ignored `review/`; retain selected references deliberately.

Physical touch/GPU performance, browser assistive technology, production sheet
integration, wall display and print workflows are not verified by this lab.

## Full-edition planning handoff — 12 November 2026

User: “I like it, plan the whole layout and the ideas for the diorama style
visualizations. I'll let a bit smaller model implement.” This accepts the refined
visual direction and assigns planning, not implementation of all scenes in this
turn. The assistant plan specifies Overview/Focus and responsive/wall/print
layouts, all 33 panel recipes, 44 baseline drawing mappings, shared asset and
renderer contracts, and 16 bounded implementation tasks. Paper is the working
default; no separate palette selection was stated.

Start at [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md). Proposed files/APIs
are identified as future work. Existing app, published files and CAD are unchanged
by this planning pass. The current SVG export limitation stays open. No push or
deployment is authorized. Inventory, relative links and wireframe rendering were
checked; no implementation completion or performance result is inferred.

## T07 and approved reading sequence — 12 November 2026

Vehicles/rescue scenes and reordered candidate navigation are implemented locally.
See PROGRESS.md for the requirement-by-requirement checks and limits. Reviewed
reference renders: [bus lanes](references/vehicles-t07-bus.png),
[car radius](references/vehicles-t07-car-radius.png),
[rescue phone](references/vehicles-t07-rescue-phone.png).
Run `node lab/tests/vehicles-browser.cjs`, `node lab/tests/spread-order-browser.cjs`
and `node lab/tests/shell-browser.cjs` from the worktree root, with the local server
on port 8765. Rescue setup uses the same scale as the bands in the live scene;
its retained historical SVG has its own explicitly enlarged setup plan.

## T08, branding and accessibility callouts — 12 November 2026

Connections now has a metric refuge diorama, a native vector route network with
emphasis controls, and separate pinch/height treatments. See PROGRESS.md for
verification and explicit assumptions. The accepted title/subtitle/date edition
and corrected clear-space/figure callouts are included in this local candidate.
Run `node lab/tests/connections-browser.cjs` and
`node lab/tests/accessibility-browser.cjs` from the worktree root.
Selected references: crossing, native network, pinch point and height-phone
views under `references/connections-t08-*`; corrected turning callouts under
`references/turning-clear-space-phone.png`. Overview/print stills remain T15.

## Current connection redesign — 12 November 2026

Supersedes the initial T08 split-view and distance-emphasis screenshots above.
Current review references: `connections-continuity-phone.png` and
`connections-corridor-phone.png` (plus desktop companions). The route lesson is
static; the clear-space illustration is one positive corridor. See PROGRESS.md
for user authority, editorial provenance, checks and limits. Initial T08 reference
files are historical evidence, not the current recommendation.

## T09 — Building footprint review (12 November 2026)

Plan-first reliefs now cover all five original types at one common metric scale.
Source ranges and drawn examples remain distinct; decorative plaque height carries
no building-height or storey information. Reference set:
[blocks](references/buildings-t09-blocks.png),
[rows in 3D](references/buildings-t09-rows.png),
[rows on phone](references/buildings-t09-rows-phone.png),
[detached plot on phone](references/buildings-t09-detached-phone.png).
The browser measurement report is `references/buildings-t09-results.json`.
Reproduce with `node lab/tests/buildings-browser.cjs` from the worktree root;
see PROGRESS.md for geometry, parity and fallback evidence and remaining limits.
The existing “Check every link” rework item is still pending.

## Current building massing review — 12 November 2026

Supersedes the initial T09 plaque-only screenshots. Current references:
`buildings-massing-{blocks,rows,detached,phone}.png`. Schematic heights/context and
teal stairs were added following user review and inspection of original TKK GIFs;
see PROGRESS.md for the evidence/assumption boundary and validation. TKK supplies
footprint dimensions and schematic stair positions, not model heights/core sizes.

The same review adds the connected luhtitalo gallery/doors/guard openings and its
9 m body-depth dimension. The detached roof now has a low gable and eaves.
`buildings-massing-rows.png`, `buildings-massing-detached.png` and
`buildings-gallery-phone.png` show the updated forms; roof/gallery details are
illustrative rather than TKK specifications.

The final gallery review replaces solid stairs with open planar flights/landings,
and adds a supported gallery canopy with landing wings. All current massing
references are regenerated; earlier solid-stair previews are superseded.
