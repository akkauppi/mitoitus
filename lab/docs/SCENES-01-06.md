# Scene implementation plan — sheets 01–06

Planning only · 12 November 2026 · assistant draft for later implementation. The user likes the refined visual direction; no individual palette has been
selected. **Paper model is the working recommendation**, with the other two treatments retained. Follow [STYLE.md](STYLE.md) and [CALLOUTS.md](CALLOUTS.md).
Do not push or deploy. This document changes no teaching content or application.

## Contract for every panel

- Authority: current `build-tools/build_sheets.py`, generated `index.html`, and
  `evidence.json`. Claim IDs below are exact `evidence.html#…` anchors. Source IDs
  resolve through that register; source editions and publisher draft status persist.
- **Carry every existing heading, specification list, table, practical note,
  caption, source link and variant name/order unchanged.** The recipes below replace illustrations only. They are not replacement prose or abbreviated tables.
  Keep D16's existing distinction between visible practical content and Sources.
- Each sheet can have a three-panel still overview and **one focused live scene**.
  Do not create three WebGL contexts or replace a useful chart with decorative 3D.
  Generate stills from the same scene data; keep existing SVG until its replacement has passed review. A focused 2D panel needs no WebGL context.
- Metres, Y up, orthographic camera, no vertical exaggeration. Sourced ranges stay
  ranges; chosen representatives keep their existing “Drawn”/example distinctions.
  Ground depth and unsourced asset details remain documented illustration assumptions.
- Callouts below are a maximum-four default set, separate from dimension text.
  Attach dot endpoints to the stated metric features, with two-segment leaders to
  outside label stacks. Use a declared overview subset; in Focus reframe rather than silently omitting
  visible requested anchors or crossing lines.
  Dimensions retain their own endpoints; never label a range as a measured length.
- Common checks **C**: desktop and 320/390 px; all retained variants; metric bounds;
  equal comparison scales; no label overlap/crossing; sources and text parity;
  keyboard/fallback; still-versus-live agreement; SVG metadata and known line-occlusion limits. No geometry test establishes capacity, accessibility or compliance.
- New assets are explicitly noted below. They need one reusable implementation,
  provenance and measured bounds; use existing assets first. Arbitrary building heights and wheelchair/fire-appliance silhouettes are not supplied content.

## 01 — Building types · `built-form`

Use a plan-first family of footprint reliefs on thick neutral bases. Keep the
same pixels per metre across all three overview panels and all type comparisons;
frame them against the union of all three laid-out scene bounds plus common margins. A very
thin display plaque may lift a footprint from its base, but is not building height.
Do not invent floors, setbacks, roofs or dimensional building heights for realism.

### 01A — Slab & point blocks · `building-blocks`

- **Question / treatment:** how large is a repeated slab module beside a point
  block? Two plan reliefs, not a composed site or an assumed building section.
- **Geometry:** slab is two 26 × 11 m modules; source module range 22–30 m and
  depth 10–12 m. Square point block is 20 × 20 m; source says up to that size.
- **Camera / variants:** plan default; optional common low axonometric preview.
  Show both forms together; a focus selector may isolate either without autozoom.
- **Callouts / assets:** “Slab module” → first module centre; “Repeated module”
  → second centre; “Point block” → square centre. Reuse footprint tile and ground; optional peripheral 1.75 m person, never a building-height proxy.
- **Checks / preservation:** C plus 52 m overall slab length and shared scale.
  Preserve historical TKK 2007 context and distinction between module/whole length.

### 01B — Small blocks & rows · `building-rows`

- **Question / treatment:** how do repeating units and private gardens differ?
  Plan reliefs with module joints and a separate planted garden strip.
- **Geometry:** four 9 × 9 m small-block modules; four row units each 6 × 9.5 m,
  each with 6 × 10 m garden. Source ranges: 8–10 × 8–10 m; row width 4–8 m, building depth 8–11 m, garden depth approximately 5–15 m.
- **Camera / variants:** plan default; same shared building-sheet camera scale.
  Both typologies remain visible in overview; focused form switch retains framing.
