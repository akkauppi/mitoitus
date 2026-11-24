# Dubious morphology architecture decision record

**Status** · Synthetic workflow verified locally. Empirical producer compatibility awaits the Helsinki and Espoo application and dataset review.

## Audit and decision

| Existing input | Reuse in the morphology layer |
| --- | --- |
| Built-form dioramas and `buildings.js` | Preserve the sourced TKK footprint ranges and the separate schematic geometry. The detached fixture shares the familiar 15 × 10 m footprint and 25 × 30 m example plot, with the numerical result derived from explicit new fixture geometry. |
| Land and population, and `equal-density` in `sections.js` | Preserve the existing distinction between district, block and plot denominators, and between modelled floor area and residents. Repeat identical floor plates in Compute using the same relationship. The published `32 × 32 m` panels retain their approved geometry and poster fingerprints. |
| Street proportions and evidence | Existing W/H is the reference convention. The synthetic asymmetric street computes the explicitly named reciprocal H/W using the mean of its two facing heights. |
| Evidence and the research semantic profile | Link guidance by public claim ID. An empirical record carries its own dataset, method and observations. A link to a guidance claim makes no compliance assertion. |
| Static build and release | Keep the approved layout, evidence, CAD and legacy public data exports live. Add the laboratory, shared dictionary, exchange specimen and fixture records through the explicit allowlist and integrity hashes. Include them in the existing offline ZIP. The morphology implementation is isolated from the earlier unpublished atomic-export draft. |

**Reference** remains the evidence-linked home of guidance, historical references and design assumptions. **Compute** derives results from the parametric geometry and explicit formulas. **Observe** is the exchange and validation path for results supplied by an external producer. All current fixture results have synthetic status. A static catalogue links to each layer. The application keeps a single shared geometry and calculation implementation for browser controls, static diagrams, fixtures and exchange packages.

An independent audit of the existing public deployment retrieved the homepage, JSON, `llms.txt` and integrity manifest over HTTP 200, serving edition 2026-11-25. The HTML did not expose the data catalogue link and its URL returned 404. The added link is an ordinary HTML anchor that works without JavaScript. The catalogue links directly to the existing machine-readable reference and the morphology assets. The publishable static package was checked before deployment.

## Methods and vocabulary

Momepy supplies precedent for areas, longest-axis measurements, courtyard-hole area, street profiles and reproducible morphometrics. The dictionary separates these measurement definitions from algorithm names, input geometries and sampling. A declared-axis projection and a longest-axis method can report different lengths. The laboratory’s one transect is distinct from a street-profile sample, and the open perimeter fixture needs a declared closure. Large-scale computations or GIS topology belong with a vetted producer or library. This slice uses exact local geometry and simple analytical methods for their limited, testable cases. [Momepy research paper](https://joss.theoj.org/papers/10.21105/joss.01807) · [Momepy API reference](https://docs.momepy.org/v0.8.0/api.html) · [Evolution of Urban Patterns](https://doi.org/10.1111/gean.12302) · [Spatial Signatures](https://livrepository.liverpool.ac.uk/3165218/1/s41597-022-01640-8.pdf)

Coverage and canopy use the study boundary and a clipped plan union. FAR uses an explicit floor-area numerator, not a dwelling area proxy. QUDT unit IRIs cover metres, square metres, degree and unitless quantities. Custom measurement IDs retain the spatial meaning of the metric. The definition of statutory Finnish gross level area has its own scope and remains separate from the laboratory’s full repeated floor plates. [QUDT](https://qudt.org/) · [Finnish term for building gross level area](https://sanastot.suomi.fi/terminology/rakymp/concept/c926)

The publication includes original synthetic coordinates and generated artwork. It links to Momepy research and documentation. The reviewed upstream Momepy code has a BSD three-clause licence. The release uses its own geometry code and ships no third-party city models, figures or papers. Current project reuse rights remain unspecified. Before accepting an empirical package for publication, verify source and derivative rights, required credits and any limits on redistributing shapes. Validation accepts a recorded unresolved status for local inspection. [Momepy software licence](https://github.com/pysal/momepy/blob/main/LICENSE)

## Verified vertical slice

The laboratory starts with a closed 40 × 32 m block, 8 m building depth, 12 m model height and four storeys. The footprint is the exterior minus its 24 × 16 m courtyard. The pipeline generates 896 m² of footprint, 70% coverage and FAR 2.8. This recipe, SVG plan, orthographic elevation and exchange result share the same geometry. The browser regression changes the depth to 10 m and verifies that the rendered shape and reported 1,040 m² footprint and 4,160 m² floor area change together. No JavaScript is needed for the default diagram or synthetic sample tables. Local JavaScript in the offline archive supports the sliders and JSON download.

The first case passed the release and browser gates before expansion to eight fixtures. The additional cases independently check a rectangle, an L shape, an open perimeter, parallel slabs, point buildings, an irregular polygon and an asymmetric street. Coverage is exact for these disjoint footprints inside their study boundaries. The validation suite checks units, methods, observation statuses, ranges, geometry syntax, licence metadata and guidance links. The receiver groups comparable records by declared dimensions and does not run GIS topology or verify real-world accuracy.

## Integration backlog

| Priority | Decision and evidence needed |
| --- | --- |
| 1 | Inventory each application’s accessible geometry, source datasets, licences, attributes, CRS, vertical datum and stable identifier strategy. Ask for an independently checked footprint and block coverage in each application. |
| 2 | Agree on footprint from walls versus roof, building-part union, clipping/holes and what a valid courtyard closure represents. Review samples where city models disagree. |
| 3 | Establish comparable roof/base heights and floor-area definitions. Retain unknown values, modelled estimates, useful area, gross area and statutory area separately. |
| 4 | Set orientation, street transect, canopy season/resolution, enclosure and distribution sampling conventions before citywide comparisons. Decide whether each merits additional methods and test oracles. |
| 5 | Decide whether multipart geometry, larger record batches, source feature lineage and per-observation uncertainties are needed after both test exports. Keep external packages in local review until their publication rights and numbers are verified. |

Use the [standalone integration guide](CITYMODEL-INTEGRATION.md) for the initial exporter handoff.
