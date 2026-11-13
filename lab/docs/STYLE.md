# Drawing language and delegation contract

Version 0.2 · 12 November 2026. The user accepted the refined prototype as the
visual direction. This guide records that baseline plus proposed extension rules;
new full-book panels and layout still require implementation/review.

## User brief

Keep the existing dimensional content. Explore small, legible 3D dioramas with
pastel colours, edges, ground depth, scale people/trees/cars/trams and responsive
views. Even when geometry is 3D, the result should look like vector graphics.
Document repeated assets and the process so future models can extend the system.
Publishing follows explicit task authorization; the 13 November 2026 release goal supersedes the earlier local-only hold.

## Invariants

1. One world unit is one metre; Y is up, vehicle travel is along Z. Asset origins
   sit on the ground. No vertical exaggeration, arbitrary object resizing or
   camera-dependent geometric scaling. Preserve measured car/tram body plans.
2. Use an orthographic camera. The 3D, plan and front-elevation presets use the same
   metric scene. Auto-framing differs by scene; a scene is internally to scale,
   but separate scenes do not share a fixed pixels-per-metre scale.
3. Use opaque, flat colour regions and a small semantic palette. No image
   textures, gloss, bloom, depth of field, photoreal skies or gratuitous animation.
4. Outline major creases, not every triangle. Current hard-surface edges use
   EdgesGeometry, 30–32° thresholds and WebGL's one-device-pixel lines. Foliage
   uses faceted form. Do not compensate for low contrast by adding mesh wireframes.
5. Ground blocks are visibly thick. Decorative sublayers are illustration
   assumptions; only the root-volume study dimensions the soil itself.
6. People stay light grey and exactly 1.75 m tall. Trees are scale objects,
   not species/maturity or clearance claims. Vehicle heights and decorative
   details are assumptions; cited body plans are not swept paths.
7. Dimension endpoints are world coordinates. Project them into SVG; keep labels
   upright. Numeric dimensions use weight 500 and scale from 6.5 px at a 320 px
   drawing width to 10.5 px at 900 px (5.5–11 px limits). Use measured glyph bounds
   for placement and font-relative line gaps. Named outside callouts keep their
   own screen-space sizing. Never bake text into a texture or manually position
   labels as a percentage of the canvas.
8. Use short labels in the drawing. Detailed provenance stays under Sources.
   Keep essential numbers in a text list even if WebGL or an overlay is unavailable.
9. Render on changes, not a perpetual animation loop. Cap pixel ratio at 2, and
   avoid spawning a WebGL context per card. No network dependencies at runtime.

## Treatments to compare

| Treatment | Purpose | Construction |
| --- | --- | --- |
| Paper model | A softly modelled architectural drawing | Muted semantic colours, gentle Lambert lighting, fine edges, no shadow map |
| Contour drawing | Most explicitly vector-like | Pale basic-material fills, stronger edges, no lighting or shadows |
| Pastel relief | Test whether more depth helps | Richer pastel palette, directional light and soft ground shadows |

Colour values live only in `styles.js`. Every mesh has `userData.role`; every
outline has `userData.edge`. Scene code must not add an unregistered colour.
Current roles: clearance, paving, cycle, road, grass, soil, subsoil, root, person, foliage,
trunk, building, buildingAlt, circulation, roof, vehicle, glass, rubber, metal, furniture, rail and white.

## Asset catalogue

| Asset | Actual bounding dimensions, metres | Detail budget / purpose |
| --- | --- | --- |
| Person | Height 1.75 | Neutral simple articulated silhouette; illustration assumption |
| Low shrub (T11) | Height 0.6, crown 0.9 | Original faceted form; illustrative, not a species specification |
| Tree | Default height 5, crown 3; parameters supported | Polygonal crown and branching trunk; no species claim |
| Car | Width 1.8 × height 1.5 × length 5 | Sourced body plan; assumed height/detail |
| Bus | Width 2.6 × height 3.2 × length 15 | Existing Espoo design-bus plan; height/detail assumed, mirrors omitted |
| Tram | Width 2.4 × height 3.4 × length 34 | Sourced body plan; five illustrative body sections |
| Bicycle | Width 0.6 × height 1.2 × length 2 | Existing nominal envelope, recognizable frame/wheels |
| Manual wheelchair user | Width 0.72 × height 1.35 × length 1.20 | Original seated pose/device; illustration assumptions only |
| Cyclist (T04) | Width 0.6 × height 1.65 × length 2 | Existing seated-posture/bar illustration envelope; natural pose |
| Bench | Length 1.8, height 0.85 | Illustrative seat, back and frame |

`ASSET_SPECS` in `assets.js` is the implementation catalogue. All ten assets are
original procedural artwork; no external asset meshes are currently included.
Geometry tests measure actual vertices, including wheels and protrusions.

