# Residential capacity configurations

In the morphology laboratory, open **Capacity** and choose **Download capacity
JSON**. Send the file to a collaborator or computational tool. They can edit
`configuration.inputs` and return the JSON. Open it with **Load capacity JSON**.
For a smaller exchange, use **Copy or paste inputs**, then **Show input JSON**
to select the input-only text for copying. The worksheet also loads pasted JSON.
The same controls work in the extracted offline package.

## Input-only example

```json
{
  "schemaVersion": "1.0.0",
  "referenceRevision": "residential-block-capacity/r1",
  "selectedStoreys": 6,
  "configuration": {
    "inputs": {
      "siteWidth": 40,
      "siteDepth": 30,
      "targetFloorArea": 2400,
      "targetFloorAreaBasis": "modelled-full-floor-plates",
      "storeys": [4, 6, 8],
      "storeyHeight": 3,
      "residentialShare": 0.8,
      "occupancy": {
        "areaPerResident": 40,
        "basis": "modelled-residential-full-floor-plates"
      }
    }
  }
}
```

This synthetic configuration gives a 1,200 m² site, FAR 2 and footprints of
600, 400 and 300 m² for 4, 6 and 8 storeys. Coverage is 50%, about 33.33% and
25%. Changing `areaPerResident` from 40 to 32 raises the estimate from 48 to
60 residents while preserving the geometry.

## Format 1.0.0

- Supply `schemaVersion`, `referenceRevision` and `configuration.inputs` as
  shown. Unknown or omitted inputs become `null`. Supply the corresponding
  area basis whenever the target area or occupancy rate is known.
- Width, depth and storey height use metres. Target modelled floor area uses
  square metres of repeating full floor plates. `residentialShare` is a
  fraction from 0 to 1. Occupancy uses square metres of modelled residential
  full floor plates per person. Known lengths, target area and occupancy
  must be positive finite numbers.
- The worksheet accepts one to three distinct integer storey counts from
  1 to 100. This keeps the worksheet and elevation manageable. Use
  `selectedStoreys` to choose one listed count. An omitted or null
  `selectedStoreys` leaves the drawing unselected.
- Downloads include `edition`, which identifies the calculation software
  release, plus geometry, units, formula dependencies, assumptions, results
  and assertion revision IDs. Earlier downloads without `edition` also load.
  The `referenceRevision` identifies the published reference example. The
  configuration is the editable scenario.
- The worksheet recomputes results from inputs and reports a difference
  when saved results or geometry disagree. It rejects incompatible input
  units and area bases. A valid configuration can exceed the site area.
  The worksheet shows the required footprint and leaves its geometry empty.
