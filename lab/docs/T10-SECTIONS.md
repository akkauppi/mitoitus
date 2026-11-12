# T10 implementation and review evidence

12 November 2026 · local implementation · assistant artwork/editorial assumptions.
This records the current implementation and supersedes the planned-only section
recipes for these panels. No publication or deployment is authorized.

## Geometry and visual convention

`src/primitives/sections.js` constructs analytical extruded XY polygons and
removes one side of a local Z plane. It separates the exposed cap from the
remaining body rather than relying on renderer clipping. Parent transforms allow
other orientations. Metadata records plane, retained range, original range and
volumes. `validateCapAnchor` converts world anchors into the solid's local space
and checks the plane and polygon, including concave boundaries.

Caps use diagonal hatching clipped to their polygons. Street building exteriors
use `sectionExterior`; exposed front caps and jagged outer cropped ends use
`cutBuilding`. Soil and paving use `cutSoil` and `cutPaving`. These are graphic
roles, not claims about construction materials. Outer hatch lines follow the
broken profile with a small separation to avoid coplanar flashing. No A section
letters remain, following user review. Dimensions retain line gaps around text.

## Panels and accepted review amendments

- **Street width / height:** all three independent diagrams use one metric scale,
  H=12 m and facade-to-facade W=12/24/36 m. Each row has its own local ground zero;
  row offsets are presentation layout, not terrain. User requested deeper blocks,
  trees, cars and people: retained depth is 8 m of an illustrative 16 m prism.
  Context is a 5 m tree, 5 × 1.8 m car and 1.75 m person in each row. Nominal 3 m
  building strips have zigzag cropped backs, not finished end facades. Height
  dimensions appear in all rows, opposite the responsive label pile. Section is
  a true orthographic metric section; 3D shows retained depth.
- **Equal floor area:** each plot is exactly 32 × 32 m. Footprints 32 × 16/8/4 m
  at 2/4/8 floors all produce 1,024 m². Plans share one scale and rearrange as a
  column on phones. Native floor-count cards use pixel spacing and explicitly
  have no vertical metre scale. No storey heights are invented. The plan is fixed;
  zoom/reset remain available and hints describe those controls.
- **Outdoor steps:** original main flight remains six identical 0.12 m rises and
  0.42 m treads. Per user review, a separate illustrative 1.2 m landing joins a
  cropped two-step next-flight fragment. This does not prescribe a landing after
  six steps: retained source guidance about 10–15 steps and handrail, guard and
  accessible-alternative coordination remains unchanged. Full width is 1.2 m;
  Section removes half, so it does not dimension that half as the full width.
  The original six-step metric side profile remains alongside the live model.
- **Trees reuse check:** Section genuinely removes half of the 5 × 5 × 1 m soil
  block and exposes its cap. The whole source block remains 25 m³; the visible
  retained half is 12.5 m³. The label and note distinguish these. Front restores
  the full block and is a separate camera mode.

## Verification and limits

89 Node tests cover cap areas/normals, closed signed volumes for both retained
sides and cropped outer material faces, finite geometry, parent-transformed cap
anchors, exact ratios/areas/stair increments, context contact, responsive layouts
and palette registration. `sections-browser.cjs` passes 30 analytical panel states
at five viewport widths, checks projected common scales, dimensions, label/leader
routing, floor cards, camera state, canonical source preservation, context count,
no-WebGL/file fallback and zero runtime external requests. The tree Section reuse
is exercised separately within that browser run. Candidate tests: 20 passed.

The shared viewer regression passed 20 camera/style states, 20 lifecycle cycles,
keyboard interaction, context restoration and resource disposal. The whole-shell
regression passed 110 responsive states across 33 panels and 15 variants. Screens
use Chromium software WebGL; physical touch/GPU devices and construction or
accessibility compliance are not verified. Finished print/wall/export review is
still T15. Reference captures and browser result JSON are in `references/`.

Original source content, evidence IDs, variant order and approved spread order
remain intact. “Check every link” remains explicitly unaccepted pending rework;
Residents & services still requires substantial work before publication (T13).

## Landing correction after review

The user identified an extra top tread before the landing. The rendered landing
now begins at the sixth riser (x=2.10 m) and ends at the next flight (x=3.30 m):
the complete flat is 1.20 m, including the original top tread. The source six-step
profile and its 0.12/0.42 increments remain intact in the retained reference.
The rendered lower flight ends at that riser, avoiding overlapping solids and an
artificial seam across the landing. Its plan run is therefore 2.10 m; this
supersedes the preceding description of a separate additional landing.

## Equal-density 3D follow-up

User subsequently requested 3D with scale features, superseding the fixed-plan-only
presentation above. Default is now 3D with assumed 3 m floor-to-floor massing
(6/12/24 m), plus a full-scale tree, car and person on each plot's open side.
Those heights are explicitly labelled illustration assumptions, not source values.
The metric Plan option remains, hiding the massing to expose exact footprints;
all 32 × 32 m plots and 1,024 m² floor-area totals are unchanged. Separate floor
cards remain explicitly unscaled. The common comparison envelope applies to both
views and all three plots; no height dimension presents the assumption as a rule.

Follow-up checks: 90 unit tests, 35 responsive analytical panel camera states and
20 candidate tests. Landing tests establish the complete flat as x=2.10–3.30 m;
3D tests verify assumed heights, context scale/placement and Plan visibility.
