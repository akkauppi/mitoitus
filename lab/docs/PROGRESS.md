# Implementation progress

## T01 complete — 12 November 2026

The isolated baseline candidate and explicit packaging boundary are implemented.
The candidate remains the original reference layout; T02 has not started.

### Build and export

From the worktree root:

```sh
python3 lab/scripts/build-book.py
# After the first build, explicitly replace an intact generated candidate:
python3 lab/scripts/build-book.py --replace
python3 lab/scripts/package-book.py
python3 -m unittest discover -s lab/tests -p 'test_candidate.py' -v
```

Candidate: ignored `lab/book/`; preview at http://localhost:8765/lab/book/ when
the existing local server is running. Offline export:
`lab/.build/rulebook-offline.zip`. Neither command overwrites root HTML, existing
public ZIPs or CAD. The old recursive packager must not be used here.

### Preservation and output guards

- Baseline SHA256, ordered sheet/panel identities, headings, proof links,
  drawing identities/descriptions and every variant label/index/order/count are
  checked against the plan inventory: 11 sheets, 33 panels and 44 drawings;
  walking/cycling/car/bus groups retain 4/5/3/3 choices.
- `parity.json` records all normalized semantic HTML events, including table cells,
  facts, qualifiers, source-visibility classes and inline markup, plus content
  metadata and per-artifact hashes. Only whitespace is normalized.
- Builds preflight inputs, stage in a temporary sibling, compare staged content,
  verify the output and then install it. A failed install restores the previous
  candidate. Temporary staging is removed after handled failures.
- `--replace` requires a verified generated directory. Edited/missing/unapproved
  files and symlinks fail closed. A one-time byte-verified migration supports the
  initial T01 candidate from commit `75c2d3b`.
- Build output is restricted to `lab/book`; exported ZIP to the fixed `.build`
  path. Alternate paths, traversal spellings and symlink ancestors are rejected.
- ZIP members come only from an explicit 53-file allowlist. The old offline ZIP,
  parity report, sources, lab pages, dependencies, logs and review outputs are
  excluded. A newly generated offline archive supplies the candidate's own link.
  Existing public CAD bundles are copied byte-for-byte; those intended CAD ZIPs
  remain included. Archive names, CRCs, contents and a 32 MiB uncompressed budget
  are checked. Output is deterministic for unchanged inputs.

### Verification

18 focused tests passed on 12 November 2026, using temporary repository copies:
content/identity/variant drift; source visibility and numeric changes; repeat
builds; explicit replacement; source/output symlinks; unknown or edited files;
missing sources; staged-content corruption; staging/install/export failures with
recovery; archive allowlist, bytes, size budget and exclusion of rogue files.

The actual candidate was rebuilt successfully with `--replace` and exported.
Archive: 53 files, 429,894 compressed bytes / 1,038,611 uncompressed bytes.
Course check passed: 6 weeks, 38 items, 46 source hashes; weekly exports match.
Baseline root files and the separate published checkout remain unchanged.

Limits: T01 establishes content/build/package behavior, not new visuals or a
browser/print/wall acceptance result. Directory installation uses verified staging
and rename/rollback; it is not a concurrent-build protocol or a promise of a
zero-gap view to simultaneous HTTP readers. Power-loss recovery is not tested.
No push or deployment. Next task: T02 static shell and state.

## T02 complete — 12 November 2026

The isolated candidate now has a static book shell: three-panel Overview, a
focused panel view with complete original details, eleven-sheet navigation,
panel selection, previous/next, Sources, CAD, Downloads, View and Print controls.
All existing SVGs remain; interactive scene integration starts with T03.

The shell progressively enhances the baseline classic-script behavior. Existing
`app.js` owns variants, Sources, CAD and wall controls; `runtime/book-app.js`
adds focus/navigation state. No modules, CDN or WebGL are required. The original
HTML's panel details are not copied into summaries or rebuilt as images.

State preserves existing hashes/aliases, `view=desktop|wall`, all four `layout-*`
parameters and unrelated query values. Overview/Focus and panel changes use
history; supplied invalid panel/figure/camera/style/mode values normalize safely.
Each current whole figure uses its baseline `panel--vN` identity, subordinate to
the legacy variant. Additional subfigures will be registered with later recipes.
Camera/style preferences are retained for T03; camera and drawing-style controls
are not exposed for these unchanged static SVGs. Closing Focus restores the
launching Explore button and scroll position. Drawing-key events do not trigger
sheet navigation; native variant selects retain their normal keyboard behavior.

