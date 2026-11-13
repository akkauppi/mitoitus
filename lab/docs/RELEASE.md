# Rulebook release — 2026-11-13

Current edition: **v2026-11-13.1** (live-view and dimension-type update).
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
