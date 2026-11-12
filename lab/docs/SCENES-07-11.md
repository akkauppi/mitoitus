# Scene plan: sheets 07–11

Catalogue numbers below retain historical source identities. For the user-approved
candidate reading order and current spread numbering, see IMPLEMENTATION-PLAN.md
§1 (12 November 2026 amendment). Panel/variant order within each spread is unchanged.


12 November 2026 · assistant implementation plan · no application changes.
The refined prototype is the starting point; no particular palette is selected.
These recipes preserve the current 15 panels and their order.
Read [STYLE.md](STYLE.md), [CALLOUTS.md](CALLOUTS.md) and [PIPELINE.md](PIPELINE.md).

## Shared contract

- Authority: the current [sheet generator](../../build-tools/build_sheets.py),
  [connection panels](../../build-tools/student_sheet.py), [parking panels](../../build-tools/parking_sheet.py),
  generated [index](../../index.html) and [claim register](../../evidence.json).
  Each ID below is an existing evidence anchor, not a proposed replacement ID.
- Default to a small orthographic diorama only when depth helps explain the
  question. Preserve tables, formulas, source context and short practical guidance.
  Keep the existing source-toggle policy; retain essential context beside numbers.
- A **cut section** removes material at an identified cutting plane and exposes
  cut faces. The prototype's **Front** preset is an elevation, not a section.
  Any recipe requiring a cut waits for shared section support; do not rename Front.
- Scene authors supply no more than four active semantic callout anchors, listed
  below. Reuse outside piles, two-segment leaders and anchor dots; dimensions use
  their separate metric system. A callout labels a visible point, not a screen offset.
- Metric examples retain metre coordinates and equal horizontal/vertical scale.
  Conceptual process diagrams have no metric scale bar, derived capacity or
  dimensioned layer thickness. Mark their geometry schematic in drawing notes.
- Use shared person poses, trees, car, bicycle and bench. New surface sections,
  water-state solids, massing blocks, stair solids, crossing markings and route
  polylines should become shared primitives, not 15 independent implementations.
- Ground/plinth thickness, furniture placement and decorative asset dimensions
  remain illustration assumptions. They must not become engineering measurements.
  Avoid scale figures where their presence would imply an unsupported scale.

## 07 — Green & blue (`green-blue`)

### 07.1 Rooting volume · claim `trees`

- **Question:** how much below-ground space corresponds to the illustrated soil volume?
- **Drawing/default:** refine the existing root diorama: a measured 5 × 5 × 1 m
  soil solid, with a tree above and a decorative plinth below. Default cutaway 3D;
  Plan and a true vertical cut expose the same soil boundary. Keep the plinth distinct.
- **Values/context:** 25 m² footprint and 25 m³ example; approximately 25 m³
  conventional soil and 40–60 m³ structural soil are Helsinki **draft** indications.
  References S19, S20, S04; the geometry is not a prescribed planting-pit design.
- **Callouts (≤3):** Soil → exposed soil face; Tree → trunk/crown; Connected soil
  → soil boundary only if a continuity illustration is selected. Do not draw measured roots.
- **Assets/comparison:** shared tree/person/soil block; 40–60 m³ stays in the
  numerical comparison, without inventing a structural-soil depth or recipe.
- **Preservation/checks:** retain crown, groundwater, utilities and continuous-soil
  guidance. Verify 5 × 5 × 1 = 25, the cut face matches its plane, tree height remains
  an illustration assumption, and no decorative lower layer is counted as soil.

### 07.2 Planting widths · claim `ground`

- **Question:** how do the four cited planting-strip widths compare at one scale?
- **Drawing/default:** four parallel short landscape strips, each seen in the
  same orthographic oblique view; provide a focused single-strip view on phones.
- **Values/context:** Espoo 2010: trees ≥3.0 m; main-street trees ≥3.5 m; low shrubs
  ≥2.5 m; lawn/ground cover ≥2.0 m. References S01 p.20, S04, S19, S22 p.12.