- **Callouts / assets:** “Small-block module” → one tile; “Row dwelling” → one
  dwelling; “Garden” → its garden. Reuse tile, ground and planting surface.
- **Checks / preservation:** C plus 36 m small-block length, 24 m row length and
  garden alignment. No invented floor count; source widths remain repeating units.

### 01C — Detached house · `building-detached`

- **Question / treatment:** how much of an example plot does the footprint use?
  One plot relief with a distinct house footprint; plan is the measurable default.
- **Geometry:** existing 15 × 10 m footprint inside the existing illustrative
  25 × 30 m / 750 m² plot. Preserve the source plot range approximately 500–1,000 m².
- **Camera / variants:** shared sheet plan scale; optional axonometric relief.
  No new plot-size slider or automatic “legal” setback; preserve original placement.
- **Callouts / assets:** “House footprint” → footprint; “Example plot” → free plot
  surface. Reuse tile/ground; optional scale person outside the footprint.
- **Checks / preservation:** C plus 150 m² footprint and 750 m² plot arithmetic.
  Keep source “one storey” text without assigning a metre height; the drawn plot and placement remain assumptions, not building rights or setback guidance.

## 02 — Land & population · `land-population`

This sheet stays primarily 2D. Population, floor-area ratios and service measures have different denominators; invented neighbourhood models would imply absent data.

### 02A — Density · `density`

- **Question / treatment:** how do the historical resident-density examples differ?
  Retain a clean aligned 2D bar chart, with no 3D bar depth or perspective.
- **Geometry / values:** four bars approximately 30, 50, 75, 100 residents/ha for
  Detached, Linked low-rise, Row houses, Apartments ≤7 floors, in current order.
- **Camera / variants:** fixed chart axis; no live camera or new density calculator.
  Chart pixels encode residents/ha, not physical metres; label the axis explicitly.
- **Callouts / assets:** no leaders needed; direct category/value labels are clearer.
  No population-counting people or model buildings are necessary.
- **Checks / preservation:** C's applicable 2D checks plus proportional bars and
  complete existing `Form / eₐ / eₖ / eₜ` table. Preserve denominator definitions; do not derive residents from the floor-area-ratio table. Source: TKK 2007.

### 02B — Green-area hierarchy · `green-hierarchy`

- **Question / treatment:** what are the three historical distance levels?
  Retain the three aligned distance strips as 2D, with existing provision text.
- **Geometry / values:** maximum distances 50, 150, 500 m from home, one common
  axis. Do not build concentric service areas or straight-line catchment maps.
- **Camera / variants:** fixed 0–500 m comparison domain; no live camera needed.
  Do not auto-fit each strip to the same width or imply an actual route network.
- **Callouts / assets:** direct labels “Plot play / stay”, “Neighbourhood park”,
  “District recreation”; no decorative labels. Optional icons have no scale claim.
- **Checks / preservation:** common scale and all eight provision rows survive,
  including residential floor-area bases, minima, hectares and 3–10 km route length. Preserve TKK 2007 status, actual-walking-connection note and RAMS distinction.

### 02C — Residents & services · `services`

**Publication blocker (user, 12 November 2026): substantial revision required.**
The recipe below is only an initial visual idea. Rework the page structure and
review source contexts/qualifiers before release; a cosmetic pass is insufficient.

- **Question / treatment:** what does useful library floor area look like, and why
  are the other service examples different measures? 2D metric area tile plus text.
- **Geometry:** existing 10 × 10 m square represents approximately 100 m² useful
  area per 1,000 residents; it is not a library building or floor plan.
- **Camera / variants:** plan default, no orbit required; optional shallow display
  plaque only. School/daycare and health-station examples remain textual, not bars.
- **Callouts / assets:** “Useful area equivalent” → square centre; no occupants,
  doors, desks or invented programme. Reuse the area tile if relief is retained.
- **Checks / preservation:** 100 m² arithmetic; S23 (2010), S25 (2017) and S24
  (2020) stay separate. Keep small-municipality qualifier, existing-capacity condition,
  additional residents versus population responsibility, and all original figures.