## Scene recipe

Use the existing `SCENES` and `buildScene()` pattern. Each scene supplies:

- A stable ID, short name, accessible description and source-note text.
- Source claim anchors and exact dimensions already adopted by the rulebook.
- Metric ground/surface solids, reused assets and explicit placements.
- Dimension endpoints, world-space offsets and label text.
- Label anchors and camera presets, without new per-scene renderer logic.

The first recipes are hand-written prototypes. For the full book, extract
declarative surface/asset/dimension metadata and validate the small contract
described in SCENE-CONTRACT.md; keep geometry builders as readable functions.
Do not prematurely turn educational examples into a general CAD application.

## Ready-to-delegate task template

> Add scene [ID] using existing [evidence claim IDs]. Read AGENTS.md, README.md,
> STYLE.md and SCENE-EVIDENCE.md. Keep the current content and palettes. Change
> only scenes.js and the scene evidence note unless an explicit missing asset is
> part of the task. Use existing asset functions and metre coordinates. State
> every assumed height, depth and placement in provenance. Add meaningful
> geometry assertions for sourced dimensions; run npm test. Capture desktop
> and narrow-phone views in all three treatments, plus plan and front elevation. Check
> labels, proportions, source links, page overflow and SVG export. Describe
> limitations and make a focused local commit. Do not push or deploy.

## Review criteria

Inspect recognisability at phone size, contrast of people against paving,
linework density, ground depth, value hierarchy and whether labels compete with
objects. Verify dimension lines measure what the captions say. Keep decorative
objects out of the measured clear space where that would imply a false design.
A screenshot pass is not physical-device, accessibility or design-compliance
certification. Use the accepted refined prototype as the visual reference; review each new
scene family before bulk conversion.

## Iteration 02 refinements

User requested orderly outside label piles with two-segment noncrossing leaders
and dot anchors. `callouts.js` now owns a pure screen-space solver, independent
of Three.js and content. See [CALLOUTS.md](CALLOUTS.md) for the routing contract.
Keep the visible image inside its reserved gutters when zoomed; label text and
lines remain SVG. Reframe or reduce active labels if the solver reports no fit;
never display a crossing fallback. Dimensions remain separate metric annotations.

People now have a 0.23 m shaped head, tapered torso/pelvis, knees/elbows, understated
shoes and standing/walking/waiting poses. These are chosen illustration
proportions, not sourced population measurements. Height remains 1.75 m.

The former Section button is now Front: it is an elevation, not a cutting plane.
SVG export preserves clipping and embeds source/draft context in its description,
but painter-order line occlusion remains a known draft-export limitation.

## Production asset backlog

Plan only; build an asset when its assigned panel needs it. Every asset keeps a
metric origin on the ground, named semantic parts, shared material roles and
provenance. An unspecified physical size is an illustration assumption, not a
new dimensioning recommendation. Keep original code/source and measured bounds.

| Asset / primitive | Reuse or add | Dimensional contract and use |
| --- | --- | --- |
| Person: standing/walking/waiting | Reuse | 1.75 m; current head/body proportions; all neutral light grey. |
| Seated person / mobility-device context | Manual wheelchair user implemented after T05 | Derive a natural pose, not uniform shrinking; no claim that the silhouette validates a clear turning space. Omit if unnecessary. |
| Bicycle and rider | Reuse (implemented T04) | Bike 0.6 × 2 m / 1.2 m height; existing rider posture 1.65 m with 0.60 m bars. Do not conflate the two envelopes. |
| Car | Reuse | Body 5 × 1.8 m; current 1.5 m height/detail are assumptions. No mirrors or swept path implied. |
| Bus | Width 2.6 × height 3.2 × length 15 | Existing Espoo design-bus plan; height/detail assumed, mirrors omitted |
| Tram | Reuse | Body 34 × 2.4 m; current 3.4 m height/detail assumptions. No ATU derived from body. |
| Design bus | Add in T07 | Existing body 15 × 2.6 m; height/detail explicitly assumed if modeled. Straight reference placement only. |
| Rescue vehicle | Optional, not required | Use neutral setup/clearance outlines by default; no guessed appliance footprint or deployed boom. |
| Tree / shrub / ground cover | Tree reused; shrubs in T11 | Parameterized tree, current 5 m / 3 m crown illustration; no species/maturity claim. Shrub sizes assumed; flat ground cover uses no fake canopy height. |
| Bench / shelter | Bench reused; shelter module if needed | Decorative furniture dimensions recorded; keep measured clear passages open. No new compliant-product claim. |
| Ground / surface strip / bay grid | Shared primitives | Exact endpoints, contiguous solids, no floating slabs; decorative base excluded from measured volume. |
| Footprint / plot / floor plate | Add in T09–10 | Exact existing plans; display relief is not building height. Schematic floor spacing stays separate from metric geometry. |
| Ramp / steps | Ramp implemented T05; steps in T10 | Exact run, rise, landing and repeats; matching actual cut faces; no decorative slope exaggeration. |
| Kerb / rail / markings | Shared optional context | Preserve source-defined plan markings. Record assumed vertical details; decorative rails do not imply a clearance envelope. |
| Clearance / radius geometry | Clear disks implemented T05; other references follow | Exact numeric radius/diameter and axes. No polygonal approximation that changes the measured limit; no motion simulation. |
| Soil / water / conceptual section stack | Add in T10–12 | Metric blocks only for adopted volume examples; conceptual layers carry no measured thickness/capacity. |
| Route / barrier / process arrows | Shared SVG | Metric route lengths where adopted; symbols and process arrows are semantic, not hydraulic or traffic simulations. |

