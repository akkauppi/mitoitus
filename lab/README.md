# Mitoitus diorama lab

Local visual exploration, started 12 November 2026 from published baseline
`93bb622`. **No push or deployment until the user explicitly releases this hold.**
The existing sheets, content, evidence and downloads remain unchanged.

## Preview

From this worktree:

```sh
cd lab
npm run dev
```

Open **http://localhost:8765/lab/**. The server binds only to loopback. No build or
installation is needed for preview: pinned Three.js files are checked in. ES
modules require an HTTP server; double-clicking the HTML is not supported.

Choose a scene, then compare Paper model, Contour drawing and Pastel relief using
the same geometry. Drag to orbit, scroll to zoom, or use the 3D/Plan/Section
buttons. With the drawing focused, arrow keys orbit, +/− zoom and Home resets.
On touch devices use two fingers to manipulate the model; one finger scrolls the
page. Scene/style/view presets are bookmarkable. Free camera position is not.
SVG export captures geometry and enabled labels from the current view; shadows
are intentionally omitted. The dimensions also remain ordinary accessible text.

## Local Git arrangement

- Main public checkout: `/home/antti/mitoitus-public`, preserved at `93bb622`.
- Experimental worktree: `/home/antti/mitoitus-diorama`.
- Local branch: `experiment/diorama-style`; no upstream configured.
- Do not sync this directory into the public checkout or private course mirror.

A worktree is sufficient for the current design iteration: separate files and
commits, shared history, easy eventual review. A GitHub fork would be useful if
this becomes a separately maintained product; it adds no needed isolation now.
Nothing here authorizes publication. A local commit does not trigger Pages.

## Current scope

Three scenes: a composed walking/cycling street, the existing tram-stop width and
length example, and the existing soil-volume illustration. These are experiments,
not replacements for all eleven reference sheets. All new visuals and editorial
text are assistant drafts. No visual treatment has yet been accepted as final.

Six original procedural assets: person, tree, car, tram, bicycle and bench.
Detailed dimensions and illustration assumptions: [scene evidence](SCENE-EVIDENCE.md).
Style rules and delegation template: [STYLE.md](docs/STYLE.md).
Code / SolidCraft / Blender comparison and third-party asset options:
[PIPELINE.md](docs/PIPELINE.md).
Iteration record and verification limits: [REVIEW.md](docs/REVIEW.md).

## Development

```sh
npm ci --ignore-scripts
npm test
```

`assets.js` owns repeated metric objects; `scenes.js` owns arrangement, dimensions
and provenance links; `styles.js` owns the semantic palettes; `viewer.js` owns
camera, responsive rendering, projected SVG annotations and vector export.
`lab.css` owns presentation and readable screen-space type. Keep those boundaries
when delegating another scene. Do not copy a separate renderer into each sheet.

Three.js is pinned to 0.187.0. To deliberately refresh vendored files after a
reviewed dependency change, run `npm run vendor`. Keep the MIT licence and hash
manifest. The preview makes no external font, CDN, API or asset requests.

Browser checks use Playwright if already available. The check script accepts a
`PLAYWRIGHT_MODULE` path when installed outside this project; see REVIEW.md for
the actual verification environment. No browser automation dependency is needed
to use the lab.