Build commands are unchanged. The template adds only two local runtime references;
source panel content and drawing metadata are still audited before installation.
The explicit offline allowlist now has 55 files, including the shell JS/CSS.
An intact T01 candidate can migrate through `--replace`; packaging rejects an
old/missing-runtime candidate until rebuilt. Latest candidate ZIP: 434,853 bytes.

### T02 verification

```sh
python3 lab/scripts/build-book.py --replace
python3 -m unittest discover -s lab/tests -p 'test_candidate.py'
node lab/tests/shell-browser.cjs
python3 lab/scripts/package-book.py
```

The browser check accepts `PLAYWRIGHT_MODULE` and `BOOK_URL` overrides; its defaults
use this machine's existing Playwright and local server on port 8765.

Passed: 18 candidate/build/archive regression tests; 110 responsive Overview/Focus
states across all eleven sheets at 320/390/768/1024/1440 px; all 33 focused panels;
15 original variants with reload; exact DOM details parity against baseline;
hash aliases, invalid-state normalization, unrelated URL state, history,
keyboard/Escape, focus and actual scroll restoration, CAD units/download links,
Sources reset on reload, wall exit, no-JS access to all 33 panels, and direct-file
navigation/variants. No page JavaScript errors or runtime external requests.
Course checker passed again: 6 weeks, 38 items, 46 source hashes.

Selected desktop/phone focus references and the machine-readable shell results
are under `docs/references/`. This is headless Chromium QA; actual touch, assistive
technology, physical array operation and A3 printing remain separate checks.
Wall/print retain the existing static behavior; final profiles belong to T15.
No new dioramas were implemented. No push or deployment. Next: T03 reusable viewer
and rooting-volume integration.

## T03 complete — 12 November 2026

The `trees` panel now mounts its metric rooting-volume diorama in Focus over HTTP.
Overview, wall, direct-file use and printing retain the original canonical figure.
All original facts, tables, guidance and source context remain intact. Sources
also reveals the new artwork/asset assumptions; it remains off on reload.

### Shared implementation

- `src/viewer.js`: a container-scoped scene host with one reusable WebGL context,
  `show`, `resize`, `suspend`, `reset`, `setCamera`, `setAnnotations`, `inspect`
  and `dispose`. It owns/disposes controls, observer, queued frame, geometries,
  materials and context. Rendering happens on changes only. No global selectors.
- `src/annotations.js`: extracted metric projection/dimensions and the accepted
  outside-callout solver adapter. Visible anchor counts are recorded separately
  from returned leaders, so missing callouts cannot pass as an empty success.
- `src/registry.js`: the single `trees--v0` recipe and its measurement/provenance
  contract, reusing the existing shared metric scene and assets.
- `src/book-3d.js`: root-panel DOM, 3D/Plan/Front, Reset and annotation controls.
  The original figure remains in place until a successful render, reappears on
  context loss/unavailable WebGL and is always available for print. No Section
  control is advertised; actual cut support belongs to T10.
- The classic shell imports the viewer only for the active supported panel over
  HTTP. A generation token prevents a delayed import mounting after navigation.
  It suspends the host outside Focus and disposes on page teardown; a restored
  page can mount again. Sources/history/legacy variant state remains independent.

The soil block is exactly 5 × 5 × 1 m = 25 m³; decorative ground is excluded.
The soil leader anchor was corrected from a 0.01 m offset to the actual exposed
face, preventing the Plan view from clipping that callout. The person remains
1.75 m; tree/furniture/plinth details retain declared illustration assumptions.
The live viewport has an accessible text description of the measured volume.

Current framing fits this single recipe. T04 must introduce shared union framing
before comparable width alternatives are added; the current per-view fit must not
be copied into a per-variant auto-fit implementation.

### T03 checks and entry point

Preview: http://localhost:8765/lab/book/?mode=focus&panel=trees#green-blue

```sh
npm --prefix lab test
python3 -m unittest discover -s lab/tests -p 'test_candidate.py'
node lab/tests/viewer-browser.cjs
node lab/tests/shell-browser.cjs
python3 lab/scripts/build-book.py --replace
python3 lab/scripts/package-book.py
```

