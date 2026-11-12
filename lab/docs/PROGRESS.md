# Implementation progress

## T01 complete — 12 November 2026

The isolated baseline candidate and explicit packaging boundary are implemented.
The candidate remains the original reference layout; T02 has not started.

### Build and export

From the worktree root:

```sh
python3 lab/scripts/build-book.py
# After the first build, explicitly replace an intact generated candidate:
python3 lab/scripts/build-book.py --replace
python3 lab/scripts/package-book.py
python3 -m unittest discover -s lab/tests -p 'test_candidate.py' -v
```

Candidate: ignored `lab/book/`; preview at http://localhost:8765/lab/book/ when
the existing local server is running. Offline export:
`lab/.build/rulebook-offline.zip`. Neither command overwrites root HTML, existing
public ZIPs or CAD. The old recursive packager must not be used here.

### Preservation and output guards

- Baseline SHA256, ordered sheet/panel identities, headings, proof links,
  drawing identities/descriptions and every variant label/index/order/count are
  checked against the plan inventory: 11 sheets, 33 panels and 44 drawings;
  walking/cycling/car/bus groups retain 4/5/3/3 choices.
- `parity.json` records all normalized semantic HTML events, including table cells,
  facts, qualifiers, source-visibility classes and inline markup, plus content
  metadata and per-artifact hashes. Only whitespace is normalized.
- Builds preflight inputs, stage in a temporary sibling, compare staged content,
  verify the output and then install it. A failed install restores the previous
  candidate. Temporary staging is removed after handled failures.
- `--replace` requires a verified generated directory. Edited/missing/unapproved
  files and symlinks fail closed. A one-time byte-verified migration supports the
  initial T01 candidate from commit `75c2d3b`.
- Build output is restricted to `lab/book`; exported ZIP to the fixed `.build`
  path. Alternate paths, traversal spellings and symlink ancestors are rejected.
- ZIP members come only from an explicit 53-file allowlist. The old offline ZIP,
  parity report, sources, lab pages, dependencies, logs and review outputs are
  excluded. A newly generated offline archive supplies the candidate's own link.
  Existing public CAD bundles are copied byte-for-byte; those intended CAD ZIPs
  remain included. Archive names, CRCs, contents and a 32 MiB uncompressed budget
  are checked. Output is deterministic for unchanged inputs.

### Verification

18 focused tests passed on 12 November 2026, using temporary repository copies:
content/identity/variant drift; source visibility and numeric changes; repeat
builds; explicit replacement; source/output symlinks; unknown or edited files;
missing sources; staged-content corruption; staging/install/export failures with
recovery; archive allowlist, bytes, size budget and exclusion of rogue files.

The actual candidate was rebuilt successfully with `--replace` and exported.
Archive: 53 files, 429,894 compressed bytes / 1,038,611 uncompressed bytes.
Course check passed: 6 weeks, 38 items, 46 source hashes; weekly exports match.
Baseline root files and the separate published checkout remain unchanged.

Limits: T01 establishes content/build/package behavior, not new visuals or a
browser/print/wall acceptance result. Directory installation uses verified staging
and rename/rollback; it is not a concurrent-build protocol or a promise of a
zero-gap view to simultaneous HTTP readers. Power-loss recovery is not tested.
No push or deployment. Next task: T02 static shell and state.

## T02 complete — 12 November 2026

The isolated candidate now has a static book shell: three-panel Overview, a
focused panel view with complete original details, eleven-sheet navigation,
panel selection, previous/next, Sources, CAD, Downloads, View and Print controls.
All existing SVGs remain; interactive scene integration starts with T03.

The shell progressively enhances the baseline classic-script behavior. Existing
`app.js` owns variants, Sources, CAD and wall controls; `runtime/book-app.js`
adds focus/navigation state. No modules, CDN or WebGL are required. The original
HTML's panel details are not copied into summaries or rebuilt as images.

State preserves existing hashes/aliases, `view=desktop|wall`, all four `layout-*`
parameters and unrelated query values. Overview/Focus and panel changes use
history; supplied invalid panel/figure/camera/style/mode values normalize safely.
Each current whole figure uses its baseline `panel--vN` identity, subordinate to
the legacy variant. Additional subfigures will be registered with later recipes.
Camera/style preferences are retained for T03; camera and drawing-style controls
are not exposed for these unchanged static SVGs. Closing Focus restores the
launching Explore button and scroll position. Drawing-key events do not trigger
sheet navigation; native variant selects retain their normal keyboard behavior.

Build commands are unchanged. The template adds only two local runtime references;
source panel content and drawing metadata are still audited before installation.
The explicit offline allowlist now has 55 files, including the shell JS/CSS.
An intact T01 candidate can migrate through `--replace`; packaging rejects an
old/missing-runtime candidate until rebuilt. Latest candidate ZIP: 434,853 bytes.

### T02 verification

```sh
python3 lab/scripts/build-book.py --replace
python3 -m unittest discover -s lab/tests -p 'test_candidate.py'
node lab/tests/shell-browser.cjs
python3 lab/scripts/package-book.py
```

