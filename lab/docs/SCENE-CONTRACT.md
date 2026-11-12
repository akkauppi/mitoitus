# Proposed scene and application contract

Specification · 12 November 2026. T01–T09 now implement the candidate shell, rooting-volume host,
shared walking/cycling comparison frame, accessibility, tram, vehicle/rescue, connection and building-footprint scenes; PROGRESS.md records the actual interfaces and checks. Other
recipes and cut support below remain proposed future work.
Implement the minimum contract; do not build a generic modelling editor.
Existing source text and dimensional evidence stay authoritative.

## File boundaries

Suggested source layout, all within the experimental worktree:

```text
lab/
  assets.js, styles.js, callouts.js   reuse accepted implementations
  src/
    book-app.js                     navigation, focus, URL, Sources, downloads
    book.css                        overview/focus/mobile/wall/print
    viewer.js                       one reusable scene host; no global DOM queries
    annotations.js                  projection, dimensions, callout adapter
    registry.js                     panel -> figure recipes and rendering modes
    recipes/                        one small module per scene family or sheet
    primitives/                     strips, footprints, profiles, areas, cut solids
  scripts/
    build-book.py                   canonical content -> isolated candidate HTML
    build-posters.mjs               recipes -> reviewed fallback figures
    package-book.py                explicit artifact allowlist -> candidate ZIP
  tests/                            extend current meaningful tests
  book/                             generated candidate, ignored build output
    index.html, runtime/, vendor/, figures/, assets/
    evidence.html, evidence.json, assignment-extract.txt, downloads/
  docs/                             current handoff and verification
```

Do not rename/extract everything at once. Preserve the current `lab/index.html`
review page while the reusable host is introduced. The candidate must carry its
own required relative assets: no `../../` escape from its deployable/offline root.
Use the existing vendored Three.js version and licence; verify bytes against the
hash manifest. A module extraction is not a dependency-upgrade task.

## Canonical content adapter

At baseline, panel titles, context, details and SVGs are generated in
`build-tools/build_sheets.py`, plus `student_sheet.py` and `parking_sheet.py`.
The root `index.html` is the committed generated snapshot. The plan inventory
was read from that snapshot; it is **metadata, not a second content authority**.

For the first candidate, read the committed root HTML, preserve each panel's
`.panel-top`, `h2`, `.details`, proof link, variant options and fallback figures,
and attach stable metadata from `scene-inventory.json`. Preserve exact text,
tables, inline emphasis and `.source-meta` classification. Change only wrappers
needed for layout. Use an HTML parser rather than regular-expression HTML edits.
The adapter must fail on unknown/duplicate/missing panels or variant mismatches.

Canonical content changes later require a deliberate ordinary source build and
snapshot update, not edits to generated `lab/book/` or copied prose in recipes.
Do not extract original DOCX/PDF/TKK sources during a normal rebuild. If later
adding IDs directly to the generator, do it as a tested metadata-only change and
support a temporary output root before generating revised outputs.

Record a parity manifest per candidate: baseline file SHA256, ordered sheet/panel
IDs, normalized semantic text digest, ordered fact/table cells, proof hrefs,
visible/Source-only classes, variant names/order and their preserved old indices.
Normalization may collapse whitespace; it must not erase symbols, dates, units,
qualifiers, case, signs or numbers. Inspect any intentional exception explicitly.

## Stable identities and figures

- Sheet ID: existing HTML hash, e.g. `green-blue`.
- Panel ID: existing unique evidence claim anchor, e.g. `trees`.
- Legacy drawing ID: `<panel-id>--v<zero-based-index>`; for non-variant panels use
  `--v0`. Inventory has exactly 44 such IDs.
- New subfigure: `<panel-id>--<purpose>`, e.g. `tram-length--city-comparison`.
  This is a view of existing content, not a new independent claim. It may coexist
  with the old combined figure; every old figure remains mapped and covered.
- View presets and variant IDs are stable strings, not display text or array order.

