# Implementation tasks for the next model

Planning only · 12 November 2026. Read [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md)
first. Do not implement this whole list merely because you are reading it; start
when the user assigns implementation. This handoff does not permit push/deployment.

## Working rules

- Work in `/home/antti/mitoitus-diorama` on `experiment/diorama-style`; inspect
  status first. Preserve user work and the published baseline checkout.
- Take one task, and within a scene batch one panel, at a time. Make a small local
  commit after its focused checks pass. Keep `lab/docs/PROGRESS.md` updated with
  completed commit, checks, screenshots and remaining limits; create it on starting
  implementation. Do not mark a scene done merely because it renders.
- Use the exact content and claim IDs in the inventory. Every existing figure
  must map to a retained/replaced visual; preserve all diagrams inside a figure.
- Extend shared primitives/assets. Do not invent source dimensions, redesign
  typography per scene, replace source prose with summaries, upgrade dependencies,
  import the private course repository or add a new remote.
- Run focused geometry/behavior checks as appropriate; run the full suite at the
  integration checkpoints. Avoid repeatedly running every screenshot after an
  unrelated wording edit. Keep verification limits explicit.
- If an absent value is essential, keep a plan/2D representation or record a
  bounded illustration assumption already permitted by the recipe. Do not browse
  for a new standard and silently replace the adopted source edition.

## T01 — Inventory, content parity and safe build boundary

**Depends:** none. **Scope:** planning inventory, candidate builder, output guards,
packager allowlist design/tests; no visual overhaul.

Read `scene-inventory.json` and verify against baseline `index.html`: 11 ordered
sheets, 33 unique panel/claim IDs, 44 drawings, variant counts 4/5/3/3. Build a
semantic-content parity report before changing presentation. Implement a new
explicit `lab/book/` output path, with traversal/overwrite guards. Ignore generated
candidate outputs. Prepare an explicit package allowlist; prohibit invoking the
old recursive packager for this experiment.

**Done:** candidate build cannot overwrite root HTML/ZIP/CAD; all baseline text,
tables, qualifiers, proof links and variant order are captured; a deliberate
missing/changed panel or rogue package file fails checks. Commit before T02.

## T02 — Static book shell and state

**Depends:** T01. **Scope:** `lab/src/book-app.js`, `book.css`, candidate template.

Implement Overview/Focus layouts from `LAYOUT.svg`, initially using existing SVGs.
All three panels keep full canonical details. Implement eleven-sheet navigation,
Sources off on load, CAD/download menus, active-tab visibility, old hash aliases,
variant parameters and new `mode/panel/figure/camera/style` state. Preserve unrelated URL
parameters and Back/Forward; resolve camera-vs-sheet keyboard conflicts.

**Done:** 320/390/768/1024/1440 px views are readable with no page overflow; all
content is accessible without WebGL; all old links and selected variants restore;
Focus returns keyboard focus and scroll position. No scene-building dependency.

## T03 — Reusable viewer and rooting-volume canary

**Depends:** T02. **Scope:** shared viewer, annotations adapter, `trees` recipe.

Extract a container-scoped host from the lab while preserving its review page.
Own one WebGL context; explicit mount/show/suspend/dispose. Integrate the existing
rooting-volume geometry into the actual `trees` panel, with its complete original
content, source context and fallback figure. T03 offers 3D/Plan/Front; **T10 owns shared
cut-section support** and later adds the actual Section view. Do not advertise a
cut before that support exists; keep Front distinct. Preserve user-approved people/callouts.

**Done:** 5 × 5 × 1 = 25 m³; metre bounds, ground contact and provenance correct;
callout anchor count/crossings/text collisions pass; loss/restoration of WebGL
keeps the figure and facts usable. Repeated focus changes do not accumulate
observers/listeners/render loops or contexts. **Checkpoint A:** review a desktop
and phone canary before building the remaining recipes.

## T04 — Shared comparisons, walking and cycling

**Depends:** T03. **Panels:** `walking`, `cycling`, `bike-parking`.

Implement strip and area primitives, fixed union-frustum comparisons and the
existing four walking/five cycling options. Add one cyclist assembly with the
retained 1.65 m posture and 0.60 m bar envelope. Use real metric bicycles for the
parking/handling example. Preserve full tables and case-specific context.

**Done:** changing width does not change camera scale; projected ratios prove it.
All nine source choices, directions and old URL indices survive. Check the parking
row's 12 m² and 2.4 m²/cycle arithmetic. **Checkpoint B:** do not propagate a
per-variant auto-fit workaround to other scenes.

## T05 — Accessibility scenes

**Depends:** T03–T04. **Panels:** `turning`, `ramps`, `arrival`.

Build paired clear-space disks, the honest 5% ramp/profile and the two independent
bay/bench vignettes. Reuse clearance and ramp primitives. A device figure is
optional context; no new device geometry is needed to explain a clear circle.