- **Callouts (≤4):** Tree strip → first surface; Main street → second; Low shrubs
  → third; Ground cover → fourth. Width dimensions attach to actual strip edges.
- **Assets/comparison:** shared tree, low shrub cluster and flat ground cover;
  same illustration length and camera scale for all four. Variant control selects
  a category without changing its pixels-per-metre scale within the comparison.
- **Preservation/checks:** retain the above/below-ground/winter coordination table.
  A width does not establish root volume. Do not invent snow-storage dimensions,
  shrub heights, utilities depths or clearance rules; label decorative sizes in provenance.
  Test four widths, common scale, and readable dimensions without crowding foliage.

### 07.3 Stormwater storage · claim `stormwater`

- **Question:** how do a footprint and a shallow effective depth produce 6 m³?
- **Drawing/default:** an idealised rectangular 6 × 5 m water prism, 0.20 m deep,
  with a separate small plan outline. Default oblique cutaway; true cut shows depth.
- **Values/context:** example provision 1 m³ / 100 m²; 600 m² impermeable catchment
  → 6 m³; assumed effective depth 0.20 m → 30 m²; example emptying time 12–24 h.
  Reference S07, Espoo example zoning provision, not the rule for the course site.
- **Callouts (≤3):** Effective storage → water solid; Inlet → schematic inflow
  point; Controlled overflow → separate outlet symbol. No hydraulic animation.
- **Assets/comparison:** shared water solid/section plane; Plan and cut compare
  the same geometry. Keep 600 m² as a text/input-context diagram, not a fictitious site.
- **Preservation/checks:** verify 6 × 5 × 0.20 = 6 and keep equal axis scale;
  shallow water must not be exaggerated. Retain additional side slopes, freeboard,
  maintenance, ground conditions and rainfall checks. The rectangle excludes those extras.

## 08 — Stormwater options (`stormwater-options`)

### 08.1 Rain gardens & swales · claim `rain-gardens`

- **Question:** which processes differ between a planted filter and a conveying swale?
- **Drawing/default:** two compact **conceptual cutaway** models with exposed ground
  faces; default 3D cutaway, with matching schematic sections for comparison.
- **Values/context:** no adopted filter depth, ponding depth, slope, infiltration
  rate or capacity. References S33, S31 and S34 p.4; preserve this absence of values.
- **Callouts (≤4 per active model):** Inflow → entry; Planted filter → medium;
  Infiltration where suitable → lower interface; Drain / overflow → discharge.
  Swale variant uses Inflow, Along-route flow, Temporary storage and Overflow.
- **Assets/comparison:** shared conceptual ground profile, vegetation clusters,
  water region and process arrows; switch rain garden/swale without treating their
  illustrative silhouettes as dimensioned alternatives. No automatic water simulation.
- **Preservation/checks:** distinguish possible infiltration from guaranteed
  drainage; retain contamination, winter, maintenance and overflow guidance.
  Test that no scale bar, thickness label or volume calculation is emitted for either model.

### 08.2 Basins, ponds & wetlands · claim `ponds`

- **Question:** what is available storage above a normal water level?
- **Drawing/default:** schematic cutaways of dry detention and permanent-water
  conditions, paired with a **separate metric** slope triangle. Default true section.
- **Values/context:** Helsinki indicative banks 1 vertical : 4–5 horizontal;
  triangle 1 m rise / 4 m run = 25%; 1:5 = 20%; wetlands typically tens of cm deep.
  Reference S31. “Tens of cm” does not authorize a chosen dimensioned water depth.
- **Callouts (≤4):** Live storage → upper water band; Permanent water → lower
  band (wet variant); Controlled outlet → discharge; Overflow → upper escape point.
- **Assets/comparison:** shared conceptual basin and water-level surfaces; dry/wet
  toggle retains a labelled normal level. Wetland planting is conceptual, not a species plan.
  Keep the metric slope triangle visually separate from the schematic basin.
