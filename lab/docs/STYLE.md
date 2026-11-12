# Drawing language and delegation contract

Version 0.2 · 12 November 2026. The user accepted the refined prototype as the
visual direction. This guide records that baseline plus proposed extension rules;
new full-book panels and layout still require implementation/review.

## User brief

Keep the existing dimensional content. Explore small, legible 3D dioramas with
pastel colours, edges, ground depth, scale people/trees/cars/trams and responsive
views. Even when geometry is 3D, the result should look like vector graphics.
Document repeated assets and the process so future models can extend the system.
Local commits are permitted; pushing and deploying are on hold.

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
   upright, readable and approximately 11–12 CSS pixels. Never bake text into a
   texture or manually position labels as a percentage of the canvas.
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
Current roles: paving, cycle, road, grass, soil, subsoil, root, person, foliage,
trunk, vehicle, glass, rubber, metal, furniture, rail and white.

## Asset catalogue

| Asset | Actual bounding dimensions, metres | Detail budget / purpose |
| --- | --- | --- |
| Person | Height 1.75 | Neutral simple articulated silhouette; illustration assumption |
| Tree | Default height 5, crown 3; parameters supported | Polygonal crown and branching trunk; no species claim |
| Car | Width 1.8 × height 1.5 × length 5 | Sourced body plan; assumed height/detail |
| Tram | Width 2.4 × height 3.4 × length 34 | Sourced body plan; five illustrative body sections |
| Bicycle | Width 0.6 × height 1.2 × length 2 | Existing nominal envelope, recognizable frame/wheels |
| Bench | Length 1.8, height 0.85 | Illustrative seat, back and frame |

`ASSET_SPECS` in `assets.js` is the implementation catalogue. All six meshes are
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
| Seated person / mobility-device context | Optional add in T05 | Derive a natural pose, not uniform shrinking; no claim that the silhouette validates a clear turning space. Omit if unnecessary. |
| Bicycle and rider | Bike reused, rider added in T04 | Bike 0.6 × 2 m / 1.2 m height; existing rider posture 1.65 m with 0.60 m bars. Do not conflate the two envelopes. |
| Car | Reuse | Body 5 × 1.8 m; current 1.5 m height/detail are assumptions. No mirrors or swept path implied. |
| Tram | Reuse | Body 34 × 2.4 m; current 3.4 m height/detail assumptions. No ATU derived from body. |
| Design bus | Add in T07 | Existing body 15 × 2.6 m; height/detail explicitly assumed if modeled. Straight reference placement only. |
| Rescue vehicle | Optional, not required | Use neutral setup/clearance outlines by default; no guessed appliance footprint or deployed boom. |
| Tree / shrub / ground cover | Tree reused; shrubs in T11 | Parameterized tree, current 5 m / 3 m crown illustration; no species/maturity claim. Shrub sizes assumed; flat ground cover uses no fake canopy height. |
| Bench / shelter | Bench reused; shelter module if needed | Decorative furniture dimensions recorded; keep measured clear passages open. No new compliant-product claim. |
| Ground / surface strip / bay grid | Shared primitives | Exact endpoints, contiguous solids, no floating slabs; decorative base excluded from measured volume. |
| Footprint / plot / floor plate | Add in T09–10 | Exact existing plans; display relief is not building height. Schematic floor spacing stays separate from metric geometry. |
| Ramp / steps | Add in T05/T10 | Exact run, rise, landing and repeats; matching actual cut faces; no decorative slope exaggeration. |
| Kerb / rail / markings | Shared optional context | Preserve source-defined plan markings. Record assumed vertical details; decorative rails do not imply a clearance envelope. |
| Clearance / radius geometry | Shared SVG or geometry | Exact numeric radius/diameter and axes. No polygonal approximation that changes the measured limit; no motion simulation. |
| Soil / water / conceptual section stack | Add in T10–12 | Metric blocks only for adopted volume examples; conceptual layers carry no measured thickness/capacity. |
| Route / barrier / process arrows | Shared SVG | Metric route lengths where adopted; symbols and process arrows are semantic, not hydraulic or traffic simulations. |

Use named functions/recipe data instead of unrelated duplicated meshes. Keep the
asset palette in `styles.js`, and annotations in the shared adapter. Blender or
SolidCraft imports must pass the same bounds, material-role, silhouette and
fallback/export checks as procedural assets; neither is a required dependency.