Passed: 38 Node geometry/proportion/routing/recipe tests; 18 candidate/build/archive
regressions; 15 live camera states across 320/390/768/1024/1440 px; both callout
anchors, route and text-collision checks; 16 orbit checks; all three styles;
annotation toggles, keyboard and URL preservation; idle rendering; 20 reopen cycles
with one context, one observed viewport and stable scene geometry count; released
scene geometry on suspension; actual WebGL context loss/restoration; no-WebGL
fallback; a delayed-import navigation race; explicit host disposal with no later
renders; and source-only artwork provenance. Full details remained byte-identical
in the DOM. The T02 suite still passes 110 responsive states, 33 panels, 15 variants,
URL/history/CAD/keyboard checks, no-JS reading and direct-file fallback.
Course checker passed: 6 weeks, 38 items, 46 source hashes. No runtime external
requests or page JavaScript errors in the live test.

The explicit candidate archive now has 70 files / 898,722 bytes, including pinned
Three.js runtime, MIT licence and manifest. Every vendored hash is checked on
build. Root baseline files, public CAD and the separate published checkout remain
unchanged. Candidate output/ZIP and raw QA outputs remain ignored.

Checkpoint A: desktop and phone canary renders were visually inspected; selected
references and machine-readable results are in `docs/references/`. Tests used
headless Chromium/software WebGL, not physical mobile/touch/GPU/array acceptance.
No production SVG-export repair or true section support is claimed. The remaining
32 panels continue using their static figures. No push/deployment. Next task: T04.

## T04 complete — 12 November 2026

Walking widths, Cycle facilities and Cycle parking now use the same movable live
viewer as Rooting volume. The original figures remain in place for Overview,
wall, print, unavailable WebGL and direct-file use. Variant dropdowns and previous/
next controls stay usable above the model. All canonical tables, guidance, source
qualifiers and legacy option indices remain unchanged. The live frame repeats the
selected source-case label directly from its original SVG, retaining the different
Espoo/SuRaKu/Helsinki contexts without duplicating their wording in scene code.

### Geometry and comparison contract

- `src/primitives/surfaces.js` supplies shared solid boxes, top-aligned strips and
  repeated envelope tiles. Their decorative thickness is not construction guidance.
- `src/recipes/routes.js` supplies all four walking widths (2.5/1.5/1.8/2.3 m),
  five cycling choices (1.75/2.5/3.5/3/4 m), and the five-cycle parking example.
  Route length is an explicitly assumed 6 m. The one-way cycling case retains
  its separate 0.75 m design-user envelope. Direction marks and rider orientations
  distinguish the two travel directions; shared-path actor counts are retained.
- One common world-space framing envelope covers all nine route scenes, their
  actors and dimension offsets. Its projection supplies the same orthographic
  frustum for every variant in the comparison. Selecting a different width or
  switching between Walking/Cycling preserves user orientation and zoom. Resize
  and camera presets recompute from that shared envelope, never a variant's bounds.
- The existing bicycle is reused in a new `createCyclist()` assembly: 1.65 m
  overall posture, 0.60 m bar envelope and 2 m length. The person is posed with a
  natural seated torso/limbs and a 0.23 m head, not uniformly scaled from standing.
  These remain illustration assumptions, not a dynamic clearance model.
- Cycle parking has five actual 0.6 × 2 m tiles and a separate 3 × 2 m handling
  area: 12 m² total / 5 = 2.4 m² per cycle. No rack specification is invented.

`src/registry.js` validates all supported recipe IDs. The adapter moves one frame/
canvas between supported panels, restores the previous panel's original figures,
and updates accessible description/provenance. It does not create a context per
panel. Source-case and original facts stay available alongside the scene.

### T04 verification

```sh
npm --prefix lab test
python3 -m unittest discover -s lab/tests -p 'test_candidate.py'
node lab/tests/routes-browser.cjs
node lab/tests/viewer-browser.cjs
node lab/tests/shell-browser.cjs
python3 lab/scripts/build-book.py --replace
python3 lab/scripts/package-book.py
```

Passed: 50 Node tests, including actual rider bounds/head proportions, every route
surface/dimension, common-frame containment, actor counts/directions, actual cycle
parking tile areas and invalid recipe rejection. The 18 build/archive tests pass.