- **Preservation/checks:** permanent water is never counted as empty capacity.
  Verify slope math and equal triangle axes, not an invented overall basin volume.
  Preserve inlet, banks, maintenance access and full flood-extent considerations.

### 08.3 Roofs, paving & reuse · claim `source-control`

- **Question:** which storage or drainage input must be checked for each source-control option?
- **Drawing/default:** paired schematic roof and paving cutaways; retain the full
  four-row options matrix beneath/beside them. Default conceptual cutaway view.
- **Values/context:** no adopted substrate, aggregate, tank or void dimensions,
  storage capacity or wet load. References S32, S34 and S31.
- **Callouts (≤4 per model):** roof: Vegetation, Substrate, Retention / evapotranspiration,
  Roof drainage; paving: Permeable surface, Aggregate voids, Subsoil, Drainage.
  Anchor each term to its illustrated layer/interface; avoid pretending to locate hidden services.
- **Assets/comparison:** shared section stack, paver and water-process glyphs.
  Roof/paving are drawing variants; rainwater reuse and underground storage remain
  matrix options until a separately specified conceptual drawing is justified.
- **Preservation/checks:** retain roof wet load, regular reuse demand, outlet,
  emptying, clogging and winter-maintenance inputs. Only pore space stores water;
  no capacity may be calculated from the full illustrated aggregate block.

## 09 — Section & details (`section-details`)

### 09.1 Street width / height · claim `section-ratio`

- **Question:** how does the same 12 m reference height relate to three street widths?
- **Drawing/default:** three honest street **cut sections**, with optional paired
  massing dioramas and visible section-plane markers. Default the comparison sections.
- **Values/context:** H = 12 m; façade-to-façade W = 12, 24, 36 m; W/H = 1, 2, 3.
  Reference W5. Building depths are illustrative; no floor/storey height is specified.
- **Callouts (≤3 per focused variant):** Width → opposing façade boundary;
  Reference height → roof/ground datum; Section line → plan cutting line.
- **Assets/comparison:** shared massing blocks, datum and dimension anchors;
  three widths retain one camera scale. Optional people keep 1.75 m and do not
  introduce lane allocations, planting widths or a new recommended street section.
- **Preservation/checks:** distinguish full street-space width from carriageway.
  Ratios are examples, not targets. Verify the three quotients, actual cut surfaces,
  shared datum and unchanged scale; identify both heights if later data has unequal sides.

### 09.2 Same ratio, different form · claim `equal-density`

- **Question:** how can distinct coverage and floor counts yield the same floor-area ratio?
- **Drawing/default:** retain three metric plot plans; add stacked-floor diagrams
  as a clearly separate explanatory view. Default common-scale Plan comparison.
- **Values/context:** each plot 32 × 32 m = 1,024 m²; coverage 50%, 25%, 12.5%;
  respectively 2, 4, 8 identical floor plates; each totals 1,024 m² and e = 1.0.
  Reference TKK definition; these configurations are existing editorial geometry.
- **Callouts (≤3 per focused example):** Plot → boundary; Footprint → occupied
  area; Floor plates → stack. Keep counts/formulas in text instead of labelling every floor.
- **Assets/comparison:** shared plot and footprint primitive; existing footprints
  are 32 × 16, 32 × 8 and 32 × 4 m. Do not invent building heights to make a metric
  3D skyline: stacked-plate spacing is schematic unless separately authorized and recorded.
- **Preservation/checks:** verify coverage × count and land-area denominators.
  Keep population, daylight, usable open space and building rights out of the inference;
  no separate-panel auto-fit that makes the three plots appear different sizes.

### 09.3 Outdoor steps · claim `steps`

- **Question:** how do repeated rise and tread form the illustrated outdoor stair?
- **Drawing/default:** a six-step solid with a true side cut and optional oblique
  view, using the existing six equal risers/treads. Default oblique plus side profile.
