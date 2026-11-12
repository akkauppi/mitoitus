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
[references/](references/). User acceptance of these refinements remains pending.

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
