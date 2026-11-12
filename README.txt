MITOITUS — Aalto course reference

Live: https://akkauppi.github.io/mitoitus/
Six English reference sheets grounded in Finnish municipal guidance.

Open index.html directly or serve this folder with any static HTTP server.
No runtime packages, trackers, external fonts or API connections.
Sources are off by default; S toggles them. F toggles fullscreen.
Arrow keys or 1–6 select sheets. The 3-screen view spans three 16:10 panels
on a 4800 × 1000 reference canvas, preserving space at display seams.
Use ?view=wall or ?view=desktop for a fixed mode.

CAD downloads offer metres, millimetres and international feet. Source evidence
and assumptions are linked from the drawing annotations and included in ZIPs.
Rescue geometry is a radius reference, not a vehicle swept-path simulation.
English synthesis/diagrams are assistant drafts; supplied W4 quotes are identified.
This is a teaching reference, not a claim of municipal approval.

MAINTENANCE
index.html: sheets and controls
style.css: desktop, mobile, wall and print layouts
app.js: navigation, calculators and live export
cad.js: shared canonical geometry (metres) and DXF/SVG writers
cad-base.js: validated R2000 DXF skeletons for each unit
build-tools/: reproducible public download packaging (Node and Python standard library)
evidence.html / evidence.json: reviewed claims, editions, contexts and source URLs
assignment-extract.txt: minimal supplied English excerpt supporting the course prompts
downloads/: generated reference drawings and evidence bundles
assets/aalto-logo.svg: existing course branding asset

Rebuild static drawings after editing cad.js:
  node build-tools/build_cad.cjs
Rebuild CAD ZIP bundles after editing drawings or evidence:
  python3 build-tools/package_downloads.py
Regenerating cad-base.js requires ezdxf; it is unnecessary for ordinary edits.
The preserved originals and private course repository are not part of this public tree.

Source documents and Aalto identity remain attributable to their respective owners.
Their inclusion as links or branding does not imply endorsement of this synthesis.
