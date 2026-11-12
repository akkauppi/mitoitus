ANTTI’S DUBIOUS LITTLE RULEBOOK — Mitoitus

Live: https://akkauppi.github.io/mitoitus/
Nine English engineering reference sheets with Finnish source dimensions:
building types; land and population; walking/cycling; accessibility; trams/stops;
vehicles/turning; green/blue; stormwater options; sections/details.

Open index.html directly or serve this folder with any static HTTP server.
No runtime packages, trackers, external fonts or API connections.
Sources are OFF on every new load; S toggles them. F toggles fullscreen.
Arrow keys or 1–9 select sheets. Dropdowns and arrows above selected drawings
browse walking, cycling and one/two-lane motor-traffic layouts in place.
Width alternatives retain one graphic scale; each is a dated source case.
People are light grey, 1.75 m tall; rider posture is 1.65 m high with 0.60 m bars.
These are declared illustration assumptions, not human-capacity standards.
Vehicle plans use cited body dimensions. Mirrors and swept paths are not implied.

The 3-screen view spans three 16:10 panels on a 4800 × 1000 reference canvas,
preserving space at seams. Use ?view=wall or ?view=desktop for a fixed mode.
The browser must already span the array; the site does not configure devices.
Print uses A3 landscape, all sheets, with the currently selected drawing variants.

CAD: six reference sets in metres, millimetres or international feet. Eighteen
DXF/SVG pairs and three ZIP bundles include evidence and assumptions. No live
calculators or model-scale conversion table. CAD files remain full-size 1:1
geometry in their declared units.
Turning bands are radius references, not computed vehicle swept paths.
Source editions, historical examples and publisher-marked drafts remain labelled.
English synthesis and original diagrams are assistant drafts; supplied W4/W5
quotes are identified separately. Municipal documents are linked, not republished.

MAINTENANCE
build-tools/build_sheets.py: source of the 27 panels and 38 selectable SVG drawings
build-tools/scale_figures.py: original filled metric people/cyclists/vehicle artwork
index.html: generated sheets and controls
style.css: desktop, mobile, wall and print layouts
app.js: navigation, layout selection and download links
cad.js: canonical CAD geometry in metres and DXF/SVG writers
cad-base.js: validated R2000 DXF skeletons for each unit
evidence.html / evidence.json: claims, editions, assumptions and source URLs
assignment-extract.txt: minimal supplied English W4/W5 excerpts
downloads/: reference geometry and evidence bundles
assets/aalto-logo.svg: existing course branding asset

Rebuild the sheets after editing their generator, CSS or JavaScript:
  python3 build-tools/build_sheets.py
This refreshes the asset hashes used to prevent stale browser caches.
Rebuild static drawings after editing cad.js:
  node build-tools/build_cad.cjs
Rebuild CAD ZIPs after editing drawings or evidence:
  python3 build-tools/package_downloads.py
Only Python and Node standard libraries are needed. Regenerating cad-base.js
requires ezdxf; it is unnecessary for ordinary edits.

The preserved TKK originals and private course tree are outside this repository.
Source documents and Aalto identity remain attributable to their owners; links
and branding do not imply endorsement of this teaching synthesis.