The browser check accepts `PLAYWRIGHT_MODULE` and `BOOK_URL` overrides; its defaults
use this machine's existing Playwright and local server on port 8765.

Passed: 18 candidate/build/archive regression tests; 110 responsive Overview/Focus
states across all eleven sheets at 320/390/768/1024/1440 px; all 33 focused panels;
15 original variants with reload; exact DOM details parity against baseline;
hash aliases, invalid-state normalization, unrelated URL state, history,
keyboard/Escape, focus and actual scroll restoration, CAD units/download links,
Sources reset on reload, wall exit, no-JS access to all 33 panels, and direct-file
navigation/variants. No page JavaScript errors or runtime external requests.
Course checker passed again: 6 weeks, 38 items, 46 source hashes.

Selected desktop/phone focus references and the machine-readable shell results
are under `docs/references/`. This is headless Chromium QA; actual touch, assistive
technology, physical array operation and A3 printing remain separate checks.
Wall/print retain the existing static behavior; final profiles belong to T15.
No new dioramas were implemented. No push or deployment. Next: T03 reusable viewer
and rooting-volume integration.

## T03 complete — 12 November 2026

The `trees` panel now mounts its metric rooting-volume diorama in Focus over HTTP.
Overview, wall, direct-file use and printing retain the original canonical figure.
All original facts, tables, guidance and source context remain intact. Sources
also reveals the new artwork/asset assumptions; it remains off on reload.

### Shared implementation

- `src/viewer.js`: a container-scoped scene host with one reusable WebGL context,
  `show`, `resize`, `suspend`, `reset`, `setCamera`, `setAnnotations`, `inspect`
  and `dispose`. It owns/disposes controls, observer, queued frame, geometries,
  materials and context. Rendering happens on changes only. No global selectors.
- `src/annotations.js`: extracted metric projection/dimensions and the accepted
  outside-callout solver adapter. Visible anchor counts are recorded separately
  from returned leaders, so missing callouts cannot pass as an empty success.
- `src/registry.js`: the single `trees--v0` recipe and its measurement/provenance
  contract, reusing the existing shared metric scene and assets.
- `src/book-3d.js`: root-panel DOM, 3D/Plan/Front, Reset and annotation controls.
  The original figure remains in place until a successful render, reappears on
  context loss/unavailable WebGL and is always available for print. No Section
  control is advertised; actual cut support belongs to T10.
- The classic shell imports the viewer only for the active supported panel over
  HTTP. A generation token prevents a delayed import mounting after navigation.
  It suspends the host outside Focus and disposes on page teardown; a restored
  page can mount again. Sources/history/legacy variant state remains independent.

The soil block is exactly 5 × 5 × 1 m = 25 m³; decorative ground is excluded.
The soil leader anchor was corrected from a 0.01 m offset to the actual exposed
face, preventing the Plan view from clipping that callout. The person remains
1.75 m; tree/furniture/plinth details retain declared illustration assumptions.
The live viewport has an accessible text description of the measured volume.

Current framing fits this single recipe. T04 must introduce shared union framing
before comparable width alternatives are added; the current per-view fit must not
be copied into a per-variant auto-fit implementation.

### T03 checks and entry point

Preview: http://localhost:8765/lab/book/?mode=focus&panel=trees#green-blue

```sh
npm --prefix lab test
python3 -m unittest discover -s lab/tests -p 'test_candidate.py'
node lab/tests/viewer-browser.cjs
node lab/tests/shell-browser.cjs
python3 lab/scripts/build-book.py --replace
python3 lab/scripts/package-book.py
```

Passed: 38 Node geometry/proportion/routing/recipe tests; 18 candidate/build/archive
regressions; 15 live camera states across 320/390/768/1024/1440 px; both callout
anchors, route and text-collision checks; 16 orbit checks; all three styles;
annotation toggles, keyboard and URL preservation; idle rendering; 20 reopen cycles
with one context, one observed viewport and stable scene geometry count; released
scene geometry on suspension; actual WebGL context loss/restoration; no-WebGL
fallback; a delayed-import navigation race; explicit host disposal with no later
renders; and source-only artwork provenance. Full details remained byte-identical
in the DOM. The T02 suite still passes 110 responsive states, 33 panels, 15 variants,
URL/history/CAD/keyboard checks, no-JS reading and direct-file fallback.
Course checker passed: 6 weeks, 38 items, 46 source hashes. No runtime external
requests or page JavaScript errors in the live test.

The explicit candidate archive now has 70 files / 898,722 bytes, including pinned
Three.js runtime, MIT licence and manifest. Every vendored hash is checked on
build. Root baseline files, public CAD and the separate published checkout remain
unchanged. Candidate output/ZIP and raw QA outputs remain ignored.

Checkpoint A: desktop and phone canary renders were visually inspected; selected
references and machine-readable results are in `docs/references/`. Tests used
headless Chromium/software WebGL, not physical mobile/touch/GPU/array acceptance.
No production SVG-export repair or true section support is claimed. The remaining
32 panels continue using their static figures. No push/deployment. Next task: T04.