- **Values/context:** SuRaKu 2008: rise 0.12 m; derived tread 0.42 m; 2r+t = 0.66 m;
  minimum width 1.2 m; resting landing recommended every 10–15 steps; edge contrast
  30–40 mm. Covered/heated relation is 0.63 m. Reference S10 p.6.
- **Callouts (≤3):** Riser → one vertical face; Tread → one horizontal face;
  Contrast edge → selected front edge. Put dimensions on those actual faces.
- **Assets/comparison:** shared repeated-step solid and scale person placed beside
  it, not with feet floating over stair geometry. Use 1.2 m only as the labelled source minimum.
- **Preservation/checks:** verify six identical 0.12/0.42 increments and equal axes;
  no implied landing after six steps. Retain accessible alternative, rails/guarding
  coordination and incomplete-design context; do not invent rail heights or contrast-strip width.

## 10 — Connections (`connections`)

### 10.1 Crossing refuge · claim `crossing-refuge`

- **Question:** how much width does a refuge add along the crossing direction?
- **Drawing/default:** a shallow street diorama with the existing crossing layout;
  default Plan for clarity, oblique available without changing metric geometry.
- **Values/context:** refuge ≥2.5 m; example lanes 2 × 3 m; derived span 8.5 m;
  example opening 4 m and island length 8 m; white stripe/gap each 0.5 m.
  References S01 p.20, S10 p.1 and S41. Keep assumed opening/length distinguishable.
- **Callouts (≤4):** Refuge → clear opening; Walking route → crossing continuation;
  Lane → carriageway; Zebra marking → an actual white stripe.
- **Assets/comparison:** shared road/kerb/markings and people; Plan/oblique comparison.
  Use source-preserving planar kerb cues; any decorative raised island height is an assumption.
- **Preservation/checks:** stripes run **along the road**, perpendicular to walking;
  retain vehicle arrows. Verify 3+2.5+3, stripe/gap spacing and clear refuge opening.
  Do not shrink lanes, imply complete tactile/junction details or place decoration in the route.

### 10.2 Check every link · claim `walking-connections`

**Current user-approved direction, 12 November 2026:** continuity and weakest
links, replacing the overly obvious interactive 500/300 m comparison. A static
native vector schematic follows a gate and crossing to the actual entrance.
The short dashed spur terminates at the building wall, not at an entrance.
Gate hours, crossing continuity and accessible approach are questions to check,
not asserted site conditions. Opening hours, slopes, barriers and winter maintenance
come from the retained source discussion; all new editorial text is an assistant
draft. No metric scale, invented threshold or guaranteed accessible route.

Source baseline remains intact. The original 300/500/200 m table and practical
notes are retained in a Sources-only history drawer. No emphasis controls or WebGL
are needed for this panel. Both native/file fallback and phone labels are checked.

### 10.3 Keep the whole corridor clear · claim `clear-route-continuity`

**Current review supersedes the initial T08 split pinch/height views.** One
compact 6 m illustrative route segment combines the following sourced contexts:
≥1.5 m clear width, a ≥1.8 m passing widening, ≥2.2 m pedestrian overhead clearance,
and ≥3 m recommended under a building. Furniture stands outside the clear ribbon.
No 1.4 m failing passage appears as a usable design example. Source tables and
practical caveats are unchanged; overhead fragments are illustration assumptions,
not structural specifications. Widening length 1.2 m is illustrative; the drawing
does not validate complete passing/manoeuvring geometry or regulatory compliance.

Default oblique view is framed along the route for readable width/height context
on phones. Plan/Front remain optional camera presets of the **same** model;
there is no separate height mode or artificial cut. Callouts: clear corridor,
furniture outside, overhead clearance and under building. All dimensional anchors,
passage bounds, furniture separation and preset annotation layouts are checked.

## 11 — Parking (`parking`)

### 11.1 Bays & manoeuvring · claim `parking-layout`

- **Question:** how do eight repeated bays and their shared aisle occupy a module?
- **Drawing/default:** shallow plan-led parking diorama, four bays per side of one
  aisle; default Plan, with a restrained oblique option and removable scale cars.