**Done:** circles are diameters, not radii; 0.30/6 = 5%; landing/clear spaces are
measured and unobstructed. Bay and bench rectangles preserve sourced versus
assumed depths; no figure implies verified manoeuvring/transfer clearance.

## T06 — Tram scenes

**Depends:** T04–T05. **Panels:** `tram-corridor`, `tram-width`, `tram-length`.

Keep independent corridor cases as comparable plan strips. Make the compact
width model without compressing a full tram into its 5 m segment. Build the long
stop with actual 45 m service area, 6 m assumed ramps and the retained vehicle
bodies; retain separate 30/61 m city-stop comparisons and all existing notes.

**Done:** no blended clearance contexts; platform solids contact their base;
12.5 m, 57 m, body bounds and ramp slopes pass. Show 0.30/0.27 m contexts correctly,
never convert tram body or rails into an invented ATU envelope.

## T07 — Vehicles and rescue

**Depends:** T04. **Panels:** `car-turn`, `bus-turn`, `rescue`.

Keep radius references precise and plan-led; build one/two lane models at a common
scale. Add the 15 m design-bus body from existing content, not a generic bus icon
scaled to fit. Rescue setup and height can use neutral outlines instead of an
unsourced appliance model. No turning animation or swept-path claim.

**Done:** all 3+3 variants and old URL values retained; exact inner/outer radii;
car/bus widths and lane totals checked; setup area and driving/boom allowance
contexts preserved. W4 parking restriction stays visible.

## T08 — Connections

**Depends:** T04–T05. **Panels:** `crossing-refuge`, `walking-connections`,
`clear-route-continuity`.

Create the crossing with correct marking orientation. **User review amendment,
12 November 2026:** keep the route panel as a static native weakest-link teaching
schematic, replacing the interactive distance comparison. Show gate availability,
crossing continuity and the actual entrance; no new thresholds. Retain earlier
source values in Sources history. Integrate width and height into one positive
clear corridor, with furniture outside and distinct source height contexts.

**Done:** refuge sums to 8.5 m; stripe/gap 0.5 m; weakest-link schematic is static,
readable and clearly an assistant draft; clear ribbon ≥1.5 m, passing width ≥1.8 m,
height ≥2.2 m and under-building ≥3 m recommendation are correctly distinguished.
The former 1.4 m failing case and separate detail controls are superseded. Keep
source files intact, record the explicit editorial amendments, and verify native
fallback, annotations and responsive framing. Do not decorate a measured clear
route with obstructing scale assets.

## Pending review — Check every link

User instruction, 12 November 2026: **“Check every link” needs rework.** Panel
`walking-connections` remains an unaccepted teaching/visual draft. Revisit the
lesson, diagram and clarity before release; do not treat the current weakest-link
schematic as approved. Track this separately from T09; revisit when assigned. This is separate from
the existing Residents & services publication blocker.

## T09 — Building footprints

**Depends:** T04. **Panels:** `building-blocks`, `building-rows`,
`building-detached`.

Make plan-led footprint reliefs, repeatable modules and garden/plot surfaces.
Use a common graphic scale across the sheet. Keep relief thickness an explicitly
decorative display device; no invented building heights or floor counts.

**Done:** source ranges versus drawn representatives remain clear, footprint and
plot areas checked, shared framing preserved. All existing typologies are present,
not just the most picturesque one. No guessed roofs or setback requirements.

## T10 — Shared cut sections, equal floor area and steps

**Depends:** T05, T09. **Panels:** `section-ratio`, `equal-density`, `steps`.

First implement shared analytical cut-solid/capping support with section-plane
metadata and anchor validation. Add the true Section view to `trees`; it is a
reuse check for this primitive. Then build actual cut-section comparisons for W/H,
exact plot/footprint diagrams for equal FAR and the repeated stair solid. Floor-count stacks can be schematic; no
invented metre storey heights. Keep their display distinct from metric cut sections.

**Done:** H=12 m and W=12/24/36 m share scale; all 1,024 m² floor-area examples
remain equal; six 0.12/0.42 increments pass. Section caps/anchors align; handrails,
guards and accessible alternatives remain coordination text, not invented specs.

## T11 — Remaining green/blue scenes

**Depends:** T03–T04, T10 cut support. **Panels:** `ground`, `stormwater`; recheck `trees`.

Make four common-scale planting strips and the shallow rectangular storage-volume
example. Shrubs/grass are scale context; metre heights remain assumptions. Display
0.20 m water depth honestly, with no vertical exaggeration for visibility.

**Done:** four widths and full coordination table retained; 6×5×0.20 = 6 m³;
catchment, emptying and zoning context unchanged. Decorative ground layers are
never counted as soil/water storage or shown as prescribed construction sections.

## T12 — Conceptual stormwater cutaways

**Depends:** T10–T11. **Panels:** `rain-gardens`, `ponds`, `source-control`.

