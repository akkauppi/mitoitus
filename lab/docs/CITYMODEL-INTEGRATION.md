# City model integration with Dubious

This guide is for the developer exporting results from the separate city model applications. Dubious receives measurements and evidence about how they were made. Export a small package from each application before proposing a production import. The contract is provisional until both exports have been inspected.

## Files and versions

| File | Purpose |
| --- | --- |
| [Measurement dictionary](../data/morphology/measurements.json) | Version 1.0.0. Fifteen concepts, units, method identifiers and versions, inputs, bases, geometry, limitations and expected examples. |
| [Exchange JSON Schema](../data/morphology/exchange.schema.json) | Draft 2020-12. Package version 0.1.0. |
| [Synthetic exchange example](https://akkauppi.github.io/mitoitus/data/morphology/example-package.json) | A complete round-trip specimen. It describes an exact generated block. |
| [Synthetic fixture records](https://akkauppi.github.io/mitoitus/data/morphology/fixtures.json) | Eight analytical fixtures, each with replay parameters, geometry, exchange payload and shared formulas. |

In an extracted release, the example and dictionary are under `data/morphology/`. If sharing a checkout, use the two source files above and generate the examples with `node lab/morphology/import.mjs --fixtures`. Select a record’s `exchange` object as an individual package.

## What to export first

Export one bounded study area per file in UTF‑8 JSON. Start with one building footprint, its building height, the study-area area and the building-coverage ratio. Add floor area or FAR only after agreeing on the included floor plates and denominator boundary. Include two different study areas for a comparison. Use stable source IDs or privacy-safe stable local IDs, and maintain them across exports of the same source feature.

A package has these top-level keys.

| Key | Required content |
| --- | --- |
| `schemaVersion`, `dictionaryVersion`, `kind` | `0.1.0`, `1.0.0`, `empirical` for a genuine city model export. A generated teaching example uses `synthetic`. |
| `studyArea` | Stable `id`, display `label`, explicit `boundaryBasis`, `crs` and `planarGeometry` and/or `geojson`. State whether the boundary is a plot, a block, a clipped analysis area or another area definition. |
| `dataset` | Stable `id`, `title`, actual `edition` or snapshot tag, `attribution`, `rightsStatus`, and optional `sourceUrl`. Include a licence identifier or URL if `rightsStatus` is `licence-declared`. Supply the permission record separately if applicable. |
| `provenance` | `producer`, software/version, `process` and `limitations`. Add `observedAt` if the observation date is known. Describe input geometry, filtering, overlap removal, reprojection, floor estimation and missing values. Separate source release date from observed date. |
| `observations` | One finite numeric value per row, with `id`, `subject`, `measurement`, `method`, `methodVersion`, `unit`, `status` and `basis`. Add row-specific `limitations` where needed. Subject `study` is reserved for block or area aggregates. Other subjects are stable feature or transect IDs. |

An observation’s `measurement` identifies what it describes. The `method` and `methodVersion` identify how it was obtained. The approved methods are listed inside each dictionary entry. If the application measures eaves height, for example, include that convention in `basis` and preserve the source’s vertical datum. If an algorithm differs from the available method, send its definition for review before assigning a method ID. Do not relabel the result to pass validation.

Use `measured` for directly computed or measured geometry under a documented method, `source-provided` for a named source attribute, `inferred` for a value inferred from other attributes, and `estimated` for an approximate model. Repeating a footprint across assumed storeys is estimated or inferred floor area. The synthetic fixtures use `synthetic` throughout. Omit values that could not be determined and explain the omission in limitations. Use fractions for unit `1`. For example, 37% is sent as 0.37.

Optional `distribution` contains `sampleSize`, `min`, `max` and arithmetic `mean` in the observation’s unit. Describe the population, weighting, missing-value policy and what the primary `value` represents. A polygon representative geometry can be sent as `representativePlanarGeometry` or `representativeGeojson`. `guidanceReferences` contains optional public Dubious evidence claim IDs as comparison context. The measurement retains its empirical status. A guidance link does not certify conformity.

## Coordinates and geometry

- Declare the actual projected measurement CRS using `{"kind":"projected","id":"EPSG:<code>","axes":["east","north"],"units":"m"}`. Determine or transform it from the source to projected metres before measuring. Record the source CRS and transformation in provenance. Adjacent municipality datasets may use different grid systems and must declare their actual values.
- `planarGeometry` is a Cartesian `Polygon` object with closed 2D rings in `[easting,northing]` order. The first ring is the exterior. The remaining rings are holes. These objects are embedded coordinate payloads. Treat them as planar coordinates in the declared CRS.
- Optional `geojson` is an RFC 7946 two-dimensional Polygon in longitude, latitude order. Use it to locate or display the study area. Reproject and retain projected inputs for metric observations. A GeoJSON copy leaves the package’s measurement CRS unchanged. Follow ring closure and winding rules from RFC 7946. [GeoJSON specification](https://www.rfc-editor.org/rfc/rfc7946)
- Put height in observations, with the base/top conventions and vertical datum identified. Tell Dubious whether heights are relative, elevations above a named datum, or inferred from storeys. Send two-dimensional geometry only under this version.
- Clip footprints and canopy to the same study area for their respective coverage fractions. Union overlaps for coverage. Explain how building parts, courtyards, overhangs, underground volumes, missing storeys and crossing boundaries were treated.
- For footprint or study-area multipolygons, keep the measurement method consistent and send a review sample before introducing a new geometry type. The provisional transport supports Polygon objects. Its basic checks cover structural validity, closed rings, finite coordinates and WGS84 bounds. The producer remains responsible for polygon topology, CRS definitions, planar/GeoJSON correspondence and reprojection correctness.
- For orientation, record the chosen axis and north reference in the basis. Axial bearings are clockwise from north in `[0,180)` degrees. An ambiguous axis has no value until the method resolves it. For a street section, retain the transect and the heights on both sides used to calculate H/W.

## Validation and comparison

1. Run Draft 2020-12 validation against the bundled schema. Round-trip the synthetic exchange specimen first.
2. Compare units, method IDs and versions against the dictionary. Check unique observation IDs per study area and finite values. Validate geometry with the producer’s GIS validator. Test ring closure, holes, coordinate order, a known metric length, and the area of a known polygon in the chosen CRS. Check range constraints and sample size.
3. Use the exact reference fixtures to confirm output conventions. The closed block has a 1,280 m² study area, an 896 m² footprint union, coverage 0.7, and four identical modelled storeys yielding 3,584 m² and FAR 2.8. The open block uses a declared closing edge and has enclosure 0.7. The asymmetric section has 12 m and 18 m facing heights across 20 m, yielding H/W 0.75.
4. On the Dubious receiver, install the locked Node dependencies with `npm ci --prefix lab --ignore-scripts` and run the commands below from the repository root. The first returns validated JSON. The second groups records only when their declared measurement, method version, unit, basis, status and applicable boundary or orientation reference agree. Review apparent matches across sources before interpreting them.

```sh
node lab/morphology/import.mjs --import /path/to/package.json
node lab/morphology/import.mjs --compare /path/to/first.json /path/to/second.json
```

5. Test a wrong unit, unclosed ring, unknown method version, missing source edition, measured/estimated floor-area mix-up and overlapping footprints. Provide the expected result or rejection for each. The receiver checks metadata and structural inconsistencies. An analytical oracle or manually checked GIS sample is needed for correctness of real measured values.

## Handoff from the city model computer

Send a small separately approved data sample for each municipality. Include the export command, application revision and dependencies, source dataset identifier/edition, permitted attribution, source and output CRS, vertical datum, building-part rules, measured field inventory and one manually checked calculation. Provide stable identifiers for the chosen areas and a note on any restrictions on sharing source shapes. A numerical package with generalized representative geometry may be sufficient.

Open decisions include the area of buildings that cross the boundary, treatment of holes and multipart buildings, roof and ground conventions across city models, the available floor-area definitions, detailed street transects, privacy-safe excerpt sharing and the exact licences for source geometries and any derived exports. Start with measured footprint and coverage. Widen the contract after both real samples have passed the same manual and automated checks.
