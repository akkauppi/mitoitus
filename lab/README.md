# Dubious Little Planning Rulebook

The 3D rulebook links design dimensions to evidence. The open data catalogue
includes structured reference data and contextual assertions. The morphology
laboratory publishes synthetic geometries and their reproducible calculations.

The book opens in live 3D Focus. Overview, print and direct-file reading use
reviewed figures. The [release record](docs/RELEASE.md) documents the current
artifact and [PROGRESS.md](docs/PROGRESS.md) retains the implementation history.
The [city model integration guide](docs/CITYMODEL-INTEGRATION.md) documents the
measurement dictionary and exchange contract.

## Preview and checks

From the repository root:

```sh
npm ci --prefix lab --ignore-scripts
python3 lab/scripts/build-book.py
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/lab/book/. On subsequent builds, use `--replace`.

```sh
npm test --prefix lab
python3 -m unittest discover -s lab/tests -p 'test_*.py'
node lab/tests/release-browser.cjs
node lab/tests/default-view-browser.cjs
node lab/tests/dimension-typography-browser.cjs
node lab/tests/runtime-cache-browser.cjs
node lab/tests/viewer-browser.cjs
SOURCE_OVERRIDE=0 node lab/tests/poster-state-release-browser.cjs
node lab/tests/offline-release-browser.cjs
node lab/tests/interaction-release-browser.cjs
python3 lab/scripts/prepare-release.py
python3 lab/scripts/verify-release.py lab/.build/release
BOOK_URL=http://127.0.0.1:8765/lab/book/ node lab/tests/morphology-browser.cjs
python3 lab/tests/knowledge_consumer.py http://127.0.0.1:8765/lab/book/
```

Browser checks use the installed Playwright module, overridable with
`PLAYWRIGHT_MODULE`. No browser-test dependency is included in the public artifact.
The repository root is historical source input; the generated `lab/book` is the
current candidate. GitHub Pages publishes only `lab/.build/release`.

## Maintenance boundaries

- `assets.js`: shared metric people, wheelchair, vehicles, trees and furniture.
- `src/recipes/`, `src/primitives/`: scene geometry and explicit assumptions.
- `src/viewer.js`, `src/annotations.js`, `callouts.js`: one renderer, dimensions
  and noncrossing outside labels.
- `src/book-app.js`, `src/book-3d.js`, `src/posters.js`: shared page/variant/view state.
- `src/book.css`, `src/release.css`, `src/posters.css`: screen, wall and print layouts.
- `scripts/`: checked editorial transformations, poster capture and allowlisted output.
- `data/release-data.json`: additional service values with primary-source provenance.

After changing a scene, asset or annotation styling, run
`node lab/scripts/capture-posters.cjs` with the preview server running. Inspect the
resulting posters and commit their manifest with the scene changes. The builder
rejects stale poster inputs and modified vendor/source/CAD files. Code-only
navigation changes do not require recapturing geometry.

Read [STYLE.md](docs/STYLE.md), [SCENE-CONTRACT.md](docs/SCENE-CONTRACT.md) and
[CALLOUTS.md](docs/CALLOUTS.md) before extending a scene. Keep main views concise;
[quick-reference writing](docs/QUICK-REFERENCE-WRITING.md) governs all new text.
Use [SERVICES-RELEASE.md](docs/SERVICES-RELEASE.md) for the current population and
service tables, and [T15-POSTERS.md](docs/T15-POSTERS.md) for static output.

The original prototype remains in `lab/index.html` for development only. Do not
ship it, the root legacy figures, review images, node_modules or private sources.
Do not use the old recursive ZIP packager.