- **Values/context:** dated 90° bay 2.5 × 5 m; two-way aisle ≥7 m; module 5+7+5=17 m;
  accessible courtyard bay ≥3.6 × 5 m. References TKK, S37 p.21, S10 p.7, S36 p.37, W4.
- **Callouts (≤3):** Bay → one bay surface; Shared aisle → central strip;
  Reference car → body. Use the shared 5 × 1.8 m car, without mirrors or a swept path.
- **Assets/comparison:** shared bay grid/markings/car; accessible bay remains a
  separately labelled reference, not a silent replacement in the eight-space count.
- **Preservation/checks:** maintain visible **W4: no long-term private-car parking**.
  Verify eight bays, real widths and 17 m span. Repeating interior bays exclude end
  conditions; the evidence notes ≥2.75 m end bays. Do not imply door, transfer or manoeuvre validation.

### 11.2 A bay is not the full area · claim `parking-area`

- **Question:** what area belongs to a space when the aisle is shared between facing bays?
- **Drawing/default:** full two-facing-bay plan with highlighted half-aisle ownership;
  optional shallow lift of the highlighted region, without suggesting a narrower road.
- **Values/context:** bay 12.5 m²; allocated aisle share 3.5 × 2.5 = 8.75 m²;
  per space 21.25 m²; facing pair 42.5 m²; 20-space repeating module 425 m².
  References S37 p.21 and TKK. These are accounting areas, not complete-site gross areas.
- **Callouts (≤3):** Bay area → bay; Allocated aisle share → highlighted half;
  Full shared aisle → the complete 7 m strip. Preserve the entire aisle outline.
- **Assets/comparison:** reuse previous panel geometry; toggle one-space accounting
  and full-module context. Keep equations in 2D text; no area-based scaling of cars.
- **Preservation/checks:** verify all sums, divide the pair area by two exactly once,
  and never label 3.5 m as a manoeuvring aisle. Preserve entrances, ends, accessible routes,
  planting, snow, drainage and garage structure/ramp extras; no universal gross allowance.

### 11.3 Apartment parking norms · claim `parking-norms`

- **Question:** how do two stated municipal contexts produce different example counts?
- **Drawing/default:** retain a **2D comparison chart and six-row table**, not a
  metric diorama. Bars encode car-space counts; optional discrete count markers stay symbolic.
- **Values/context:** Helsinki 2025 zones 2/3/4: 1 per 250/230/200 floor-m²;
  mapped C1/C2/C3 centres add 30 to the denominators. Espoo 2025 core classes I/II/III:
  1 per 130/110/95 floor-m², also ≥0.5 per dwelling; visitors ≥5% within required total.
  References S39 p.1/4–6, S38 p.1, S40 and W4; preserve dated mapped-location context.
- **Callouts:** none required. Chart category labels and values are ordinary 2D text,
  not leaders pointing to invented apartment buildings or parking layouts.
- **Comparison:** existing assumed 10,000 residential floor-m² and 100 dwellings;
  Helsinki zone 3 outside centres: ceil(10,000/230)=44; Espoo class I core:
  ceil(max(10,000/130,0.5×100))=77. No reductions; these are minima, not demand forecasts.
- **Preservation/checks:** verify 44/77, table denominators, rounding and both Espoo
  constraints. Keep zone maps/plan checks; do not make Helsinki zones station rings,
  add visitors twice or replace the W4 prohibition. No new live calculator is proposed.

## Delegation and review gate

Implement one panel at a time after shared layout and section/concept contracts exist.
Name its claim ID, permitted assets and metric/schematic status. Retain current text;
moving it to Sources follows the documented display policy. Review desktop, 390 px
and 320 px, source dimensions, callouts, claim provenance and exported vector geometry.
Test actual cuts, not a view label. Keep the existing 2D fallback until review passes.
Commit locally in small batches. This plan authorizes neither pushing nor deployment.
