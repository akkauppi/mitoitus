# Rulebook release — 2026-11-13

Local candidate: **v2026-11-25.4** (residential block capacity).
Published edition: **v2026-11-25.3** (contextual assertion robustness).
The initial v2026-11-13 acceptance record follows below. Publication target:
https://akkauppi.github.io/mitoitus/.

The user’s 13 November goal authorizes finishing, testing, pushing and releasing.
It supersedes the earlier local-only hold and task-by-task implementation limit.
The original content/inventory remains archived build input. The generated edition
has 11 spreads, 30 panels, 37 live scene recipes, 45 illustrated variants/category
states and three native charts. Ninety static poster files cover two layout profiles.

## Accepted release scope

- Removed `walking-connections` (“Check every link”) and the standalone
  `stormwater` shallow-storage example. Their old links open the relevant retained
  clearances/planting panel. Original evidence remains in the source register.
- Parking accounting stays integrated into `parking-layout`; `parking-area` links
  open Area share. No content is silently treated as newly sourced guidance.
- Corrected turning vehicles to face the arc-entry tangent; added direction cues
  and fixed both car windscreens without changing body dimensions.
- Technical headings replace conversational teaching slogans. Walking tables and
  scene labels distinguish total footway width from unobstructed passage,
  wheelchair passing and machine-maintenance clear widths.
- Residents/services uses practical tables instead of resident pictograms or a
  library-area square. Twelve service references retain named locality, edition,
  denominator and essential qualification. See [SERVICES-RELEASE.md](SERVICES-RELEASE.md).
- Square corners throughout the interface. Compact posters crop empty vertical
  space while preserving comparison scale and all dimensions/labels.
- Every published fallback, overview, print and offline illustration uses the
  current scenes or current native data artwork. No retired illustration is shipped.
- Shared category state keeps Overview, Focus, Reset, history, print and fallback
  on the same option. A single bank-slope helper remains in the pond view.

## Verification

- 108 Node tests: metric geometry, asset bounds, cuts, dimensions, callout routing,
  vehicle tangency and windscreen visibility.
- 34 Python tests, including the standalone-archive amendment: source inventory,
  poster fingerprints/crops, editorial data, deterministic package and path guards.
- Whole-book browser pass: 55 Overview + 150 Focus states at 320,390,768,1024,1440px;
  all 30 panels; no overflow, clipped/overlapping annotation text, callout crossings,
  page errors, missing assets or external runtime requests.
- Wall: all 11 spreads fit fixed 1600px cards on the 4800×1000 canvas. Additional
  Sources-on/off probe passes every spread. Two-panel spreads occupy two positions.
- Print: desktop and wall, while Focus is open, Sources off/on: four PDFs, each
  exactly 11 A3 landscape pages with no overflowing cards. Source mode prints
  concise source links; full provenance remains in the evidence index.
- Shared viewer: 20 responsive camera states, 20 suspend/resume cycles, one WebGL
  context and one resize target, no continuous idle render loop; context loss,
  recovery, unavailable WebGL and delayed-module fallback checks pass.
- Five category panels pass selection, Reset, URL/history/reload, print and fallback
  agreement; direct-file and no-JS retain useful current diagrams and tables.
- Touch emulation: one finger scrolls without changing the camera; two fingers
  zoom and orbit. A 200% reflow equivalent (720 CSS px at DPR 2) passes all eleven
  overviews and four focused panels. Hardware touch and actual browser zoom-menu
  behavior remain outside the test scope.
- Extracted ZIP: both file:// and isolated HTTP pass all category/variant reload
  checks, evidence navigation, byte-verified CAD downloads and HTTP 3D. All 858
  internal link checks pass; no external requests, missing files, page errors or
  self-download links. See [OFFLINE-RELEASE-QA.md](OFFLINE-RELEASE-QA.md).
- Public artifact: 240 local links checked, 45 CAD files unchanged (21 DXF/SVG pairs
  and 3 bundles), pinned vendor hashes/licence retained, explicit archive allowlist.
- All 42 baseline external source URLs were reachable; five service-source records
  were retrieved and reviewed. The S10 HTTPS destination is byte-identical to its
  retained source PDF. See [SOURCE-LINK-AUDIT.md](SOURCE-LINK-AUDIT.md).

Automated browser evidence uses Chromium software WebGL. All 11 overview screenshots,
representative phone/desktop Focus views and A3 output were visually inspected.
Physical paper printing, a physical display array, hardware-specific GPUs and
assistive-technology testing were not performed. These limits do not imply design
or regulatory certification. No new source standards are inferred from the models.

Full captures/PDFs are reproducible under ignored `lab/review/release/`; selected
reference evidence belongs under `lab/docs/references/`. Do not publish review files.

## Build and publication

Use the commands in [the current lab guide](../README.md). `prepare-release.py`
checks the candidate and stages only the public allowlist into `lab/.build/release`.
`verify-release.py` checks local links, archived bytes, CAD and vendor hashes. The
standalone ZIP omits links to download itself; all other assets remain identical.
The repository-root HTML is historical source input and is never a Pages artifact.

