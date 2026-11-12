# T14 — Parking

13 November 2026 · local implementation · assistant artwork/editorial draft.

## User amendment: remove the standalone accounting panel

User said “Bay area is not full area” was not worth its space. The candidate now
has two Parking panels: Bays & manoeuvring and Apartment parking norms. Accounting
is an optional **Area share** view of the bay model, with one compact formula visible only in that view.
The previous standalone panel is removed from navigation/reading layout; its
original table and paragraphs remain under Sources on Bays & manoeuvring.

`?panel=parking-area#parking` resolves to `parking-layout` in Area share; the retired recipe ID
also aliases the same model. The original evidence anchor remains valid. Source
inventory stays historical at 33 panels / 44 drawings. Current candidate output
is **32 panels / 43 drawings**, with the same 11 spreads and approved order.
Candidate metadata declares source counts and the retired-panel alias explicitly.
This user amendment supersedes T14's original three-panel plan, not the source
arithmetic or preserved context.

## Bay/aisle geometry and accounting

`recipes/parking.js` supplies `parkingModule({pairs})` and the shared live model.
The default four facing pairs are eight 2.5 × 5 m interior bays around one full
7 m two-way aisle. Module extent is 5 + 7 + 5 = 17 m by 10 m. Four existing
5 × 1.8 m car bodies, a 1.75 m person and 5 m tree provide scale. Human/tree pads
are separate illustration context outside the measured module and disappear
with the assets in Area share. Bases are decorative relief, not construction layers.
The separately sourced accessible courtyard bay remains a ≥3.6 × 5 m table value;
it does not silently replace a counted standard bay.

Area share highlights one 12.5 m² bay and its adjacent 3.5 × 2.5 m = 8.75 m²
share within the **unchanged full 7 m aisle**. Only the full aisle is dimensioned;
no 3.5 m line is presented as a manoeuvring aisle. Highlight relief is graphical.
The two facing shares sum to 42.5 m² and divide once to 21.25 m²/space. The reusable
ten-pair geometry is 17 × 25 = 425 m² for 20 spaces. These core-module calculations
exclude the source's site extras, preserved under Sources: entrances, ends,
walking/accessibility, planting, snow, drainage and garage structure/ramps/circulation.

Layout and Area share use the same comparison envelope and camera scale. The
category selector changes highlighting and context, not the module's dimensions.
Reset returns to Layout/Plan. Foreground bay dimensions avoid covering the cars.
The W4 no-long-term-private-car-parking instruction remains prominently visible.
Vehicle/door/transfer manoeuvre validity and end conditions are not inferred from
these model bodies; the original source notes and evidence remain available.

## Municipal examples remain native 2D

`parking_editorial.py` generates a new outlined pastel count chart, with no 3D
buildings, fake vehicle sweep or physical-length scale. Existing 2025 examples
use 10,000 residential floor-m² and 100 dwellings, without project reductions:

- Helsinki zone 3 outside C1/C2/C3: ceil(10,000 / 230) = **44**.
- Espoo class I core: ceil(max(10,000 / 130, 0.5 × 100)) = **77**.

Bars have exactly proportional 44:77 widths. The full six-row table retains
Helsinki 250/230/200 and Espoo 130/110/95 denominators. Espoo's ≥0.5 per dwelling,
≥5% of required spaces for visitors and mapped-core context remain distinct from
Helsinki's +30 denominator adjustment in mapped C1/C2/C3 centres. Source originals,
dated location assumptions, rounding and qualifications are preserved. No rules
were researched or replaced. New chart labels and short notes are assistant
editorial presentation, with the complete original notes under Sources.

## Verification and publication boundary

105 Node tests cover the actual eight bay meshes, full aisle and module bounds,
allocation areas, facing-pair arithmetic, 20-space 425 m² geometry, correct car
orientation/size/contact, context outside the measured module, palette roles and
historical recipe alias. Python candidate/population/parking checks preserve
original tables/conditions, verify exact count formulas/bar proportionality and
exercise the retired-visual export rejection.

`parking-browser.cjs` checks 25 states across five viewport widths: both model
modes and cameras plus the native norm chart. It verifies full-aisle labels,
constant framing, outside labels without crossings/clipping/text collisions,
W4 instruction, native bar proportionality, six rows, Sources archive and old-link
alias. Ten mode/suspension cycles check stable GPU geometry count and one context.
The norm chart works directly from disk. The whole shell exercises the two-panel
spread, 32 active panels plus the retired alias, existing variants and no-JS/file use.

The removed panel is a deliberate editorial amendment, not missing content.
The untouched source checkout and evidence retain original identities. Legacy
fallback illustrations still used by the local preview are retired from release;
normal package export remains blocked until T15 replaces them with reviewed
current-scene renders. Native 2D norm output is new and not marked legacy.
No push, deployment or public-checkout synchronization occurs.

Evidence is Chromium software WebGL; physical-device/touch and final poster,
print/wall/export review remain outstanding in T15. “Check every link” is still
unaccepted pending rework. This is not a swept-path or parking-compliance check.


The shared category adapter now supports per-category summary text. It clears
category metadata on suspension to match the host's released model; returning
from a native chart resets selector, model and summary together. Old area-panel
links explicitly open Area share once, then normalize to the current panel ID.

Final evidence: 105 Node tests, 27 Python tests, 25 parking viewport/view states,
110 whole-shell states, 45 planting/storage/tree and 60 stormwater regressions,
and shared-viewer/quick-reference checks. The parking resource loop warms at 139
GPU geometries and stays there for ten replacements. Original source checkout
and the held public checkout remain untouched; no publishable export is produced.

References: [layout desktop](references/parking-t14-model-0-1440.png),
[layout phone](references/parking-t14-model-0-390.png),
[optional accounting](references/parking-t14-model-1-390.png),
[norm comparison](references/parking-t14-norms-390.png).