The route browser suite covers 150 states at 320/390/768/1024/1440 px in 3D/Plan/
Front, all nine route choices and parking. It verifies exact projected-width
ratios and identical frusta across walking/cycling, stable geometry counts,
noncrossing leaders and visible-anchor counts, text collisions/clipping, original
source-case labels, preserved free camera/zoom after a variant change, canonical
facts, query/variant restoration, one context across panel changes and file://
fallback. Rooting-volume lifecycle/context-loss tests and the full T02 shell suite
still pass: 15 root camera states / 20 reopen cycles, and 110 responsive shell
states / 33 panels / 15 original variants. Course checker passed again.

The explicit candidate ZIP now contains 72 files / 902,588 bytes, with the two
new recipe/primitive modules. Existing source HTML/CAD and public checkout are
unchanged. No external runtime requests or page JavaScript errors were observed.
Selected desktop cycling and desktop/phone parking references plus machine-readable
comparison results are under `docs/references/` (Checkpoint B). Physical touch,
assistive technology, print and array acceptance remain separate checks.

Preview: http://localhost:8765/lab/book/?mode=focus&panel=walking#walk-cycle
Use its source-case dropdown and panel selector to compare the widths. No push
or deployment. Next task: T05 accessibility scenes.

## T05 complete — 12 November 2026

The Accessibility sheet now has live `turning`, `ramps` and `arrival` recipes,
using the existing single-context host. Canonical specifications, source dates,
practical guidance and fallbacks are retained without rewriting their details.

- Turning: paired 1.5 / 2.5 m diameter clear disks on separate neutral tiles,
  at one scale. Plan is the default, with 3D available. No furniture or guessed
  mobility-device silhouettes occupy the measured circles.
- Ramps: a solid 6 m horizontal run rises 0.30 m (5%), joining a full 2 m landing.
  The chosen 1.2 m width is the existing recommended case. The 1.75 m scale person
  stands on the landing. Front is the default elevation; Plan and 3D are available.
  Both axes retain metre scale. No Section or invented 8% variant is offered.
- Parking/seating: independent 3.6 × 5 m courtyard bay and bench-end vignette.
  The bench is outside the measured 0.9 × 1.5 m space. Its 1.5 m depth remains
  explicitly labelled “example”; no car/transfer-lift capability is implied.
  Plan is the default, with 3D available. Original slope/rest-spacing/seating
  guidance stays in the complete facts column.

`src/primitives/accessibility.js` supplies reusable clear-disk and exact solid
ramp-profile primitives. The new semantic `clearance` fill is defined for all three
shared palettes. Camera availability and Reset/Home follow each recipe instead
of forcing an unhelpful Front view or defaulting every scene to 3D.

The shared annotation layer now reserves semantic callout rectangles before
placing dimension text. A browser test caught “Landing” colliding with the rise
label at 320 px; the general layout change resolves it without moving metric
anchors. Existing routing still rejects intersecting callout leaders.

### T05 checks

```sh
npm --prefix lab test
python3 -m unittest discover -s lab/tests -p 'test_candidate.py'
node lab/tests/accessibility-browser.cjs
node lab/tests/routes-browser.cjs
node lab/tests/viewer-browser.cjs
node lab/tests/shell-browser.cjs
python3 lab/scripts/build-book.py --replace
python3 lab/scripts/package-book.py
```

Passed: 56 Node tests and 18 build/archive regressions. New geometry checks cover
actual circle diameters/radii, empty clear spaces, exact ramp profile vertices,
run/rise/landing joints and scale-person ground contact, separate arrival tiles,
bench exclusion, measurement anchors, finite geometry and all shared palette roles.

The accessibility browser suite passes 35 allowed camera states across
320/390/768/1024/1440 px. It verifies common-scale circle diameter ratios, projected
5% rise/run with equal axes in Front, complete noncrossing callouts, text collisions/
clipping, correct camera/reset/state behavior, one shared context, canonical details,
source-only assumptions, invalid Section normalization and WebGL/file fallbacks.
Desktop and phone examples were visually inspected and retained under
`docs/references/`. Headless Chromium checks do not establish physical touch,
assistive-technology, physical array or printing acceptance.