The Pages workflow installs the locked test dependency, runs Node/Python checks,
builds/stages/verifies the artifact and deploys it. Actions are pinned to commit SHAs.
No private course files, original source captures, development modules, review
screenshots or source archives enter the public artifact.

A clean `git archive` checkout passed the same 108 Node and 34 Python tests,
reinstalled the single locked dependency, built the release and verified every
link/archive boundary. All 183 public assets matched the reviewed output byte
for byte. The offline ZIP is 4,437,085 bytes; SHA-256:
`eec6def844047637e7e511eb470d37ccb3309978c3a29177b61228605ef9fab9`.

Publication evidence is recorded in the versioned GitHub release and its associated
Pages workflow run. This local record covers the prepublication checks; staging
or pushing alone is not deployment verification.


## Live-view update — v2026-11-13.1

The user selected live 3D Focus as the opening view. Unqualified page links now
open the first panel in Focus, with the 3D camera for every spatial scene. Explicit
Overview, Plan, Front and Section links retain their requested views. Reset and
viewport Home follow the same 3D default; Home keeps the selected scene category.
Native tables and charts remain native. Wall, print, unavailable-WebGL and direct-
file paths retain the reviewed static artwork. The renderer still uses one context.

The same review requested smaller dimension labels that can shrink with a minimal
drawing. Numeric dimensions now use weight 500 and scale from 6.5 px at 320 px
to 10.5 px at 900 px (5.5–11 px limits), separately from named outside callouts.
All 90 static posters were recaptured; 78 changed and 12 conceptual posters without
dimensions stayed identical. Placement and line gaps use measured glyph bounds;
no opaque label patches or changes to metric geometry are introduced. Runtime and
poster URLs carry the fixed edition so returning visitors receive the new assets.

Update verification:

- 108 geometry/unit tests and 36 build/preservation tests passed.
- 264 responsive typography states passed completeness, containment and collision
  checks; sampled metric endpoints and outside callouts match the prior edition.
- Default-view checks passed for 52 spatial and eight native states, explicit
  cameras/modes, Reset/Home, history, print, file and unavailable-WebGL fallbacks.
- Whole-book acceptance passed 55 Overview and 150 Focus states at five widths,
  eleven wall spreads and four eleven-page A3 PDFs, with no browser errors.
- Viewer lifecycle checks passed 20 camera states and 20 suspend/resume cycles,
  one context, idle rendering, context restoration and delayed-import handling.
- A warm-cache test verified all 26 mapped modules and 95 runtime/poster references;
  a new edition refreshes changed assets while pinned vendor modules remain cached.
- Touch and reflow checks passed three gestures and 15 states. Public artifact
  verification passed 240 local links, offline links, vendor hashes and 45 CAD files.
- The extracted ZIP passed both direct-file and isolated HTTP browser checks:
  category/variant persistence, current fallbacks, live 3D, evidence, CAD download
  byte verification and 858 local links; no external/missing requests or page errors.

The offline ZIP is 4,329,808 bytes; SHA-256:
`1b9f8761878d5560d6a97276644ff353b7668137c597939517b4a0ddf564b724`.

Focused verification evidence and the published commit are recorded with the
versioned update release. The initial acceptance hashes above belong to v2026-11-13.

## Title update — v2026-11-13.2

User amendment, 13 November 2026: use “Dubious Little Planning Rulebook” throughout
the current edition. The visible title, browser-tab titles, evidence page and CAD
download documentation use the same name, including nested offline downloads.
The subtitle remains “Rules of thumb. Fingers crossed.”

The build applies this branding to archived inputs without changing the baseline.
CAD bundles are repackaged with only their README/evidence titles changed; all
DXF/SVG and other member contents remain identical. The release verifier checks
every public file and nested ZIP member for the removed personal-name prefix.
The archived implementation progress record retains its dated historical wording.

Validation: 37 build/preservation tests passed. Release checks cover 240 public
links, every nested archive title and the unchanged 42 individual CAD files.
Offline ZIP: 4,329,776 bytes; SHA-256:
`f29034a20869c10d26679160d827f404371a2ce29addc309a8c420b24c180b56`.

## Agent-readable reference — v2026-11-25

The Pages artifact and offline ZIP include `data/rulebook.json`,
`data/rulebook.csv`, `llms.txt` and one JSON file per spread. The build reads the released HTML, scene
registry, poster inventory, evidence and service supplement. It regenerates
these files each time.

The JSON identifies the schema and rulebook edition separately. Panel IDs and
links identify the context of each value. Facts and table cells preserve authored
operators, ranges, formulas, units and footnotes as strings. Table cells retain
header and span information. Simple metric values and ranges also carry numeric
values, units and comparison operators. Service rows include numeric fields where supplied
by the supplement. Drawing annotations and model measurements use the recipe's
coordinate system and carry its assumptions. The CSV provides a flat lookup with
ordered cells represented as JSON arrays. Use the JSON for full provenance and
drawing variant links.

