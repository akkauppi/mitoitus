ANTTI’S DUBIOUS LITTLE PLANNING RULEBOOK — Mitoitus
Rules of thumb. Fingers crossed. · v2026-11-13.1

Live: https://akkauppi.github.io/mitoitus/

Eleven reference spreads: buildings; residents/services; walking/cycling;
accessibility; connections; tram/stops; vehicles/turning; parking; sections;
green/blue; stormwater options. Thirty panels combine technical dimensions,
dated source tables and original outlined pastel dioramas.

The book opens in live 3D Focus. Overview provides reviewed static illustrations.
One shared 3D viewer offers plan, elevation and section views where supported.
Explicit view links are retained; Reset and Home return live scenes to 3D. Source dates,
local scope and dimensional denominators remain attached to the references.
Sources starts off; S toggles it. Arrow keys navigate spreads outside a model.
Inside a model, arrows orbit, +/- zoom and Home resets. One finger scrolls;
two fingers manipulate the model. No runtime fonts, CDNs, trackers or APIs.

The offline ZIP works from index.html without a server, using current static
figures and selectable variants. Serve the extracted folder over HTTP for 3D.
Print produces eleven A3 landscape pages, including when Focus is open. Sources
adds source links to print; full provenance is in the evidence index. Wall view
uses fixed 1600-pixel cards within a 4800×1000 three-screen canvas. Two-panel
spreads use two screen positions. Physical printing and hardware array use are
separate from automated PDF/layout checks.

CAD downloads retain seven reference sets in three units (21 DXF/SVG pairs and
three bundles), unchanged from the source edition. Turning bands are geometric
radius references. Metric assets and illustrative building heights are recorded
in the evidence/docs. No computed swept-path or hydraulic simulation is implied.

CURRENT BUILD AND RELEASE

Source development lives in lab/. The root index.html, style.css, app.js and
build-tools/ preserve the historical source edition used by the checked builder;
they are NOT the published artifact. Do not deploy the repository root or run
the old recursive package_downloads.py. Historical 2D figures are retired from
all published, fallback, print and offline outputs.

  npm ci --prefix lab --ignore-scripts
  npm test --prefix lab
  python3 -m unittest discover -s lab/tests -p 'test_*.py'
  python3 lab/scripts/build-book.py --replace
  node lab/tests/release-browser.cjs
  python3 lab/scripts/prepare-release.py
  python3 lab/scripts/verify-release.py lab/.build/release

For first build omit --replace. Serve this checkout with
  python3 -m http.server 8765 --bind 127.0.0.1
then open http://127.0.0.1:8765/lab/book/.

When scene geometry or annotation styling changes, recapture reviewed posters:
  node lab/scripts/capture-posters.cjs
Review the resulting figures and commit their manifest and assets. The build
rejects stale posters, altered source inventory, vendor drift and unapproved
archive files. Current service data is in lab/data/release-data.json; source
PDFs are linked rather than republished.

GitHub Pages uses .github/workflows/pages.yml to publish only the validated
lab/.build/release artifact. Publishing requires the task's user authorization.
See AGENTS.md, lab/docs/RELEASE.md and lab/docs/STYLE.md for the handoff.

Private course sources and original source captures remain outside this repo.