## 03 — Walk & cycle · `walk-cycle`

These compact scenes benefit from 3D scale objects. Keep a front-elevation comparison preset as well as the diorama. Walking/cycling width choices use one
camera scale based on the maximum 4 m route width; never zoom narrow choices up.

### 03A — Walking widths · `walking`

- **Question / treatment:** how wide are the four different route/clear-space cases?
  A short pavement strip, people and uncluttered frontage, with a width dimension.
- **Geometry / variants:** existing `walking` order: basic 2.5 m, clear 1.5 m,
  wheelchair passing 1.8 m, maintenance 2.3 m. Add only an explicitly illustrative common longitudinal extent, e.g. 6 m; human height remains exactly 1.75 m.
- **Camera:** modest axonometric default, front and plan available; shared width
  framing with 03B. Keep width endpoints on the clear route or total strip as named.
- **Callouts / assets:** “Footway” or current clear-space type → measured surface;
  “Scale person” → person; reuse person/ground/paving. Keep furniture outside it.
- **Checks / preservation:** all four widths, fixed scale and complete crossfall/
  longitudinal-gradient table. Retain total-footway versus clear-width distinctions;
  people do not validate wheelchair capacity. Sources S01/S10/S09 retain editions.

### 03B — Cycle facilities · `cycling`

- **Question / treatment:** how do facility types and width cases compare? Short
  coloured strip with directional marks, rider references and a front-view option.
- **Geometry / variants:** retain `cycling` order 1.75, 2.5, 3.5, 3, 4 m and exact
  option names. Use the same illustrative length as 03A. One-way case retains the separate 0.75 m design-user envelope; rider height 1.65 m and bars 0.60 m.
- **Camera:** same width framing across all choices and 03A; no animated traffic.
  New rider asset must preserve existing seated posture height, not shrink a person.
- **Callouts / assets:** up to “Cycle facility” → strip, “User envelope” → dashed
  bound, “Walking” → shared-path person. Reuse bike; new measured rider assembly.
- **Checks / preservation:** all five variants and direction legend; full six-row
  list survives, including ranges, separated totals and parking buffer. Preserve
  source differences, additional walking/roadside space and envelope/clearance limits.

### 03C — Cycle parking · `bike-parking`

- **Question / treatment:** where does the rough one-row area allowance come from?
  Five bicycle-envelope tiles beside a separately coloured handling surface.
- **Geometry:** five 0.6 × 2 m envelopes make a 3 × 2 m row; adjacent handling
  area is 3 × 2 m; total 3 × 4 m = 12 m², or 2.4 m² per cycle. Bike height 1.2 m.
- **Camera / variants:** axonometric default, plan for measurement; one fixed scene.
  Optional “Envelopes / with bicycles” display toggle must leave geometry unchanged.
- **Callouts / assets:** “Cycle envelope” → first tile; “Handling space” → aisle;
  reuse bicycle/ground/surfaces. No invented rack spacing, wheel supports or locks.
- **Checks / preservation:** envelopes, total depth and area accounting; decorative
  bicycles stay within their declared bounds. Retain cargo/rack caveat and S11's 5 m pre-crossing parking exclusion as text, not a new unstated crossing layout.

## 04 — Accessibility · `accessible`

### 04A — Clear turning space · `turning`

- **Question / treatment:** how do two clear turning diameters differ? Plan-first
  paired disks on neutral tiles; shallow relief optional, but circles stay readable.
- **Geometry:** diameters 1.5 and 2.5 m, matching radii 0.75 and 1.25 m; same scale.
- **Camera / variants:** plan default; both disks visible together. If selecting
  one in focus, keep the common camera and original clear-space wording.
- **Callouts / assets:** “Wheelchair” → smaller clear disk; “Powered chair” → larger
  disk. Reuse circle/ground; no required vehicle avatar inside the measured space.
- **Checks / preservation:** diameters measured in world coordinates; no furniture
  inside circles and no simulated turn. Keep larger-device caveat and SuRaKu 2008 context. Never call the depicted circles device silhouettes or swept paths.