A panel can contain multiple figures or metric/schematic subfigures. Preserve
all of them; one source SVG may contain several diagrams. The inventory's count
alone does not prove their internal content survived. Use the scene catalogue.

## Panel registry and subfigure selection

A panel registry entry lists `figureIds`, `defaultFigureId` and each figure's
supported legacy variants. A baseline SVG can contain several diagrams, so a
panel may provide a combined comparison plus focused subfigures. Example:
`arrival--comparison`, `arrival--bay`, `arrival--bench` all cover the retained
baseline `arrival--v0`. Do not replace the combined overview with only one detail.

Use `figure=<stable-figure-id>` to bookmark a chosen subfigure. It must belong to
the active panel and support the active legacy variant; otherwise reset it to that
panel/variant's default without discarding other URL state. Existing `layout-*`
parameters remain authoritative for the original source alternatives. Figure
selection does not silently reset those choices or renumber the 44 baseline IDs.
A figure change is semantic navigation (history push); emphasis-only highlighting
is local display state (replace or ephemeral). Static fallback and live Focus
select the same figure. All original panel facts remain available when selecting
a subfigure, even if that detail does not visualize every fact.

The inventory's `plannedTreatment` is **panel-level planning metadata**, not the
runtime `kind` enum. Map it deliberately:

| Planning treatment | Runtime recipes |
| --- | --- |
| metric-3d | one or more `metric-3d`, with optional metric plan/profile companions |
| metric-plan-relief | `metric-2d` plan plus optional `metric-3d` decorative relief |
| metric-2d | `metric-2d` |
| data-2d / information-2d | `data-2d`; separate metric area tile where the catalogue calls for one |
| conceptual-cutaway | `conceptual-3d`; any dimensioned inset is a separate `metric-2d` |
| hybrid | explicit list of the applicable kinds; never pass literal `hybrid` to a renderer |

## Data model

The following illustrates the intended shape; values must be adapted to the
actual recipe, not blindly copied into every scene:

```js
const recipe = {
  id: 'trees--v0',
  panelId: 'trees',
  sheetId: 'green-blue',
  kind: 'metric-3d', // also metric-2d, data-2d, conceptual-3d
  sourceClaims: ['trees'],
  baselineDrawingIds: ['trees--v0'],
  assumptions: [
    {id: 'tree-form', text: 'Tree height 5 m and crown 3 m are illustration assumptions.'},
  ],
  defaultCamera: 'iso',
  allowedCameras: ['iso', 'plan', 'front', 'section'],
  section: {implemented: true, plane: {normal: [0, 0, 1], offset: 0}},
  comparison: {group: null, frameMode: 'fit-once'},
  primaryCallouts: ['soil', 'tree'],
  overviewCallouts: ['soil'],
  // facts are canonical panel HTML; no replacement four-row summary here
};
```

The section example is a proposed contract, **not** evidence that a cut plane is
currently implemented in the lab. Only advertise Section after building the
actual exposed solid/capped cut, matching anchors and confirming the cut view.

Geometry builders return:

```js
{
  object,                 // Three.Group, metres, Y up
  dimensions,             // world endpoints + short value text + claim/assumption ID
  callouts,               // stable IDs, text, world anchor, priority
  bounds,                 // metric bounds, excluding label furniture
  measurementAssertions,  // expected sourced dimensions/derived arithmetic
  dispose                 // releases owned geometry/material resources
}
```

Use semantic material roles from `styles.js`; no ad-hoc scene palette. Reuse
parameterized primitives and assets instead of storing large hand-authored vertex
lists. A named source minimum/range is not silently turned into an exact universal
size: record which representative is drawn, as the existing source does.

### Metric versus conceptual

`metric-*`: real metre geometry, equal axes, actual dimensional assertions.
`data-2d`: chart domain/units, no physical scale bar or camera pretending counts
are metres. `conceptual-3d`: composition coordinates are illustrative, not
construction dimensions; prohibit metric scales, layer-thickness dimensions and
computed capacities. Keep separately dimensioned subfigures, such as the slope
triangle, in their own metric recipe. No 3D model may blur those distinctions.