Use named functions/recipe data instead of unrelated duplicated meshes. Keep the
asset palette in `styles.js`, and annotations in the shared adapter. Blender or
SolidCraft imports must pass the same bounds, material-role, silhouette and
fallback/export checks as procedural assets; neither is a required dependency.

## Wheelchair and dimension-label amendments

User instructions after T05 supersede the earlier omitted-avatar/bay-car choices:
use the manual wheelchair user on the ramp landing, beside the car in the bay,
and in appropriate route examples. Keep the measured turning disks and bench-end
rectangle free; the turning figure is adjacent context. Chair/device dimensions
and placement are illustration assumptions recorded in ASSET_SPECS and scene
provenance. The ramp's truncated adjoining segments are illustrative context,
with the core measured run/rise/landing unchanged.

Dimension text has no opaque background or halo. Clip line intervals against the
actual text glyph bounds with a small gap; preserve dimension endpoints. Do not
restore a paper-coloured patch to hide a collision with a model or annotation.

Short vehicle scenes may clip the original metric vehicle mesh longitudinally.
Never scale its length to fit. Use a pastel vehicle-role cap with fine diagonal
hatching at each cut, and explicitly explain the cut outside the viewport.
Keep nominal body dimensions separate from platform/service lengths and access
ramps. Tracks provide scale, not proof of swept-path or clearance compliance.

Bus refinement: treat glazing as a separate body band between lower shell and
roof, with no opaque shell coplanar behind the windows. Keep visible pillar faces
at least 10 mm proud of glass and inside the nominal 2.6 m envelope. Use restrained
chamfers, real wheel-arch notches and simple hubs/doors rather than stacked boxes
and window decals. These details and the 3.2 m height remain illustration assumptions.


Building-footprint plaques use `building` and `buildingAlt` palette roles. The
secondary fill marks repetition; it does not imply a different material or use.
`footprints.js` retains a 0.12 m metric footprint plaque. User review adds separate
illustrative massing via `massing.js`, with explicit height/facade assumptions.
All three building panels share one comparison frame; never auto-fit their types
individually. Preserve garden joints and relative house placement inside the plot.


Teal `circulation` marks stair rooms/external stairs. Partition opaque mass around
internal cores so visible roofs do not coincide; facade glazing sits 25 mm proud
of walls to avoid Z fighting. Massing heights/facade rows are illustration choices,
not source storey counts. Original trees, people and cars keep their existing
metric sizes and remain outside building footprint interiors. Context placement
and pads are illustrative, without parking/access/setback validation.


Luhtitalo access uses one continuous upper gallery, doors opening onto the deck,
and stair landings adjoining its front edge. Leave gaps in the front guard at
those landings. Keep the dimensioned 9 m body depth distinct from the assumed
1.6 m gallery and external stair projections. Detached houses can use the original
low gable/eave primitive (`roof` palette role) over the unchanged wall footprint;
roof rise, overhang and gallery/guard details remain illustration assumptions.

External luhtitalo stairs are open planar flights: thin treads, light stringers
and a thin landing on posts. Preserve visible air beneath the flight and landing;
do not fill their volume down to the ground. The supported gallery canopy and
landing roof wings join edge-to-edge, with roof geometry separated from doors.


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


## T13 current implementation and user amendments — 13 November 2026

Resident figures on equal 0.4 ha tiles and numbered distance circles supersede
the planned bar-only treatment. Services now separates dated space provision,
local growth/capacity and proposed population responsibility. See
[T13-POPULATION.md](T13-POPULATION.md) for source review, editorial changes and tests.
Old 2D fallback illustrations are retired from release; export is blocked until
T15 supplies reviewed replacements. This supersedes earlier package instructions.