## Morphology laboratory — v2026-11-25.1

The release includes the static data catalogue, parametric synthetic laboratory and
validated exchange fixtures described in [the morphology decision record](MORPHOLOGY-ARCHITECTURE.md).

## Built form and density — v2026-11-25.2

The existing five panels link to 15 contextual assertion revisions under
Sources. The catalogue exposes the same records in JSON. Historical excerpts
keep the TKK 2007 locator and scope. Calculated examples carry synthetic status
and use the same formulas as the equal-FAR scene and morphology laboratory.
Before and after rendering of the equal-FAR scene produced identical raster
and annotation hashes at both poster sizes. The accepted SVGs are retained.

The selected illustrative floor areas assume repeated identical footprint
plates. The modelled storey height belongs to the scene. The historical
detached-housing figure of about 30 residents/ha has an unresolved land
boundary. The nested analytical example therefore fixes only floor area and
reports three separate land denominators. A depth transect describes the
selected cut. The examples retain the named axis and easting.

The pilot reuses the scoped assertion and review pattern from the separate
research prototype. The unpublished bulk export draft was left in its
original worktree. The current JSON and CSV remain public interfaces with
additive assertion links. The transect example uses simple single-intersection
geometry and stays outside the empirical exchange method registry.

### Consumer examples

Each lookup starts at the visible Open data / AI agents link. Use the
contextual assertion revision for citation and the measurement dictionary
for method and unit.

| Question | Expected result |
| --- | --- |
| What does TKK say about slab size? | One historical slab module is 22–30 m long and 10–12 m deep. The drawn 26 × 11 m module and illustrative massing height are model choices. |
| Does equal FAR give the same building form? | The same 1,024 m² plot at FAR 1 can carry 50%, 25% or 12.5% footprint coverage with 2, 4 or 8 identical plates. |
| What changes with the land boundary? | Fixing 1,024 m² modelled floor area gives FAR 1, 0.25 and 0.0625 in the three nested cases. About 30 residents/ha is a separate historical statement. |
| Is repeated-footprint floor area measured? | The public fixtures are synthetic. In an empirical exchange, repeating identical footprint plates requires inferred or estimated status. |
| Why can one L-shaped building be both 16 m and 6 m deep? | The values are the full envelope depth and the depth at the 20 m easting transect. Neither is a recommendation. |

## Contextual assertions — v2026-11-25.3

The collection adds the Helsinki, Espoo and Tampere daycare references, two
SuRaKu clear turning diameters and the scoped Espoo detention examples. The
released evidence and service source records supply the values and locators.
The formerly illustrated stormwater storage panel stays retired. The
detention calculation is available under Sources for the basin panel.

The catalogue links JSON, JSON Schema, generated Markdown and twenty
deterministic consumer cases. The cases include expected answers, supporting
IDs and evidence, and one plausible misreading per question. Retrieval and
field validation do not test an AI model’s interpretation.

The launch audit retrieved v2026-11-25.2 from Pages and verified its assertion
dataset against the deployed manifest before freezing the original 15
revisions. The original fields and example results compare equal after
removing the new annotations. See [schema, citation and revision
conventions](CONTEXTUAL-ASSERTIONS.md).

## Residential block capacity — v2026-11-25.4 candidate

The morphology lab compares 2, 4 and 8 storeys on a 32 × 32 m synthetic
site at a target of 1,024 m² of modelled floor area. The footprints are
512, 256 and 128 m². At 75% residential and an assumed 40 m² of modelled
residential area per person, each alternative estimates 19.2 residents.
The comparison uses repeating full floor plates and one rectangular slab
spanning the study area width. The unbuilt ground calculation subtracts
the footprint. Access, daylight, surface use and planning compliance
require separate design information.

The catalogue links the static exercise and `data/morphology/worked-examples.json`.
The JSON records formulas, their dependencies, units, geometry and source
assertion revisions. To reproduce the public reference or run a different
target from the repository root:

```sh
node --input-type=module -e '
  import {referenceCapacityInputs, residentialCapacity} from "./lab/morphology/capacity.mjs";
  const record = residentialCapacity({...referenceCapacityInputs, targetFloorArea:2304});
  console.log(JSON.stringify(record, null, 2));
'
```

For the reference target, pass `referenceCapacityInputs` directly. The
2,304 m² variation needs a 1,152 m² footprint with two storeys, which exceeds
the site area. The four and eight storey alternatives still fit by area.
Use `null` for an unknown input. Occupancy values require the
`modelled-residential-full-floor-plates` basis. The worksheet rounds values
for display and the JSON retains the calculated precision.

The browser uses the same calculation for its interactive comparison and
JSON download. Seven added deterministic consumer cases cover alternatives,
missing and incompatible inputs, area fit and interpretation limits. See
[worked example revision conventions](CONTEXTUAL-ASSERTIONS.md#worked-example-revisions).
