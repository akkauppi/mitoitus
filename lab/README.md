# Mitoitus diorama lab

Local visual exploration, started 12 November 2026 from published baseline
`93bb622`. **No push or deployment until the user explicitly releases this hold.**
The existing sheets, content, evidence and downloads remain unchanged.

## Full-edition implementation handoff

The user accepted the revised visual direction and requested a full layout/scene
plan for another model to implement. Start with
[IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md), then
[TASKS.md](docs/TASKS.md). The [layout wireframes](docs/LAYOUT.svg) show Overview,
Focus, phone, wall and print. All 33 panels and 44 baseline drawings are mapped in
[the inventory](docs/scene-inventory.json) and the two scene catalogues.
The three-scene lab remains the visual reference. T01–T06 are implemented in
the isolated candidate; the remaining handoff tasks are still planned.
Do not run the old recursive ZIP packager in this worktree.

## Preview

From this worktree:

```sh
cd lab
npm run dev
```

Open **http://localhost:8765/lab/**. The server binds only to loopback. No build or
installation is needed for preview: pinned Three.js files are checked in. ES
modules require an HTTP server; double-clicking the HTML is not supported.

Choose a scene, then compare Paper model, Contour drawing and Pastel relief using
the same geometry. Drag to orbit, scroll to zoom, or use the 3D/Plan/Front
buttons. With the drawing focused, arrow keys orbit, +/− zoom and Home resets.
On touch devices use two fingers to manipulate the model; one finger scrolls the
page. Scene/style/view presets are bookmarkable. Free camera position is not.
SVG export captures geometry and enabled labels from the current view; shadows
are intentionally omitted. The dimensions also remain ordinary accessible text.

## Local Git arrangement

- Main public checkout: `/home/antti/mitoitus-public`, preserved at `93bb622`.
- Experimental worktree: `/home/antti/mitoitus-diorama`.
- Local branch: `experiment/diorama-style`; no upstream configured.
- Do not sync this directory into the public checkout or private course mirror.

A worktree is sufficient for the current design iteration: separate files and
commits, shared history, easy eventual review. A GitHub fork would be useful if
this becomes a separately maintained product; it adds no needed isolation now.
Nothing here authorizes publication. A local commit does not trigger Pages.

## Current scope

Three scenes: a composed walking/cycling street, the existing tram-stop width and
length example, and the existing soil-volume illustration. These are experiments,
not replacements for all eleven reference sheets. All new visuals and editorial
text are assistant drafts. The refined visual direction is accepted; the complete
book is planned and remains to be implemented and reviewed.

Six original procedural assets: person, tree, car, tram, bicycle and bench.
Detailed dimensions and illustration assumptions: [scene evidence](SCENE-EVIDENCE.md).
Style rules and delegation template: [STYLE.md](docs/STYLE.md).
Code / SolidCraft / Blender comparison and third-party asset options:
[PIPELINE.md](docs/PIPELINE.md).
Outside-label algorithm and extension rules: [CALLOUTS.md](docs/CALLOUTS.md).
Iteration record and verification limits: [REVIEW.md](docs/REVIEW.md).

## Candidate build (T01)

T01–T06 are complete. The candidate has Overview/Focus layouts and a live
rooting-volume, route, cycle-parking, accessibility and tram dioramas, with baseline SVG
fallbacks and canonical details. From the
worktree root, run `python3 lab/scripts/build-book.py` for the first build, or
`python3 lab/scripts/build-book.py --replace` to replace an intact generated
candidate. `python3 lab/scripts/package-book.py` exports the explicitly allowlisted
ZIP into `lab/.build/`. See [PROGRESS.md](docs/PROGRESS.md) for commands, verification
and limits. Preview the candidate at http://localhost:8765/lab/book/. T07 is next.

## Rooting-volume canary (T03)