All earlier browser suites still pass: 150 route/parking states with fixed scale,
15 rooting-volume camera states and its lifecycle/context-loss checks, and 110
shell states / 33 panels / 15 original variants. Course checker passed: 6 weeks,
38 items, 46 source hashes. No page JavaScript errors or external runtime requests
were observed. No design-compliance certification or device manoeuvring test is
implied by geometric checks.

The allowlisted offline candidate is 74 files / 905,339 bytes. Root sources,
original CAD and the separately published checkout remain unchanged. No push or
deployment. Next task: T06 tram scenes.

Preview: http://localhost:8765/lab/book/?mode=focus&panel=turning#accessible

## User refinements after T05 — 12 November 2026

The user requested wheelchair figures, a car with a wheelchair beside it in the
accessibility bay, cut-ended ramp context, a wheelchair user on the ramp landing,
and dimension lines that leave the model visible under their labels.

- Added reusable `createWheelchairUser()`: an original stylized manual chair with
  spoked rear wheels/push rims, casters, seat/back and footplate. The seated person
  retains the accepted head/torso geometry and proportions, with separately posed
  arms/legs. Overall 0.72 × 1.20 m and 1.35 m seated height are illustration
  assumptions, not a device or clearance standard.
- Added it to the basic footway and wheelchair-passing route cases, without
  changing route widths or their common comparison frame. In Turning, the figure
  is on a separate context tile outside both measured disks.
- Added the existing 5 × 1.8 m car and a wheelchair user beside it inside the
  3.6 × 5 m courtyard bay. Their drawn bodies do not intersect. No new transfer,
  door-opening or manoeuvring allowance is implied. The bench-end clear rectangle
  stays empty and its assumed depth remains labelled.
- Replaced the ramp's standing figure with the wheelchair user on the upper
  landing, facing along the route. Added an illustrative 1.6 m lower landing and
  2.2 m next ramp segment (0.11 m rise), with jagged truncated end faces. Core
  source geometry stays 6 m / 0.30 m / 2 m. Continuation dimensions are recorded
  assumptions, not an added source requirement or the T10 section tool.
- Dimension labels now use transparent glyphs with no opaque rectangles or halos.
  The shared adapter measures actual glyph boxes and removes the intersecting
  intervals from dimension/extension lines. Small dimensions put text beside the
  short span rather than exaggerating its length. Measurement endpoints remain
  unchanged. Both the candidate book and the original lab use this adapter.

Checks: 58 Node tests, 18 build/archive tests; 35 accessibility, 150 route,
15 root-view/lifecycle states and the 81-state original lab suite pass. Six
additional dimension views assert no background patches, no text halos and no
line/text intersections. Geometry tests cover chair bounds/proportions, placement
outside circles, car/chair separation/containment, landing contact and cut-ended
continuation joins. Desktop/phone renders were visually inspected. Course check
passes. The allowlisted candidate archive is 74 files / 907,341 bytes.

Commands: `npm --prefix lab test`, the existing candidate/accessibility/routes/
viewer/browser checks, plus `node lab/tests/dimension-browser.cjs`. Source geometry,
CAD and publication boundaries remain unchanged. No push or deployment.

### Explicit outstanding publication blocker

The user says Residents & services requires “a lot of work before publishing.”
This is recorded in T13, the full plan and the `services` scene catalogue. It
requires substantial structural/source-context review before release; a cosmetic
restyle or passing visualization tests cannot resolve it. No services content
was rewritten in this refinement task. T06 remains the next implementation task.

## T06 complete — 12 November 2026

The three Tram & stops panels now use the shared host with original content and
static fallbacks retained:

- `tram-corridor`: independent 8 m Espoo and 6 m Helsinki-draft reservations at
  one scale, with the original 1.5 m illustrative extent. Plan/3D are offered.
  Curve-radius text (48/107/190 m, speeds, 0.65 m/s² and transition note), which
  lived inside the original SVG, is copied verbatim into a visible companion
  block. It is not lost when the static figure is hidden. ATU, track-centre and
  speed-clearance tables/qualifiers remain unchanged.
- `tram-width`: solid 3.5 + 5.5 + 3.5 = 12.5 m bands over a 5 m example extent,
  with a person and bench rather than a compressed tram. Platform height uses
  the 0.30 m general context; the separate Helsinki 0.27 m context is recorded.
  Front/3D/Plan are available. Solids meet their base and the bench leaves the
  normal 1.8 m passage width geometrically available; this is not a circulation
  or passenger-capacity certification.
