# Drawing language and delegation contract

Version 0.1 · 12 November 2026 · assistant proposal, pending user review.
This records the first implementation; it is not a declaration of final style.

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
2. Use an orthographic camera. The 3D, plan and section presets use the same
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

The first recipes are deliberately hand-written while the visual language is
unsettled. If accepted and extended beyond a few scenes, extract declarative
surface/asset/dimension arrays and validate them against a small JSON schema.
Do not prematurely turn educational examples into a general CAD application.

## Ready-to-delegate task template

> Add scene [ID] using existing [evidence claim IDs]. Read AGENTS.md, README.md,
> STYLE.md and SCENE-EVIDENCE.md. Keep the current content and palettes. Change
> only scenes.js and the scene evidence note unless an explicit missing asset is
> part of the task. Use existing asset functions and metre coordinates. State
> every assumed height, depth and placement in provenance. Add meaningful
> geometry assertions for sourced dimensions; run npm test. Capture desktop
> and narrow-phone views in all three treatments, plus plan and section. Check
> labels, proportions, source links, page overflow and SVG export. Describe
> limitations and make a focused local commit. Do not push or deploy.

## Review criteria

Inspect recognisability at phone size, contrast of people against paving,
linework density, ground depth, value hierarchy and whether labels compete with
objects. Verify dimension lines measure what the captions say. Keep decorative
objects out of the measured clear space where that would imply a false design.
A screenshot pass is not physical-device, accessibility or design-compliance
certification. User style selection is the next decision, before bulk conversion.