### 04B — Ramps · `ramps`

- **Question / treatment:** what does a 5% ramp actually look like? Low diorama
  with a true profile inset; the slope should remain visually modest.
- **Geometry:** 6 m horizontal run, 0.30 m rise, 2 m landing. Proposed width 1.2 m
  is the existing recommended-width case, explicitly chosen for this new 3D example.
- **Camera / variants:** side-profile default for measurement, axonometric optional;
  equal horizontal/vertical scales. Do not add an 8% generated variant by default.
- **Callouts / assets:** “Ramp” → slope; “Landing” → level top; “Rise” → vertical
  endpoint. Reuse the manual wheelchair user on the landing (user amendment after T05)
  and the shared solid ramp prism; adjoining cut-ended context is illustrative.
- **Checks / preservation:** 0.30/6 = 5%, actual landing length and no exaggerated
  vertical scale. All five specification rows persist; the >5% landing rule does not become a claim that this 5% example requires that interval. Source S10.

### 04C — Parking & seating · `arrival`

- **Question / treatment:** which spaces must remain usable beside a vehicle or
  bench? Two independent plan-first vignettes, not an invented combined site.
- **Geometry:** courtyard bay 3.6 × 5 m; bench-end clear rectangle 0.9 × 1.5 m,
  with 1.5 m depth still explicitly illustrative. Bench size remains asset assumption.
- **Camera / variants:** shared metric scale for both vignettes; “Bay / bench” focus
  is display selection, not a source variant. Optional modest axonometric view.
- **Callouts / assets:** “Courtyard bay” → bay; “Bench-end space” → clear rectangle;
  reuse bench. Show a car only if it does not imply validated lift/transfer space.
- **Checks / preservation:** clear rectangles unobstructed; all five specification
  rows, ≤2% slope, 50/≤250 m park rest spacing, seating qualities and transfer/access
  note remain. Keep courtyard S10 versus separate kerbside S18 contexts distinct.

## 05 — Tram & stops · `tram`

### 05A — Tram corridor · `tram-corridor`

- **Question / treatment:** how do separate source reservations and clearance
  definitions differ? Hybrid: two plan width strips plus the existing reference text.
- **Geometry:** compare 8 m Espoo and 6 m Helsinki-draft reservations at one scale;
  preserve existing illustrative strip length 1.5 m. These are alternative contexts.
- **Camera / variants:** plan default, same width scale; no “6 versus 8 m compliant
  design” toggle. Curve radii remain 2D reference values, not a curved tram scene.
- **Callouts / assets:** “Espoo reservation” → first strip; “Helsinki draft” → second.
  No tram model needed; do not infer an ATU shape from vehicle width or rails.
- **Checks / preservation:** retain track-centre rows 3/3.1 m, complete speed-linked
  ATU clearance table and 48/107/190 m uncanted radii at 0.65 m/s². Source contexts
  S01/S06/S27/S28/S30 and curve/transition/clearance warnings all persist.

### 05B — Stop width · `tram-width`

- **Question / treatment:** how do platforms and the track zone build the width?
  Compact three-band diorama, focusing on the existing section rather than length.
- **Geometry:** 3.5 + 5.5 + 3.5 = 12.5 m; preserve 5 m illustrative segment length.
  If raised platforms are added, record the chosen 0.30 m general-context height
  from `tram-length`; this does not replace the Helsinki 0.27 m case.
- **Camera / variants:** front default, axonometric and plan optional; no compressed
  34 m tram inside a 5 m segment. Use a person/bench for scale instead.
- **Callouts / assets:** “Platform” → each side; “Track zone” → centre, at most three;
  reuse solid platform/ground/person/bench, with clear passages kept visibly open.
- **Checks / preservation:** sum and individual widths, solid platform thickness;
  normal/minimum passage, island width and passenger-space text survive. 12.5 m
  excludes outer routes/buffers; furniture placement is not a circulation analysis.

### 05C — Stop length & levels · `tram-length`