- `tram-length`: 45 m flat platforms, two 6 m ramps each from an assumed 0.30 m
  rise at 5%, giving 57 m before crossing waiting areas. Two actual 34 × 2.4 m
  tram bodies are retained. Separate 30/61 m city-stop strips share the same world
  coordinates and scale; they are not substituted light-rail layouts. The model
  offers 3D/Plan, avoiding an unhelpful end elevation that would collapse all
  length comparisons. Detailed profile/cut tools remain outside this task.

`src/recipes/tram.js` reuses existing solid/platform, ramp and vehicle geometry.
No guessed rail gauge, curved vehicle path or ATU clearance envelope is added.
Sources-only assumptions distinguish body height/detail, decorative ground and
ramp rise from source body plans/service lengths. All original dimensions,
35 m agreement-only case, platform slopes, capacity guidance and Helsinki height
context remain in the source figures, canonical facts and provenance.

### T06 verification

```sh
npm --prefix lab test
python3 -m unittest discover -s lab/tests -p 'test_candidate.py'
node lab/tests/tram-browser.cjs
node lab/tests/accessibility-browser.cjs
node lab/tests/shell-browser.cjs
python3 lab/scripts/build-book.py --replace
python3 lab/scripts/package-book.py
```

Passed: 61 Node tests; 18 build/archive regressions; 35 new tram camera states
across 320/390/768/1024/1440 px. Geometry tests measure widths, actual solid/base
contact, ramp joins/run/rise, total stop length, both body plans and city strips.
Browser tests check callout routing and text collisions, projected 6:8
reservation and 61:30 city-length ratios, retained curve text, complete canonical
facts, Reset/state, one context, unavailable WebGL and direct-file fallbacks.
The 35 accessibility states and 110 shell states / 33 panels / 15 original
variants still pass. Course checker passed: 6 weeks, 38 items, 46 source hashes.
No page JavaScript errors or runtime external requests were observed.

Desktop/phone renders were visually inspected; selected references and test
results are in `docs/references/`. This is headless Chromium QA; physical array,
touch, assistive-technology and print acceptance are still separate. The explicit
candidate archive has 75 files / 909,938 bytes. Source HTML, CAD and published
checkout are unchanged. Residents & services remains a publication blocker.
No push/deployment. Next task: T07 vehicles/rescue.

Preview: http://localhost:8765/lab/book/?mode=focus&panel=tram-length#tram

### T06 review refinement — tracks, cuts and stop-length distinctions (2026-11-12)

User requested clearer light-rail/city-tram length cases and more scale objects in
corridor and stop-width scenes. Both short scenes now contain two tracks and two
nominal-width tram sections per reservation. Sections are clipped from the original
34 m procedural vehicle at source coordinates, never shortened by scaling; hatched
pastel cut faces distinguish them from vehicle fronts. Cut widths use the nominal
2.4 m envelope. Full-stop scene also gains rails. Rail heads are 50 mm illustrative
geometry with 1,000 mm clear inside gauge, supported by S35's retained vehicle page;
3 m track centres and wheel/detail geometry remain illustration assumptions, not
an ATU calculation. All meshes retain existing semantic palette roles.

Permanent assistant-draft companion text distinguishes 45 m flat service platform,
57 m example with two 6 m ramps (crossing waits additional), separate city service
length cases 30/61 m, and 34 m vehicle bodies. It remains visible with Sources off.
Canonical source drawings, tables and CAD are preserved.

Validation: 62 unit tests; 18 candidate tests; 35 responsive tram camera states,
including visible distinctions, noncrossing callouts, dimension proportions,
source preservation, one context, reset and fallback checks. Local work only.

### T07 complete — Vehicles & rescue (2026-11-12)

Implemented `car-turn`, `bus-turn` and `rescue` in the existing single-context
host. Both legacy 3-option groups keep their order, labels and URL values.
Plan-default quarter annuli retain 3/6.5, 8.1/15.2, 5/10.5 and 5.5/12.5 m
radius references. Reference vehicles remain detached from annuli, without a
swept-path or turning-animation claim. New reusable original procedural bus:
15 × 2.6 m existing design body, assumed 3.2 m height/detail, mirrors omitted.
No external mesh or new asset licence dependency. Car and bus 18 m lane segments
share one metric comparison frame across 3/6 and 3.25/6.5 m carriageways.

