# T11 — Planting strips and shallow storage

13 November 2026 · local implementation · assistant artwork/editorial assumptions.
Current implementation of `ground--v0` and `stormwater--v0`, with `trees--v0` reuse
verification. No source/claim IDs, source files, CAD or approved spread order changed.

## Reusable construction

`src/recipes/landscape.js` assembles existing metric surface/base primitives,
original tree/person assets, the new original `createShrub()` and T10's analytical
cut prisms. No imported meshes, textures, external fonts or runtime requests were
introduced. The shrub is procedural artwork made here, not a third-party asset;
no new third-party licence applies. Three.js retains its vendored MIT licence.

New palette roles `water` and `cutWater` belong in `styles.js`; all three treatments
support them. The cut water cap is opaque, outlined and hatched, with original and
retained volume metadata and validated world-coordinate cap anchors. No renderer
clipping trick or transparent layered water is used. Decorative support and ground
bases are separately named/tagged and are excluded from capacity arithmetic.

## Planting widths

The four Espoo source minimums remain ≥3.0 m tree strip, ≥3.5 m main-street tree
strip, ≥2.5 m low shrubs and ≥2.0 m lawn/ground cover. All have the same assumed
6 m illustration length, a local ground datum and common camera/comparison bounds.
Wide screens show them side by side. Phones use separated diagram rows (3D) or
strips along the plan axis (Plan). Row elevation is diagram layout, not terrain.

A category selector shows all four or one strip without changing the comparison
frame, orientation or pixels per metre. Selection is an in-view detail control,
not a new canonical source variant; it resets on page reload or leaving the panel.
Reset restores all four and the default camera. Camera/style and existing query
parameters retain the book's normal state behavior.

Trees remain 5 m high with 3 m crowns. Low shrubs have original faceted 0.60 m
height / 0.90 m crown geometry; ground-cover patches are 0.025 m illustration
relief. These are explicit assumptions, not species specifications. The 0.24 m
decorative bases are not specified soil depths. No snow-storage, utility depth,
clearance or root-volume requirement is inferred from a strip width. The complete
above-ground / below-ground / winter coordination table and notes are retained.

## Storage example

The full water solid is exactly 6 × 5 × 0.20 m = 6 m³, with 30 m² footprint. It
represents the retained 600 m² impermeable catchment and example 1 m³ / 100 m²
provision. Plan shows the full prism; default 3D and Section remove its front half
at local Z=0, retaining 3 m³. Labels identify whole capacity; Sources explains the cut display. 3D dimensions the displayed half-length as **2.5 m shown**; Plan
dimensions the full 5 m. Section uses equal X/Y metre axes and genuinely shows
0.20 m without vertical exaggeration, even though the depth is visually shallow.
The original metric plan/depth graphic remains available under Sources.

An inlet and controlled-overflow arrow indicate schematic functions only. They
have no pipe sizes, outlet levels or flow-rate claim; the scale person is 1.75 m.
The cut decorative support lies strictly below the water and is never counted as
storage. The shape is a rectangular capacity study, not a prescribed construction
section or a complete basin design. Existing 12–24 h example emptying time, Espoo
zoning/site caveat, side slopes, freeboard, maintenance, soil, groundwater and
rainfall text remain unchanged and readable outside the canvas.

## Verification and remaining limits

- Node geometry suite: 95 tests, including actual strip widths/lengths, shrub bounds,
  finite geometry/material registration, responsive/common comparison bounds,
  selected-strip scale, original and retained water geometry and cap anchors.
- `landscape-browser.cjs`: 45 camera/viewport states (320, 390, 768, 1024, 1440 px)
  across planting, storage and existing trees. Checks projected width ratios,
  equal metric depth axes, complete outside labels, uncrossed leaders, unclipped
  and non-overlapping text, camera reload and unrelated query preservation.
  Each planting category is checked at the unchanged comparison scale.
- New scene replacement cycles check stable warmed GPU geometry counts and one
  context. Both new models are exercised in all three palette treatments.
- Canonical details and original figure HTML are compared directly with root
  `index.html`, including the full coordination table and catchment/emptying text.
- No-WebGL and direct-file figures, Overview restoration and zero external runtime
  requests are checked. Existing viewer and whole-shell regressions run separately.
- Candidate verification checks 11 sheets / 33 panels / 44 drawings and explicit
  offline package contents. Build: `python3 lab/scripts/build-book.py --replace`;
  package: `python3 lab/scripts/package-book.py`. Never use the old recursive packager.

Browser evidence is Chromium headless/software WebGL, not a physical touch/GPU
review. There is no hydraulic, ecological, construction or regulatory validation.
Finished print/wall/poster/export work is still T15; static original figures are
retained. “Check every link” remains unaccepted pending rework; Residents & services
remains a substantial publication blocker (T13). Everything stays local; the
published checkout remains at `93bb622`.

User writing amendment: long scene explanations, duplicate plan/profile and
section-mechanics notes are now Sources-only. Main view retains the single
capacity formula and concise practical notes. See QUICK-REFERENCE-WRITING.md.


Final regression evidence: 95 Node tests; 20 candidate tests; 45 landscape/tree
camera states plus 10 replacement cycles (GPU count 30 throughout) and 3 palettes;
35 analytical-section states; 110 whole-shell states; 20 shared-viewer states
and 20 lifecycle cycles. Quick-reference cleanup additionally passed its own
41-note/Sources/file checks, including short radius-reference scope labels. Original source content and the held public checkout were
rechecked; the offline package uses the explicit allowlist.

Current references: [planting on phone](references/landscape-t11-ground-iso-390.png),
[planting desktop](references/landscape-t11-ground-iso-1440.png),
[storage Section](references/landscape-t11-stormwater-section-1440.png),
[clean density view](references/quick-reference-density-1440.png).
