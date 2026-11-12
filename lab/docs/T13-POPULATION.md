> Historical T13 implementation record. The 13 November release supersedes the
> resident tiles, library square and service cards; see [SERVICES-RELEASE.md](SERVICES-RELEASE.md).

# T13 — Population, distances and service measures

13 November 2026 · local implementation · assistant artwork/editorial draft.
Panels `density`, `green-hierarchy`, `services`; original claim/figure IDs retained.

## User amendments and resulting graphics

User requested the same outlined pastel visual language with people on areas and
distances as circles between objects, allowing a smaller part of a hectare.
This supersedes the planned-only straight-bar treatment and prohibition on circle
references in SCENES-01-06. All three graphics remain native SVG; no WebGL, camera,
3D bars or imported assets are needed. `population_editorial.py` builds the graphics
into the isolated candidate, so they also work offline and without JavaScript.

**Density:** four identical area-equivalent tiles represent 0.4 ha (4,000 m²).
Historical TKK 2007 examples remain approximately 30 / 50 / 75 / 100 residents/ha.
Their direct illustrative counts are 12 / 20 / 30 / 40. Figures are symbolic
pictograms, not metre-height scale people; every tile has the same geometry and
symbol size. A deterministic five-by-eight placement grid has no duplicate slots.
Counts use only the supplied resident-density examples, never the FAR table.
Desktop uses two columns; the classic shell rearranges the native SVG as one
column on phones. The original four-row eₐ/eₖ/eₜ table and denominator definitions
are unchanged. There is no occupancy calculator or population inferred from e.

**Green hierarchy:** 50 / 150 / 500 m circles share one radius scale, with a home
symbol and numbered tags. User rejected both attempted leader layouts; the final
graphic has no leader lines, and uses a matching 1/2/3 key below the circles.
Circle positions are a distance reference, not a mapped street network or computed
service area. The main note keeps actual walking-route checks. All eight source
provision rows, residential-floor-area bases, minima, hectares and 3–10 km route
length remain unchanged. The historical hierarchy/RAMS distinction remains in
Sources as the original paragraph.

**Library:** the new outlined area tile is a 10 × 10 m = 100 m² useful-area
equivalent. It has no doors, programme, building height or library floor-plan claim.
The approximately 100 m² / 1,000 residents ratio stays separate from the other cases.

## Residents & services: substantive content review

Reviewed against the unchanged evidence register and original source paragraphs:

| Case | Measure | Historical scope retained |
| --- | --- | --- |
| Library | ~100 m² useful floor area / 1,000 residents | S23, Ministry 2010 recommendation; small municipalities may need more per resident |
| School + daycare | >2,000 **additional** residents | S25, Seinäjoki 2017 local growth/capacity trigger; nearby schools already full |
| Health-station unit | ~20,000 residents, population responsibility | S24, Helsinki 2020 **proposal** for an additional central-city unit |

These are now three separate cards headed “Space provision · Ministry 2010”,
“Local growth trigger · Seinäjoki 2017”, and “Proposed responsibility · Helsinki
2020”. No shared numerical chart suggests comparable service thresholds. All
original dl entries and full original qualifiers survive inside those cards;
short main-view notes retain the substantive local conditions, and Sources shows
the original paragraphs. The library square is not used to dimension school or
health facilities. No new threshold, catchment, standard or resident estimate is
introduced. New headings/shortened notes are assistant editorial changes.

This resolves the recorded T13 content/structure blocker locally: the denominators,
additional population versus case responsibility, local capacity condition, dates
and proposal status are explicit. It does not authorize publication or establish
that these historical examples are current standards. Original root source files,
evidence URLs/hashes and the original tables remain intact.

## Legacy-visual retirement: separate release blocker

User also retired the old 2D illustrations from the publishable edition, including
fallback, print and offline use. The rule is now high in project AGENTS.md. These
three new SVG illustrations are replacements, not the old versions recoloured.
Other old source illustrations still in the **local preview** are explicitly marked
`data-legacy-visual`. Candidate metadata declares publicationReady=false and
legacyFallbackReplacementPending=true. The normal package exporter refuses them;
legacy offline links are withheld from the menu, footer and Sources banner.

T15 must generate reviewed renders of current scenes and replace every retired
fallback/print illustration before release. Original figures are preservation inputs
and Git history, not approved release assets. `allow_legacy_preview=True` exists
only for archive plumbing tests; the command-line export provides no such bypass.
No legacy-containing export is represented as publishable. Prior documentation
saying to export the current ZIP is superseded by this retirement gate.

## Verification and remaining limits

`test_population.py` verifies resident arithmetic/unique symbols, common distance
radius scale, the 100 m² area equivalent, and byte-identical original tables/dl
entries plus full historical qualifiers in the transformed panel. Candidate tests
also cover the default export rejection and retained archive safeguards.

`population-browser.cjs` checks 15 panel/viewport states at 320/390/768/1024/1440 px:
actual symbol counts and equal projected area tiles; proportional circle radii;
three numbered tags and keys with no leaders; native SVG text clipping/overlap;
all density/hierarchy rows and service conditions; square metric axes; camera
normalization, URL preservation, Sources switching and navigation; no-JS and file
fallback. Direct opening these panels imports no Three.js and creates no canvas.

The full book regression compares original details after unwrapping only the
explicit service-card containers/headings and quick-reference copies. New SVGs
are deliberately tested against the numeric/source contract, not required to
match the retired illustration geometry. Existing scene source-preservation tests
ignore only the legacy-retirement marker.

Evidence is headless Chromium; no physical-device or finished print/wall review
is claimed. T15 owns replacement posters and the new retirement gate. “Check every
link” remains unaccepted pending rework, and publication/deployment remains on hold.

Final evidence: 25 Python tests (candidate safeguards + population arithmetic/source
checks); 15 responsive native-panel states; 110 whole-shell states; 45 landscape
and 60 stormwater regression states; quick-reference prose checks. The public
checkout is still clean at `93bb622`. The last pre-T13 local export was renamed
`retired-rulebook-offline-pre-t13.zip` inside the ignored build directory; no current
publishable export is produced while retired fallback markers remain.

Current captures: [density phone](references/population-t13-density-390.png),
[density desktop](references/population-t13-density-1440.png),
[numbered hierarchy](references/population-t13-green-hierarchy-390.png),
[service measures](references/population-t13-services-1440.png).
