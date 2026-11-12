# Scene and asset generation

12 November 2026 · assistant draft · local experiments only; no push or deployment.

Use the browser studies to choose the visual language before replacing the
rulebook's drawings. The scene data and dimension evidence remain authoritative
regardless of the tool used to make a tree, vehicle or bench.

## Current implementation

`scenes.js` assembles metric geometry and annotation anchors; `assets.js` supplies
repeated objects. One unit is one metre, Y is up. `styles.js` owns material roles
and palettes; assets do not define independent scene palettes. `viewer.js` owns
orthographic framing, interaction and the SVG annotation overlay.

This is the preferred first pipeline: small deterministic source files make
dimensions and revisions easy to inspect. Use named parameters and shared asset
constructors. Do not hand-place another approximation of an existing asset.
Keep sourced dimensions separate from illustration assumptions, as recorded in
[the scene evidence](../SCENE-EVIDENCE.md).

## Vector appearance and vector files

The interactive Three.js canvas is rasterised WebGL, even when it looks like a
vector illustration. Flat pastel fills, restrained geometric detail, orthographic
projection and selective edges produce the intended appearance. Annotation text
and dimension lines are actual SVG over the canvas and keep readable screen sizes.

The **Export SVG** button uses Three.js `SVGRenderer` plus the annotation overlay
to produce actual vector paths/text for the current view. It is a separate
rendering path: no WebGL shadows, no live orbiting in the downloaded file, and
view-dependent painter-order/overlap limitations. Inspect the export itself,
especially intersecting objects and line occlusion; a correct browser view does
not establish a correct SVG. Prefer a reviewed preset for print deliverables.

Three.js references: [orthographic camera](https://threejs.org/docs/pages/OrthographicCamera.html),
[edge selection](https://threejs.org/docs/pages/EdgesGeometry.html),
[SVG renderer](https://threejs.org/docs/pages/SVGRenderer.html).
WebGL ignores `LineBasicMaterial.linewidth`; use a wide-line implementation if
future studies require heavier canvas strokes. [Line material](https://threejs.org/docs/pages/LineBasicMaterial.html)

## Authoring options

| Tool | Good use here | Exchange and limits |
|---|---|---|
| Procedural JavaScript | Ground layers, paths, platform widths, dimension anchors, simple repeated assets | Direct browser geometry; least conversion and easiest review. Current implementation. |
| SolidCraft CLI | Editable hard-surface parts such as a bench, shelter or modular vehicle body | Parametric source plus OBJ/MTL; mm and Z-up need explicit conversion to metres and Y-up. Its current glTF support is import only. |
| Blender Python/CLI | Refined silhouettes for people/trees, imported mesh cleanup, reusable authored assets | Preserve `.blend` and export script; deliver GLB with simple materials and named parts. Browser supplies outlines and annotations. Not installed during this review. |

Choose an external modeller when it improves the asset, not simply to generate
boxes already represented clearly in code. Do not move responsive labels or
whole scene layouts into individual model files.

### SolidCraft: verified local capabilities

`/usr/bin/solidcraft` and `/usr/bin/solidcraft-cli` are installed. Read-only
`--help` and `commands` were inspected; no existing design or GUI session was
opened or changed. No SolidCraft MCP tools were connected in this session.

The installed CLI exposes parametric construction, measurement, CPU snapshots,
body colours and OBJ/MTL export. `view.visual_style` includes
`shaded_with_edges`; `view.perspective` can select orthographic. Sketch text and
dimensions are plane-based model elements. `file.export_view_dxf` explicitly
omits dimensions and overlays, so it does not replace the browser annotations.

For a future **bench-only experiment**, prepare a new reviewed `bench.json`
command script in its own scratch directory, using the installed command
contracts. The following command forms were verified in local help; the bench
experiment itself has not been run:

```sh
solidcraft-cli commands
solidcraft-cli eval bench.json
solidcraft-cli run bench.json --save bench.sc --out bench.obj --param-check strict
solidcraft-cli snapshot bench.sc --out bench.png --view iso --no-grid --no-axes
```

Keep the `.sc`, script, OBJ and MTL together. Check seat height and bounding box
after import; map imported colours to existing material roles. Compare the result
against `createBench()` before adopting another dependency. The headless CLI is
sufficient for this trial; configuring an MCP connection is optional.

Primary references: [SolidCraft introduction](https://docs.solidcraft.io/),
[MCP/CLI workflow](https://solidcraft.io/mcp/),
[format support](https://docs.solidcraft.io/guide/files.html).

### Blender: future option

Blender can run a reproducible script with
`blender --background --python build_asset.py`; glTF export uses
`bpy.ops.export_scene.gltf(...)`. Keep materials within the exporter's supported
set. Do not assume a Blender toon shader or Freestyle strokes will become the
same browser effect in GLB; apply the common browser materials/edges after import.

Freestyle SVG export is a separate fixed-view option for print. Its availability
and compatibility must be checked against the installed Blender version; the
verified exporter manual below is for 4.1. It is not required for the current lab.

Primary references: [CLI arguments](https://docs.blender.org/manual/en/5.1/advanced/command_line/arguments.html),
[glTF materials](https://docs.blender.org/manual/en/5.2/addons/scene_gltf2.html),
[Python export API](https://docs.blender.org/api/3.3/bpy.ops.export_scene.html),
[Freestyle SVG](https://docs.blender.org/manual/en/4.1/addons/render/render_freestyle_svg.html).

## External asset policy

No external model pack is needed by these initial studies. These are candidates,
not adopted dependencies:

| Candidate | Verified publisher statement |
|---|---|
| [Kenney Car Kit](https://kenney.nl/assets/car-kit) | Creative Commons CC0; 45 files. |
| [Kenney Train Kit](https://kenney.nl/assets/train-kit) | Creative Commons CC0; 100 files, tagged train/tram/trolley. |
| [Kenney City Kit — Roads](https://kenney.nl/assets/city-kit-roads) | Creative Commons CC0; road furniture/context. |
| [Quaternius Ultimate Stylized Nature](https://quaternius.com/packs/ultimatestylizednature.html) | This pack page says CC0, but the current [general licence](https://quaternius.com/license.html) is QAL v1.0, dated 28 August 2026, and restricts standalone asset redistribution. Verify the exact downloaded archive's licence before adoption; do not assume site-wide CC0. |

For each adopted asset record source URL, author, download date, archive/file
hash, preserved licence text, original units/axes, conversion, measured bounds,
and modifications. Keep credit even where optional. Licence permission does not
verify metric accuracy. A generic vehicle's proportions are not evidence for a
named vehicle envelope; use the rulebook's cited dimensions or mark assumptions.

Any later asset import must pass the same visual checks as procedural geometry:
all three treatments, preset views, narrow/mobile layout, label legibility and
SVG export. Store the editable source and a repeatable conversion command so
another model can revise it without reconstructing this conversation.