### Comparison framing

A comparison group supplies a shared orientation, datum and **union bounds across
all variants**, plus reserved annotation margins. Compute its frustum once for
viewport size; switching alternatives must not recompute pixels per metre. Reset
restores the common frame. Shared groups include walking/cycling, the three
building panels, planting widths, W/H examples and equal-density plots.

Independent overview cards in a shared-scale group must use the same figure box
height/width and pixels per metre; do not fit each card separately. When resized,
recompute the group once. Assert screen-width ratios using actual projected
endpoints, not only world-coordinate numbers. User orbit/zoom may change the
camera; retain that shared camera on variant changes and label it as user-adjusted.

## Renderer lifecycle

Proposed API:

```js
const host = createSceneHost({canvas, overlay, fallback, status, onCameraChange});
await host.show({recipeId, variantId, camera, style, comparisonFrame});
host.setAnnotations({dimensions: true, callouts: true});
host.resize({width, height, pixelRatio});
host.reset();
host.suspend();
host.dispose();
```

Only one live WebGL context is owned by the app. Keep it while switching focused
3D panels; dispose old scene resources. Overview/wall/print use static figures;
2D panels need no new WebGL context. Render only on changes. Cap DPR at 2 and
avoid large wall-sized render targets. A superseded asynchronous scene load must
never overwrite the more recently selected scene.

Own and dispose ResizeObserver, controls, scheduled animation frame, scene
geometries/materials, event handlers and downloads' object URLs. Handle WebGL
context loss by restoring the existing figure, not blanking the panel. No global
window handlers or selectors inside the host. Do not copy current lab `viewer.js`
as another monolithic app for every panel.

## Annotation adapter

Project metric anchors, clip to the visible illustration region and call the
existing solver. Keep stable IDs and anchor counts. Reserve outside gutters before
framing, measure text width at actual font/zoom, and check dimension/callout text
collisions separately. A valid empty result must not mask missing visible anchors.
A clipped-off anchor is omitted deliberately; do not clamp its dot onto the border.
Depth-occluded anchors require a declared recipe policy, not an invented visible
surface point. The current solver does not perform depth visibility tests.

If a recipe cannot fit: retry a less dense but explicit detail view or reframe;
never emit crossed paths. Short overview posters may use their declared primary
subset, with remaining facts retained in text. In Focus, do not silently omit
requested visible callouts. Test crossings after orbit, resizing and variant changes.

## State and navigation

Preserve these baseline state keys:

```text
#<sheet-id>
view=desktop|wall
layout-walking=0..3
layout-cycling=0..4
layout-car-layout=0..2
layout-bus-layout=0..2
```

Add independently:

```text
mode=overview|focus
panel=<claim-id>
figure=<stable-figure-id>
camera=iso|plan|front|section
style=paper|ink|soft
```

Default Overview, first valid panel in the selected sheet, Paper, recipe's default
camera; invalid values fall back safely. A valid `panel` in another sheet must not
silently show mismatched content: normalize it to the hash's sheet. Keep existing
hash aliases `transit-access -> tram` and `fit-street/section-scale -> section-details`.
Use history push for sheet/panel/figure navigation and replace for local view controls;
Back/Forward restores the displayed content, variants and focus state. Preserve
all unrelated query parameters when updating one. Sources remains off on reload
and is not restored from URL or storage.

Scope arrow/Home/+/- camera controls to the focused viewport. Elsewhere preserve
existing sheet shortcuts and input/select behavior. Escape/back-to-sheet returns
focus to Explore; overlays/menus follow normal keyboard behavior. User interface
focus and the chosen model camera are separate state.

## Static output and offline contract

Generate reviewed posters for every view/variant actually shown without WebGL,
with the same geometry/material/data version and annotation policy. Cache keys
include recipe, variant, camera, palette, comparison frame and output profile.
Never grab an unready/blank live canvas during print. SVG 2D figures remain native
vector. Diorama PNG fallback is allowed and must be identified accurately.