Rescue minimum 13 × 6 m footprint and dashed 13 × 8 m target share the radius
bands' metric scale in the live scene (the canonical fallback retains its original
enlarged set-up plan and caption). The live companion explicitly states its
scale. Route width/height 3.5/4.2 m, excluded 0.4 m driving / 1 m boom allowances,
operational caveats and HIKLU 2024 v1.3 context remain. W4 parking restriction is
visible; bus 16/32 m stop service lengths stay distinct from full-stop extents.

Evidence: 66 unit tests, including actual annulus vertices/radial endpoints,
body bounds/ground contact, all four lane widths/common frame and rescue bounds;
19 candidate safety/parity/packaging tests; 70 responsive vehicle variant/camera
states at 320/390/768/1024/1440 px, complete noncrossing callouts, unclipped and
nonoverlapping annotation text, projected common lane scales, canonical details,
legacy state, reset, one context, no external fetches and no-WebGL fallback.
Selected reviewed references: `references/vehicles-t07-{car-radius,bus,rescue-phone}.png`.
Candidate rebuilt and explicit offline package verified. No physical turning,
vehicle clearance, rescue operation, touch hardware or GPU-performance validation
is claimed. Overview/fallback stills and print/export integration remain T15.

### Approved spread-order amendment (2026-11-12)

User asked to review/rearrange the spreads and explicitly accepted: Buildings →
Residents & services → Walking & cycling → Accessibility → Connections → Tram &
stops → Vehicles & turning → Parking → Street sections & details → Green & blue
→ Stormwater options. Supersedes initial requirement to keep spread order;
existing canonical titles and within-spread panel/variant order are unchanged.
Candidate static DOM order (also without JavaScript), navigation, tabs, keyboard shortcuts and
spread counters follow this sequence. Stable hashes/evidence IDs and historical
source inventory remain unchanged. No source baseline or public checkout edits.

Order browser check passes all eleven spreads, numbers, next/previous, keyboard,
history, old aliases and direct-file fallback. Shell regression passes 110
responsive states, 33 focus panels and 15 variants, content parity keyed by stable
claim, URL/history/CAD, no-JS and file fallback. Tab scrolling now leaves an 8 px
margin to avoid fractional-pixel clipping. Residents & services remains blocked
from publication pending its T13 review. Local commits only; no push/deployment.

### Bus design refinement and glazing fix (2026-11-12)

User rejected the initial box-like bus and reported window Z flashing. Its glass
and opaque shell had coincident outer faces; both received identical depth offset.
Replaced this decal construction with three real vertical regions: lower body,
glazing band and chamfered roof. No opaque body remains behind the glazing band.
Pillars sit 10 mm proud of the glass, within the original nominal width. Backface
contact at the pillar mounting surface does not duplicate its visible front.

Refined silhouette with raked windscreen, bevelled roof ends, real wheel-arch
cutouts, paired rear axles, hubs, right-side entry doors, destination panel and
restrained end details. All details are original illustration assumptions, not a
manufacturer model. Body envelope remains 15 × 2.6 m, assumed height 3.2 m, feet
at Y=0; source values, lane scales, captions and renderer depth settings unchanged.

Validation: 67 unit tests (including explicit lower/glass/roof separation and
pillar offset checks), 70 responsive vehicle states; 18 additional orbit/style
states across Paper/Ink/Soft plus phone rendering. After the final rear-face
alignment, repeated the 67 unit tests and 18 orbit/style checks. Reviewed captures
show clean glazing and clearer silhouette; automated captures alone cannot prove
absence of flicker on every physical GPU. Candidate rebuilt and explicit offline
package verified. References: `references/bus-refined-{desktop,phone}.png`.
Local commit only; no push/deployment.

### Bus width annotation (2026-11-12)

Added an explicit “2.6 m body” dimension to all three bus variants: alongside
the detached turning-reference body and outside the vehicle end in lane scenes.
The carriageway dimension remains separate and first, preserving comparison-scale
checks. Mirrors remain omitted. Verified 67 unit tests and 70 responsive vehicle
states, now requiring the body-width label in each bus preset with no annotation
collisions/clipping. Candidate and explicit offline package rebuilt. Local only.
