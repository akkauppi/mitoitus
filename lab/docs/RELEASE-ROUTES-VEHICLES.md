# Route labels and turning orientation — 13 November 2026

Focused release corrections requested by the user. Existing source dimensions
and metric assets are unchanged. Root agent owns integration and publication.

## Turning-reference direction

The car and bus assets face local +Z. The former +90° rotation made their noses
face +X, perpendicular to the quarter-annulus entry tangent. The bodies now face
−Z, aligned to that tangent at the band's mean radius. A 1 m illustrative gap
keeps each body detached from the reference band. A sparse direction arrow follows
the analytic tangent farther around the arc. Body-length dimensions now follow Z.

The geometric radius references remain 3/6.5 m and 8.1/15.2 m. Body plans remain
5 × 1.8 m and 15 × 2.6 m. Alignment and the arrow do not represent a computed
vehicle swept path. The source/assumption metadata records this distinction.

## Walking quantity labels

Existing evidence claim `walking` distinguishes Espoo 2010's 2.5 m basic footway
from SuRaKu 2008's unobstructed widths: 1.5 m passage, 1.8 m wheelchair passing and
2.3 m machine maintenance. No new standard or numeric amendment is introduced.

`WALKING_CASES` and `routeCaseInfo()` now expose the purpose and source context.
Callouts read **Total footway**, **Clear passage**, **Passing width**, and
**Maintenance**, while retaining the common comparison frame and all values.

Proposed main copy for the release editorial layer:

> Footway width is the full path. Clear width is the unobstructed passage.

Proposed specification labels, with existing values:

| Label | Value |
| --- | --- |
| Basic footway · total width | 2.5 m |
| Unobstructed passage | ≥1.5 m |
| Wheelchair passing · clear width | ≥1.8 m |
| Machine maintenance · clear width | ≥2.3 m |

Detailed edition references remain under Sources. The root agent owns these
HTML/table amendments and the registry's use of the new recipe metadata.

## Evidence

- `node --test lab/tests/vehicles.test.mjs lab/tests/routes.test.mjs`: 19 tests
  passed. Added checks measure asset noses against analytic entry tangents,
  arrow tangency, detached gap, body dimensions and the four width purposes.
- `node lab/tests/vehicles-routes-release-browser.cjs`: 24 camera/viewport states
  passed at 1440 and 390 px. All requested callouts are present; leader validation,
  text overlap, clipping and page-overflow checks passed.
- Browser test uses the existing candidate shell and intercepts only its two
  recipe module responses with current source files. It does not rebuild the
  candidate or prove the final packaged release has these changes.
- Inspected car Plan, bus oblique phone and clear-passage Front phone renders.
  Selected references: [car orientation](references/release-car-tangent-plan.png),
  [clear-passage label](references/release-clear-passage-phone.png).

Observed follow-up items outside these recipe changes: the fixed phone gutter
leaves a small model in a tall frame, especially for the long bus; the car's front
windscreen sits low relative to its cabin slope, weakening the nose cue in Plan.
These were reported to the root agent for the wider visual review. No independent
physical-device or engineering-compliance check is claimed.
