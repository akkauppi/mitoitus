# Modern static figures and offline package

13 November 2026 · T15 implementation · original artwork remains an assistant draft.

Every active spatial recipe now has a reviewed default-view poster, including all
walking/cycling/vehicle variants and planting, water-system and parking categories.
There are 37 recipes, 45 displayed states and two layout profiles: 90 SVG files.
The retired walking-connections and rectangular stormwater-storage panels have
no posters. Density and services use tables; green-space and parking-count charts
remain new native SVG. The bank-slope triangle is newly authored native SVG.

The poster combines a still render from the **same Three.js scene host** used by
Focus with vector dimensions, leaders and labels. The geometry is an embedded
PNG, preserving WebGL edges and occlusion. It is not represented as all-vector
geometry. The external SVG is self-contained, includes title/description/source
claims, and is displayed with meaningful HTML alt text beside the reference facts.
No old figure remains in the candidate, Sources companions, print or offline ZIP.
Original source drawings and CAD exports remain preserved outside this migration.

## Rebuild

Serve the repository locally on port 8765, then run from the repository root:

```sh
node lab/scripts/capture-posters.cjs
python3 lab/scripts/build-book.py --replace
python3 lab/scripts/package-book.py
python3 -m unittest discover -s lab/tests -p 'test_candidate.py'
```

The capture script uses the existing Playwright installation by default; set
`PLAYWRIGHT_MODULE` to another installation when needed. It opens only a local
capture harness and makes no external requests. It records hashes for its scene,
asset, rendering and annotation inputs; source changes require new captures.
All geometry/camera/material state is reset before each poster. Capture checks
callout success, annotation bounds and text overlap, then rejects source edits
that occur during the run. The build separately rejects stale or modified posters.

`posters/manifest.json` is the exact asset allowlist. Nothing is copied by globbing
the development tree. SVG bytes and hash records are retained under `lab/posters/`;
the build maps them to public `posters/`. The package has no test output, source
captures, node_modules or private course data. CAD bytes remain unchanged.

## Layout and offline controls

Compact posters are authored at 320 × 420 CSS pixels, with 2× raster geometry;
wide posters at 900 × 560. Vector text remains sharp. Compact callouts wrap inside
their reserved gutter rather than shrinking long labels. Wide posters support
large Focus fallbacks and wall display; compact posters serve cards and paper.
Actual physical text size still depends on the final printed scale.

`runtime/posters.css` owns profile defaults and `runtime/release.css` can refine
the book layout. Each figure has `data-current-poster` and `data-poster-set`;
its `.poster-option` children contain compact/wide images. All images load eagerly
so printing a hidden sheet or leaving Focus does not wait on lazy loading.

The classic `runtime/posters.js` supplies category selectors without ES modules,
including direct-file use. Existing four source-variant groups retain their
original controls. Live category changes also select the corresponding fallback
poster for Overview/printing; category state is stored in the URL. Static posters
use reviewed default cameras, not an unreviewed arbitrary live orbit.

## Evidence and limits

Automated capture verifies 90 rendered states and complete local dependencies.
Candidate tests cover exact allowlist packaging, source/poster hashes, retained
numeric tables, release aliases and retirement, deterministic ZIPs, atomic
replacement and preservation on failure. Whole-book/browser/print acceptance is
recorded separately by T16; these capture checks do not prove physical printing,
wall-array operation or every browser/GPU combination.

The source-link correction in the candidate changes only S10's old HTTP hostname
to the verified official HTTPS destination. Its PDF SHA-256 is unchanged, and
page fragments remain intact. The original source register stays preserved;
`data/source-link-updates.json` records the observed same-content redirect.