The candidate root contains only explicitly listed runtime files, branding,
reviewed figures, evidence, minimal assignment extract and existing public CAD
assets. Keep sources, node_modules, .git, lab development pages, review logs,
Playwright output and build tools out of the public offline ZIP unless a specific
sanitized source package is separately requested. Do not use ROOT.rglob('*').
All paths must remain inside the artifact root; verify ZIP names and size budget.

The existing baseline opens directly from disk; ES-module 3D needs HTTP. Preserve
a useful direct-file experience with static figures, text, navigation and variant
selection through a small bundled/classic fallback, no module fetches required.
The same package served locally enables interactive 3D. This is a deliberate
compatibility requirement, not permission to claim full direct-file 3D support.


The connection review supersedes T08's route emphasis and separate pinch/height
selection. `walking-connections` is now one static weakest-link SVG and editorial
draft, with earlier source details retained in a Sources-only history drawer.
`clear-route-continuity--v0` is one combined corridor. Historical `detail` and
`emphasis` query parameters are ignored; the old internal `-height` recipe alias
resolves to the same unified geometry. No source variants are added. The candidate
builder's explicit `connection_editorial.py` transform preserves baseline source
files while adopting the user-requested presentation/content amendments.


T09 uses `primitives/footprints.js` for decorative plaques, repeated modules and
plot surfaces. All three `building-*--v0` models share `BUILDING_FRAME` and the
`building-footprints` comparison ID, including camera/zoom continuity. Their
source figure identities and overview SVGs remain unchanged. User review supersedes the original plaque-only view: 3D is now default,
with illustrative massing/scale context from `primitives/massing.js`; Plan retains
the common metric comparison. Heights, facade rhythms and stair sizes are
explicit assumptions. Stair positions follow qualitative inspection of TKK GIFs. `building` / `buildingAlt` are palette roles, not
building-use or structural classifications.


Building review follow-up: `entranceGallery` connects the luhtitalo stair landings,
deck, guard openings and upper doors; the body-depth dimension remains sourced
9 m drawn geometry. `gabledRoof` preserves the 15 × 10 m wall rectangle and adds
an illustrative eave overhang/rise. These additions do not change plot areas or
create new source variants. Their geometry is tested independently of footplates.

The final luhtitalo review uses thin open treads/landings and stringers in place of
solid stair wedges. The gallery has a canopy on light posts, plus landing wings;
unit tests check underside voids, roof coverage and door clearance. These remain
schematic detail, not construction prescriptions.


## T10 current implementation — 12 November 2026

Shared analytical caps, true Section views, metric comparisons and user review
amendments are implemented and tested locally. See [T10-SECTIONS.md](T10-SECTIONS.md)
for the API, material convention, exact dimensions, assumptions, evidence and
remaining limitations. This supersedes planned-only descriptions for these panels.


## T11 current implementation — 13 November 2026

Planting widths and shallow storage are implemented locally. See
[T11-LANDSCAPE.md](T11-LANDSCAPE.md) for geometry, common-scale detail controls,
water/cap palette roles, assumptions, source preservation and verification limits.
This supersedes planned-only recipes for `ground` and `stormwater`.


## Quick-reference writing amendment — 13 November 2026

User required strict removal of visible AI filler and disclaimers. The rule now
leads project AGENTS.md. Main views use concise practical notes; long recipe
explanations, repeated diagrams and assumptions stay under Sources. See
[QUICK-REFERENCE-WRITING.md](QUICK-REFERENCE-WRITING.md) for the implementation,
source-preservation boundary and extension rules. This supersedes earlier
records that described those explanation blocks as part of the main view.


## T12 current implementation — 13 November 2026

Six conceptual stormwater cutaways now reuse the analytical caps, palette and
vegetation primitives. Diagram coordinates have no physical dimensions or
computed capacity; the metric bank-slope triangle is a separate native SVG. See
[T12-STORMWATER.md](T12-STORMWATER.md) for interfaces, options, evidence and limits.
This supersedes planned-only recipes for the three stormwater-options panels.
