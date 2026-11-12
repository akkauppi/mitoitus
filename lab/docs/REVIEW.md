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

This iteration is being implemented locally. The first iteration remains a
Git checkpoint; acceptance and further visual feedback remain open.

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
