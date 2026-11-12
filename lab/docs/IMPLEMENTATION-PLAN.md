# Mitoitus: full diorama edition

Implementation handoff · 12 November 2026 · based on local commit `4b5adc6`.
**This is a plan, not an implemented replacement or publication approval.**

## Start here

The user likes the revised preview and asked for the complete layout and scene
plan so another model can implement it. Treat its vector-like pastel style,
outside callouts and revised people as the accepted visual direction. The layout
and scene proposals below are the assistant's implementation specification;
they are not new teaching content or newly verified dimension standards.

Worktree: `/home/antti/mitoitus-diorama`, branch `experiment/diorama-style`.
Production baseline: `93bb622`; first lab: `fc50c54`; refined lab: `4b5adc6`.
Use this branch, with focused local commits. **No push, deployment, remote fork,
public-checkout synchronization or private-source copying.** The existing
`/home/antti/mitoitus-public` checkout remains at the published baseline.
A local worktree supplies the needed isolation; a separate fork is unnecessary
unless the project later acquires a separate maintenance/release identity.

Read in this order:

1. This plan and [layout wireframes](LAYOUT.svg).
2. [TASKS.md](TASKS.md): bounded implementation sequence and completion criteria.
3. [SCENE-CONTRACT.md](SCENE-CONTRACT.md): proposed data and renderer interfaces.
4. The relevant [sheets 01–06](SCENES-01-06.md) or [sheets 07–11](SCENES-07-11.md).
5. [STYLE.md](STYLE.md), [CALLOUTS.md](CALLOUTS.md) and [PIPELINE.md](PIPELINE.md).

The checked [inventory](scene-inventory.json) maps every current panel and drawing
variant to this plan. The existing `build-tools/` generators, `index.html`,
`evidence.html` and `evidence.json` retain content authority. The catalogue guides
visual composition; it does not replace the source register.

## 1. Product structure

Keep **11 sheets, 33 panels and all 44 existing drawing variants**. Panel and
variant order within each spread remains unchanged. On 12 November 2026 the user
approved this new spread reading order, superseding the original current-order
instruction: Buildings → Residents & services → Walking & cycling → Accessibility
→ Connections → Tram & stops → Vehicles & turning → Parking → Street sections &
details → Green & blue → Stormwater options. Existing source titles remain as
supplied (for example “Land & population”). The candidate builder reorders static DOM,
tabs, navigation arrays and spread numbers; hash identities are stable. Baseline
HTML and inventory keep their historical ordering for content-parity checks. Do not introduce a new landing page, hero area, calculator, course
task, numeric design editor or model-scale conversion table. Retain the title
“Antti’s Dubious Little Rulebook” and current Aalto branding.

The two reading modes share the same content and state:

- **Overview, the default:** three complete reference panels on one sheet.
  Each has a static diorama/vector figure, its existing dimensions, tables and
  practical text. An “Explore” button opens a spatial figure in Focus. Selected
  source/layout alternatives still work in Overview.
- **Focus:** one generous live illustration alongside that panel's complete
  facts and guidance. A three-item panel selector switches within the sheet.
  “Back to sheet” restores the overview, scroll position and activating button.
  A 2D-only panel opens a larger SVG, not an artificial orbitable chart.

The production interface has no lab-style promotional title or permanent palette
chooser. Paper model is the planned default, matching the main preview. Put
Contour/Pastel relief in a compact View menu if retained; the lab remains the
place to compare treatments. Exact palette selection was not separately voted
on by the user; defaulting to Paper is this plan's implementation choice.

## 2. Whole-page layout

### Shared shell

1. Compact masthead: existing title/logo, Sources toggle, CAD, Downloads menu,
   View menu (screen mode, drawing style, fullscreen), and Print.
2. Eleven-sheet navigation: numbered names, existing hash IDs, visible active
   item. Horizontal scrolling is allowed; automatically reveal the active item.
3. Sheet heading: current name, `NN / 11`, Overview/Focus state, previous/next.
4. Main content: overview cards or focused panel, described below.
5. Quiet footer: course attribution and offline download. Detailed editorial
   provenance remains under Sources; relevant source dates/draft qualifiers and
   practical restrictions must stay where the existing content requires them.

Sources is **off on every new page load**, including deep links. Opening Focus
must not reveal it. The toggle acts on both Overview and Focus. Keep actual
semantic text/tables; do not turn the whole panel into a screenshot.

### Desktop overview: width at least 1180 CSS px

Use a 3-column grid with equal column widths and 20–24 px gaps, a maximum content
width around 1680 px, and 24–40 px outside margins. Cards align title and figure
regions; the page may scroll to accommodate full text. Do not shrink long tables
to force equal total heights or a single screen.