[Open the integrated diorama](http://localhost:8765/lab/book/?mode=focus&panel=trees#green-blue).
One shared viewer supplies 3D/Plan/Front, outside callouts and metric dimensions.
The reference figure remains available without WebGL and in direct-file, overview,
wall and print use. Section support is planned for T10. See PROGRESS.md for the
host API, lifecycle tests and remaining limits.

## Width comparisons (T04)

[Open walking and cycling](http://localhost:8765/lab/book/?mode=focus&panel=walking#walk-cycle).
All nine route choices share one comparison frame. Switching variants preserves
scale, orientation and zoom; the cycle-parking panel explains the area allowance.
One viewer/context moves between supported panels. See PROGRESS.md for tests.

## Accessibility scenes (T05)

[Open Accessibility](http://localhost:8765/lab/book/?mode=focus&panel=turning#accessible).
Paired clear circles, the unexaggerated 5% ramp and separate bay/bench vignettes
retain measured clear areas and source context. Plan/Front defaults are chosen
per scene, with 3D available. See PROGRESS.md for geometry and browser evidence.

## Development

```sh
npm ci --ignore-scripts
npm test
```

`assets.js` owns repeated metric objects; `scenes.js` owns arrangement, dimensions
and provenance links; `styles.js` owns the semantic palettes; `callouts.js` owns the independently tested outside-label routing; `viewer.js` owns
camera, responsive rendering, projected SVG annotations and vector export.
`lab.css` owns presentation and readable screen-space type. Keep those boundaries
when delegating another scene. Do not copy a separate renderer into each sheet.

Three.js is pinned to 0.187.0. To deliberately refresh vendored files after a
reviewed dependency change, run `npm run vendor`. Keep the MIT licence and hash
manifest. The preview makes no external font, CDN, API or asset requests.

Browser checks use Playwright if already available. The check script accepts a
`PLAYWRIGHT_MODULE` path when installed outside this project; see REVIEW.md for
the actual verification environment. No browser automation dependency is needed
to use the lab.

The post-T05 refinements add a manual wheelchair user to relevant scenes, a car
with wheelchair beside it in the accessibility bay, and cut-ended ramp context.
Dimension labels now use line gaps without opaque patches. Residents & services
is explicitly blocked from publication pending substantial work in T13.

## Tram scenes (T06)

[Open Tram & stops](http://localhost:8765/lab/book/?mode=focus&panel=tram-length#tram).
Separate corridor-source comparisons, the compact width example and the full
stop/ramp/vehicle example retain the original contexts. City-stop lengths share
one metric scale with the long-stop model. See PROGRESS.md for checks.

## Vehicles & rescue (T07) and reading order

[Open Vehicles & turning](http://localhost:8765/lab/book/?mode=focus&panel=car-turn#turning-vehicles).
Exact geometric radius bands remain separate from reference vehicle bodies.
Car/bus lane examples share one framing envelope. The new original procedural
bus preserves the existing 15 × 2.6 m body plan; 3.2 m height/detail are assumptions.
Rescue turning bands and set-up rectangle share a metric scale in the live scene,
with no inferred appliance/boom geometry. All canonical tables and caveats remain.

The user-approved spread sequence now groups Connections with accessible routes,
Parking with vehicles, and Green & blue with stormwater. Full sequence and scope
are recorded in IMPLEMENTATION-PLAN.md §1. Historical inventory IDs, source
wording and old links remain intact; candidate numbering/navigation follow the
new order, including direct-file and print DOM order.

Focused checks: `node lab/tests/vehicles-browser.cjs` and
`node lab/tests/spread-order-browser.cjs` from the worktree root.

## Connections (T08)

[Open Connections](http://localhost:8765/lab/book/?mode=focus&panel=crossing-refuge#connections).
The crossing keeps 3 + 2.5 + 3 = 8.5 m with road-aligned 0.5 m stripes/gaps.
After user review, the route panel is a static **Check every link** diagram:
gate availability, a usable crossing, and the actual entrance determine whether a
connection works. Its questions are assistant editorial drafts grounded in the
retained source discussion; no new distance threshold is introduced. The earlier
500/300 m example is retained under Sources, not used as the main lesson.

**Keep the whole corridor clear** combines width and height in one positive
example: ≥1.5 m clear ribbon, ≥1.8 m passing widening, ≥2.2 m overhead clearance,
and the distinct ≥3 m recommended under-building context. Furniture stays outside
the ribbon. The previous ambiguous 1.4 m failing example and detail toggles are
removed; old detail links open the unified scene. The 6 m segment and fragment
shapes are illustrative, not a complete compliance demonstration.
Focused checks: `node lab/tests/connections-browser.cjs`.

Candidate branding is now **Antti’s Dubious Little Planning Rulebook**,
**Rules of thumb. Fingers crossed. · v2026-11-12**, as approved by the user.
The date is a fixed edition stamp, not the build clock or source-validity date.
Accessibility circle callouts now identify clear turning space; the wheelchair
callout terminates on the actual figure. Overview/fallback labels likewise identify
clear space, with the existing manual/powered distinction retained.
