# T12 — Conceptual stormwater cutaways

13 November 2026 · local implementation · assistant illustration/editorial draft.
Panels `rain-gardens`, `ponds`, `source-control`; all retain canonical `--v0` figures.

## Reading the scenes

- **Rain garden / swale:** the planted filter has its own muted green material.
  Static inflow, drainage and conveyance arrows describe processes. Infiltration
  uses a dashed arrow and the conditional label “Infiltration?”. The swale carries
  water along the route and shows temporary storage; no capacity or rate is given.
- **Dry basin / wet pond:** Section is the default. Dry detention and wet conditions
  share a conceptual basin. Wet permanent water lies below the normal level;
  lighter storm storage lies above it. Both have controlled-outlet and overflow
  symbols. Dashed normal-level line is identified by a short key. The dry option's
  normal level is the drained bed. Wet vegetation is illustrative, not a species plan.
- **Green roof / permeable paving:** roof vegetation, substrate, evapotranspiration
  and drainage are labelled. Paving has separate surface, aggregate and subsoil;
  small blue pore symbols identify water within aggregate voids. The entire
  aggregate layer is not coloured or counted as water. Rainwater reuse and
  underground storage remain in the complete four-row options table; no new tank
  geometry, dimensions or wet-load assumptions are added.

All six are schematic cutaways in diagram coordinates. The main view has short
labels and retained practical guidance, without explanatory/disclaimer paragraphs.
Artwork assumptions and provenance remain under Sources and in this record.

## Construction and reuse

`primitives/conceptual.js` wraps T10 analytical cut prisms and supplies static
`processArrow()` glyphs. Each actual cap has its local plane and polygon, and
`validateCapAnchor` checks labelled face anchors. Exposed metadata declares
`kind: conceptual`, `coordinateUnits: diagram` and excludes metric original/retained
volume fields. Recipes expose no measurement object, dimensions, physical scale
bar or computed storage. Layer proportions are drawn for legibility, not as metre
specifications; process-arrow lengths are not rates. No hydraulic animation runs.

`recipes/stormwater.js` assembles soil, water, section stacks and existing original
faceted shrub forms. No human, car or other metric scale reference is used. All
meshes use registered shared roles; `filter`, `flow` and `permanentWater` extend
all three palettes. Blue pores use the existing cut-water role. There are no new
third-party assets or licences; the existing vendored Three.js MIT licence remains.

The shared viewer still owns one canvas/context. The existing category control now
supports either all/single planting strips or a two-option conceptual system. Each
system starts at its first option, preserves option through camera/style/resize,
and resets to its first option on Reset. Option is a transient view control and
resets on page reload or leaving the panel; no canonical variants or figure IDs
are added. Camera/style continue to use the book's URL/history handling.

## Separate metric slope triangle

The ponds panel has a distinct native-SVG companion below the conceptual viewport.
It clones only the original source slope triangle and its following dimension
labels, using its own `25 375 380 80` viewBox. Original 4 m horizontal / 1 m vertical
values and equal axes are preserved; 1:4 = 25%, 1:5 = 20%. The complete original
figure remains untouched for Overview, no-WebGL/direct-file and print/wall fallback.
The conceptual basin has no dimension labels, scale bar or adopted slope/depth.
The source “typically tens of cm” wetland context is retained without turning it
into a chosen dimensioned water depth.

## Verification

- 100 Node tests: six conceptual options, cap/anchor validity, registered materials,
  finite geometry, no metric/capacity output, conditional infiltration, along-route
  swale arrow, wet normal-level separation and isolated paving pore symbols.
- `node lab/tests/stormwater-browser.cjs`: 60 option/camera/viewport states over
  widths 320/390/768/1024/1440. Complete outside callouts, no crossed leaders,
  text clipping/overlap or horizontal overflow; no metric text/dimensions in the
  conceptual viewport. Separate triangle preserves 4:1 projected axes at every size.
- Ten cycles through all new models/options verify stable warmed GPU geometry
  counts and one context. Three palettes, keyboard camera interaction, Reset,
  reload, unrelated query parameters and option persistence through camera changes
  are exercised. No-WebGL and direct-file original figures remain useful.
- Canonical original details/figures are compared directly with root `index.html`,
  excluding only explicit quick-reference presentation copies/attributes. The full
  source-control matrix and its substrate/wet-load/storage, pore/subsoil/drain,
  tank/demand and outlet/emptying/maintenance inputs remain intact.
- Candidate verification: 11 sheets / 33 panels / 44 source drawings. Explicit
  allowlist adds only the conceptual primitive and stormwater recipe runtime files.
  Build with `python3 lab/scripts/build-book.py --replace`; package with
  `python3 lab/scripts/package-book.py`. Keep the old recursive packager unused.

Evidence uses headless Chromium/software WebGL; physical GPU/touch hardware,
hydraulic performance and construction/regulatory compliance are not validated.
Final generated poster/print/wall/export review remains T15. No publication occurs.
Residents & services is still a substantial T13 publication blocker, and “Check
every link” is still explicitly unaccepted pending rework. Root source files,
claim IDs, approved spread order, source originals and public checkout are preserved.

Final regressions: 20 candidate tests; 110 whole-book states (33 panels, 15 retained
variants); 20 shared-viewer states plus 20 lifecycle cycles; 45 planting/storage/tree
states; quick-reference writing checks. T12's ten replacement cycles hold at 76
GPU geometries after warming both options. The offline package is rebuilt; the
public checkout remains clean at `93bb622`.

Reference captures: [rain garden](references/stormwater-t12-rain-gardens-0-1440.png),
[swale](references/stormwater-t12-rain-gardens-1-390.png),
[dry basin](references/stormwater-t12-ponds-0-1440.png),
[wet pond](references/stormwater-t12-ponds-1-390.png),
[roof](references/stormwater-t12-source-control-0-1440.png),
[paving](references/stormwater-t12-source-control-1-390.png).