Each card has, in order: existing source/context line; panel title; selected
variant control when present; figure; Explore; existing fact list/table and
practical prose; Sources link and optional metadata. Figures are approximately
300–360 px tall. Use one tidy outside label pile where the card is narrow, with
only the primary 1–2 callouts in the overview poster; the full set is available
in Focus and all values remain in ordinary text. Never shrink text to fit a
complex full scene. A card can keep its clearer plan/section figure by default.

### Intermediate overview: 730–1179 CSS px

Use two equal columns; the third card keeps the same width, not a different
scale or full-row panorama. For a comparison that only works side by side,
offer its dedicated comparison figure within Focus instead of compressing it.
Navigation scrolls, utility controls consolidate into labelled menus.

### Phone overview: below 730 CSS px

Use one full-width card per row. Keep all three panels and their text in normal
document flow. Native selects choose variants; buttons have at least 44 px touch
targets. Figures use small prepared posters with readable external callouts.
Explore opens the focused panel inline as the main page view, not a tiny modal.
No sticky element may consume most of the vertical viewport or trap scrolling.

### Focus layout

On wide screens, use roughly a **3:1 drawing/facts split**, with a 280–340 px
facts column and at least 640 px for the drawing where possible. At insufficient
width, put facts below the drawing. Keep the three panel choices above it.
The canvas area is about 500–640 px high on desktop and 360–460 px on phones;
use available height, not a fixed full-screen assumption.

Inside the drawing frame:

- Heading/variant chooser and a restrained view toolbar above the illustration.
- Orthographic scene with reserved outside-callout gutters. Current solver uses
  148 px each side when wide and 124 px right when narrow; measure actual text
  before extending this to longer labels or larger fonts.
- 3D, Plan and Front only when meaningful. Offer **Section** only for a real
  exposed cut face/cut geometry. A front elevation is never labelled Section.
- Reset, dimension toggle, callout toggle and export/download access below.
- Brief device-appropriate instruction: drag/scroll on desktop, two fingers on
  touch. Camera keyboard shortcuts apply only when the illustration is focused.

Facts are the original panel content, not the lab's shortened four-row summaries.
Sources and extra prose can scroll naturally below; never overlay them on the
model. Overview/focus switches do not reset selected variants.

## 3. Three-screen wall and print

**Wall:** preserve the established 4800 × 1000 reference layout and aspect-ratio
selection/explicit `view=wall` behavior. Each of the three panels occupies its own
1600 × 1000 region with a 48 px inset near seams. No labels, leaders, table cells
or active controls span a physical seam. Use prepared stills and semantic text,
not three live WebGL contexts or one 4800 px high-DPR animated canvas. Sources,
selected variants and page navigation remain usable. Actual array operation is
still a separate physical acceptance check.

**Print:** one A3 landscape page for each of the eleven sheets, three panels per
page, current selected variants, Sources state respected. Use reviewed static
figures rather than printing a live canvas. Printing from either Overview or
Focus, desktop or wall must produce the same eleven-sheet package. Repeat short
source context where needed; no callouts cut at page boundaries. Avoid heavy
background ink; keep pastel fill and outlines readable in a grayscale trial.

The current SVGRenderer loses some coplanar contour lines. Do not use its draft
output as the production print/export master. Fix and review its hidden-line
behavior, or use reviewed high-resolution PNG posters for dioramas while keeping
text, dimensions and labels as SVG/HTML. Never call a raster poster a true-vector
export. Preserve the existing CAD SVG/DXF downloads regardless of this decision.

## 4. The visualization system

### A consistent visual grammar

Use metre-based, orthographic, softly coloured miniatures with crisp major edges.
Ground has enough visible thickness to feel like a model. Where depth is an
actual teaching quantity, preserve it exactly; a decorative plinth never becomes
an implied construction layer. Keep the light-grey 1.75 m people and the revised
standing/walking/waiting silhouettes. Limit scenery to what explains scale or
spatial relationships. The original example's numbers and qualifiers take priority
over making a more picturesque scene.

The three current lab studies are style references, not three completed sheets:
`roots` maps closely to `trees`; the combined street mixes several source cases;
the tram study mixes width and length and does not cover corridor guidance.

### Reusable scene families

| Family | Use | Core reusable pieces |
| --- | --- | --- |
| Strip / corridor | walking, cycling, planting, traffic, tram width | contiguous metric surface strips, endpoint dimensions, sparse scale assets |
| Footprint / massing | building types, equal floor area, street enclosure | footprint polygons, restrained extrusion, floor markers where meaningful |
| Clearance / radius | turning, rescue, pinches, accessible bays | plan envelopes, radius bands, clearance frames, restrained context |
| Longitudinal sequence | tram stops, ramps, steps | exact profile, repeated modules, exposed front/cut face |
| Volume / cutaway | rooting soil, water storage, rain garden | solid cut blocks, layer faces, volume/level markers |
| Area allocation | parking bays and aisle share | repeated tiles, shared-area highlighting, exact area accounting |
| Information diagram | population, services, norms, route distance | 2D SVG chart/table/network, matching palette and typography |