Implement schematic cutaways and process arrows without physical scale bars or
invented layer dimensions. Keep the separately metric slope triangle independent.
Reuse shared soil/water/vegetation pieces. Keep option matrices complete.

**Done:** no computed storage from illustrative geometry; permanent water is not
empty capacity; no automatic infiltration promise or hydraulic simulation.
Quantitative slope example and qualitative sections cannot be mistaken for one
metric model. No new tank/substrate dimensions.

## Publication blocker — Residents & services

User instruction recorded 12 November 2026: the Residents & services page needs
“a lot of work before publishing.” Treat panel `services` as requiring substantive
content/structure/source-context review in T13, not a cosmetic restyle. Review
its differing measures, denominators, editions and qualifiers; agree any content
amendments deliberately rather than inventing new service thresholds. This item
must be resolved before final release review, even if the rest of the visuals pass.

## T13 — Population, provision and services

**Depends:** T02, T09. **Panels:** `density`, `green-hierarchy`, `services`.

Restyle these primarily as crisp 2D information graphics with matching palette,
linework and text. Use the exact historical values and denominator definitions.
The library square is an area equivalent, not a building design.

**Done:** the services publication blocker above is resolved and documented;
chart proportionality, all original tables and qualifiers preserved;
no inferred resident counts from FAR or new service thresholds. No unnecessary
WebGL or 3D bars. Native SVG output remains available.

## T14 — Parking

**Depends:** T04, T07. **Panels:** `parking-layout`, `parking-area`, `parking-norms`.

Build the bay/aisle model and area allocation; keep municipal norms a 2D chart and
table. Use the exact existing 2025 examples rather than researching/replacing rules.
Preserve the W4 no-long-term-private-car-parking instruction.

**Done:** 8 bays, 17 m module, 12.5+8.75=21.25 m² and 425 m² example pass; half-aisle
accounting cannot appear as a 3.5 m manoeuvring aisle. Existing 44/77 counts,
rounding, mapped locations and separate conditions stay intact.

## T15 — Posters, export, wall, print and offline packaging

**Depends:** all scene tasks, T01 allowlist. **Scope:** output pipelines and profiles.

Complete reviewed stills for every displayed variant and layout profile. Repair
SVG edge/occlusion fidelity if feasible; otherwise keep export explicitly draft
and use reviewed raster dioramas plus vector text for print/fallbacks. Keep 2D SVG
and all existing CAD outputs. Implement wall seam-safe cards and deterministic
11-page A3 output, including printing while Focus is open.

Package only the candidate artifact allowlist. Keep direct-file static navigation,
figures and variants useful; HTTP enables module-based 3D. Include licences and
public evidence; no development data. Verify disconnected use and package paths.

**Done:** no blank printed canvases, split callouts or missing variants; no
node_modules/source archives/review output in ZIP. Seven CAD sets × three units
(21 DXF/SVG pairs) and three CAD bundles remain byte-identical to baseline.
Actual physical printing/array use is reported separately, not implied.

## T16 — Whole-book acceptance and handoff

**Depends:** T15. Do not expand scope while reviewing.

- Verify all 11/33/44 inventory entries and all diagrams inside each figure.
- Compare canonical text/table/source/visibility manifests; resolve every drift.
- Cover desktop/mobile/tablet, browser zoom, keyboard, touch-scroll behavior,
  WebGL failure/loss, state reload/back/forward and all four variant groups.
- Check common-scale comparisons, actual dimensions, callout anchor counts,
  leader intersections, text collisions and labels near cuts/occluders.
- Check lifecycle/context count and change-driven rendering; record measured
  performance rather than claiming a frame-rate target from a headless test.
- Verify 4800×1000 seams and 11 A3 pages from desktop/wall with Sources off/on.
- Verify clean standalone package, no runtime external fetches, useful file://
  fallback and HTTP 3D, CAD/evidence/link integrity and vendor hashes/licence.
- Capture each sheet overview, each focused panel, representative variants,
  narrow phone, wall and print; store a compact reviewed reference set.

**Done:** clean local commits, current progress/verification record, reproducible
preview/build/check commands and a concise list of unresolved limits. Request
final visual review, not deployment approval bundled into a vague completion
claim. **Do not push/deploy.** A later explicit release instruction is required.

## Copy-paste starting prompt

> Work in `/home/antti/mitoitus-diorama` on `experiment/diorama-style`. Read
> `AGENTS.md` and `lab/docs/IMPLEMENTATION-PLAN.md`, then implement T01 from
> `lab/docs/TASKS.md`. Preserve existing content and pending changes. Keep output
> isolated, run the task's meaningful checks, record evidence in PROGRESS.md and
> make a local commit. Do not push, deploy, synchronize the public checkout, or
> run the current recursive ZIP packager. Continue to the next bounded task only
> within the scope I assign; report concrete blockers instead of inventing content.