- **Question / treatment:** how much longer is the whole example than the flat
  boarding area? Full-stop diorama plus separate 2D city-stop comparison strips.
- **Geometry:** 45 m flat area, two 6 m ramps from assumed 0.30 m rise at 5%,
  total 57 m before crossing waiting areas; retain two 34 × 2.4 m tram bodies.
- **Camera / variants:** shallow longitudinal axonometric default; plan/profile
  presets. City-tram 30 and 61 m strips share a fixed length scale with the example;
  do not automatically substitute them into the different light-rail geometry.
- **Callouts / assets:** “Flat service area” → platform centre; “Access ramp” → one
  ramp; “Tram body” → tram; reuse articulated tram/platform/ramp/person assets.
- **Checks / preservation:** lengths/ramp slope/body bounds and no ramp compression;
  retain 35 m agreement-only case, slope/crossfall list and 0.30/0.27 m distinction.
  Model bodies are not ATU envelopes; approaches and crossing waits remain additional.

## 06 — Vehicles & turning · `turning-vehicles`

### 06A — Car access & turning · `car-turn`

- **Question / treatment:** what is the radius reference, and how do lane widths
  compare? Hybrid: retain exact 2D quarter-annulus; lane variants may use dioramas.
- **Geometry / variants:** original `car-layout` order: radii 3/6.5 m, one 3 m lane,
  two 3 m lanes / 6 m total. Lane scenes retain 18 m illustrative length and a
  separate 5 × 1.8 m body; car height 1.5 m remains an asset assumption.
- **Camera:** plan default for turning; modest axonometric for lanes, with fixed
  camera scale across one/two lanes. No car posed or animated around the radius band.
- **Callouts / assets:** “Radius reference” → band; “Car body” → detached car; lane
  view needs “Carriageway” → surface only. Reuse car/ground and exact 2D arc helper.
- **Checks / preservation:** exact radii, body size and lane totals; retain Espoo
  range, servicing text and visible W4 no-long-term-private-car-parking restriction.
  Historical band is not a simulated swept path; vehicle detail cannot imply one.

### 06B — Bus access & stops · `bus-turn`

- **Question / treatment:** how much space do the reference bus and lane cases use?
  Same hybrid pattern as 06A, plus existing stop-length table kept as a table.
- **Geometry / variants:** retain `bus-layout` order: radii 8.1/15.2 m; one 3.25 m
  lane; two / 6.5 m. Lane length 18 m; separate body exactly 15 × 2.6 m.
- **Camera:** plan for annulus, fixed framing across lane choices; if comparing bus
  and car directly, use a shared camera rather than scaling their thumbnails to fit.
- **Callouts / assets:** “Radius reference” → band; “Design bus body” → detached
  body; “Carriageway” → lane. New reusable bus needs an explicitly assumed height.
- **Checks / preservation:** body bounds, radii and width arithmetic; stop service
  lengths 16/32 m remain separate from full-stop length. Preserve local-collector
  range, ≥3.25 m bus case, approach/crossing note and historical-band limitation.

### 06C — Rescue access · `rescue`

- **Question / treatment:** how do turning bands and set-up space differ? Keep
  two plan annuli together; use a separate measurable set-up footprint, relief optional.
- **Geometry:** engine radii 5/10.5 m; aerial 5.5/12.5 m; set-up 13 × 6 m with
  dashed 13 × 8 m target. The set-up drawing may remain explicitly enlarged.
- **Camera / variants:** plan default; both bands at one scale. Focus selection
  “Turning / set-up” does not invent source alternatives or redefine a minimum.
- **Callouts / assets:** “Fire engine” → first band; “Aerial appliance” → second;
  “Set-up area” → solid rectangle; “Target width” → dashed edge, maximum four.
  Reuse surfaces/arc helper; no guessed fire-engine body or deployed boom required.
- **Checks / preservation:** exact annuli, rectangle/target bounds and explicit
  scale distinction; keep route width 3.5 m, height 4.2 m, excluded 0.4/1 m
  allowances and all operational caveats. HIKLU 2024 v1.3 remains the source context.