Avoid making separate renderers for these families. Each recipe supplies geometry,
anchors, facts references and preset views to one shared viewer. Family-specific
builders may live in separate modules. No invented universal width, building
height, stormwater layer thickness or wheelchair/device footprint.

### Labels and comparison integrity

Keep callouts outside in ordered piles; two segments, horizontal text-side tails,
preferred parallel inner segments, terminal dot, no leader intersections.
Recompute after camera/viewport changes. Reframe or explicitly report unavailable
when no layout fits; do not silently draw crossings or drop visible anchors.
Allow no more than four primary callouts by default. Secondary facts belong in
the facts column or a deliberate detail mode, not a web of leaders.

Dimension lines are a separate system. Check their labels against callouts and
against each other; the callout solver alone cannot guarantee that. Metric anchors
never move to make a prettier label layout. Anchors on a real exposed cut face
must point to that face, not a deleted surface.

**Comparable alternatives share one camera scale.** Build a union frame over all
variants in that comparison, including labels/annotations. Preserve camera scale
and direction as a dropdown changes. A 1.5 m strip must look narrower than a
2.5 m strip; fitting each separately is prohibited. Multi-example comparisons
need a common pixels-per-metre scale within the group. Independent panels can
have different scales, with a scale bar where comparison might otherwise mislead.
For qualitative concept diagrams, do not show an invented metric scale bar.

## 5. Asset system and generation

Use procedural geometry for exact widths, levels, envelopes and repeated modules.
Keep the six current assets; add only assets needed by the assigned scene task.
Priority additions: seated person, a person with a mobility device (context only),
cyclist with 1.65 m existing posture envelope, 15 m design bus, restrained rescue
vehicle, footprint/building modules, kerbs/rails, clearance frames, steps/ramp,
soil/water cut blocks and shrubs. No crowd or vegetation simulation.

The [STYLE asset backlog](STYLE.md#production-asset-backlog) specifies boundaries.
Reuse symbolic building masses where building heights are absent. Express floor
counts without inventing metre heights. Don't add decoration that obstructs the
clear space being taught. Existing car/tram body bounds are measurements; mirrors,
heights and articulation details remain declared illustration assumptions.

Three.js remains the runtime. SolidCraft CLI is available for precise hard-surface
assets; Blender is optional for a silhouette that code cannot achieve elegantly.
Neither is a mandatory build dependency. Preserve editable sources, export scripts,
units/axis conversion and measured bounds. No new asset pack is required. Existing
pipeline notes contain licence verification rules; do not infer open licensing
from an attractive downloadable model.

## 6. Content, state and deployment boundaries

Do not hand-copy all teaching prose into scene files. Add stable panel/drawing IDs
to the existing generator as a mechanical metadata change, and derive a candidate
book from canonical output. Preserve original headings, tables, practical text,
source links, draft/date qualifiers and variant names verbatim. Keep all source
originals and baseline outputs intact. New visual assumptions belong in provenance.

Build the candidate edition under `lab/book/`, using a new explicit output path
that cannot overwrite root `index.html` or existing ZIPs. Keep scene implementation
under `lab/` until later deliberate promotion. The static build should be ready to
host from a subdirectory, with local relative paths and no CDN/runtime network.

Retain hash IDs and aliases, plus `view=desktop|wall` and all four existing
`layout-*` parameters. Use separate `mode=overview|focus`, `panel=<claim-id>` and
`camera=iso|plan|front|section`, and `figure=<stable-figure-id>` for a detail
within a panel; never reuse `view` for camera state. Preserve
unrelated parameters when changing one. Old `camera`-less links remain valid.
See the contract for state and compatibility tests.

**Packaging blocker:** current `build-tools/package_downloads.py` recursively
includes almost every non-hidden file. It would include `lab/node_modules`, review
outputs and other development material. Before any new package is built, replace
that with an explicit public-artifact allowlist and output directory. Do not run
the old packager “just to see” from this experimental worktree.

## Publication blocker added by the user

Residents & services (`services`) needs substantial work before publication.
T13 must address its explanatory structure and source context, not only graphics.
Preserve current source text until deliberate amendments are agreed. Final release
review cannot mark this panel ready solely on rendering or geometry tests.

## 7. Definition of complete

The implementation is ready for final user review when all 33 panels/44 drawings
have an assigned reviewed visual, original content and behavior are retained,
all variants compare at correct scale, fallback figures work without WebGL,
outside labels pass collision/anchor checks, the candidate offline package is
clean and usable, and desktop/mobile/wall/print checks pass with recorded limits.
Existing CAD geometry remains unchanged unless separately authorized.

Screenshots and tests are technical evidence, not new source validation, municipal
approval or physical-device acceptance. Record unresolved visual/export issues
honestly. Completing the implementation does **not** lift the publication hold.
The final handoff is a clean local commit, review entry points and a concise list
of remaining limits. Release remains a separate user decision.
