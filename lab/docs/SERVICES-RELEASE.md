# Residents and services — release content revision

13 November 2026 · assistant-drafted English synthesis.

The user requested substantially more useful residents/services data and removal
of unnecessary population/service imagery. This revision supersedes the resident
tiles, library square and three-card service treatment described in
[T13-POPULATION.md](T13-POPULATION.md). The numbered green-distance circles remain.
The original root HTML, evidence register, source originals and CAD are preserved.

## Public reference tables

`density` contains the four existing TKK 2007 population examples as a semantic
table: approximately 30, 50, 75 and 100 residents/ha. The original eₐ/eₖ/eₜ table
and its denominator definitions remain unchanged. The two tables are separate:
floor-area ratio is not converted to residents or service demand.

`services` now contains 12 rows grouped into daycare, school and library tables.
Each row identifies its locality or project, date, denominator and necessary
qualification. This is a collection of dated references; no new national standard
or general residents-per-school threshold has been inferred.

| Source | Main reference values | Interpretation retained |
| --- | --- | --- |
| [R01 Helsinki, 2023](https://paatokset.hel.fi/fi/asia/hel-2023-003751/bd0b59f4-3825-43dc-9d74-eb1c19d5aeb0?decision=bd0b59f4-3825-43dc-9d74-eb1c19d5aeb0) | Daycare ~8.25 m² floor area/child simultaneously present; yard 10–15 m²/child | The report describes planning practice. Its area term is *huoneistoala*, excluding kitchens and technical rooms. Dense inner-city exceptions apply to yards. The displayed meeting deferred the motion, so this is not presented as a newly adopted resolution. |
| [R02 Espoo, 2023](https://espoo.oncloudos.com/cgi/DREQUEST.PHP?id=2023883-4&page=meetingitem) | Daycare play yard 15 m²/place; school usable yard 7 m²/pupil; hall 20 × 33 m with 8 m clear height; field 46–51 × 61–70 m within ~500 m | First two are municipal targets cited in the Postipuu assessment. Hall/field are named Postipuu project choices. Hall ancillary rooms are additional. The distance is school-to-field, not a school catchment. |
| [R03 Kauniainen, 2023](https://kauniainen10fi.oncloudos.com/cgi/DREQUEST.PHP?id=2023375-12&page=meetingitem) | New school 7.2–8 useful m²/pupil; gross area ~1.5 × useful area | New-school investment-study targets. Gross/useful factor belongs to this study. Capacity is based on pupil forecasts, not a general share of total residents. |
| [R04 Tampere, 2025/rev. 2026](https://tampereentilapalvelut.fi/wp-content/uploads/2026/01/TRE_Paivakotien-suunnitteluohje_2025-revA.pdf#page=17) | Daycare play yard 20 m²/child; ≥15 m² where target difficult in built urban surroundings; contiguous ≥6 × 10 m activity area | Design guide dated 17 November 2025, revised 8 January 2026, p.17 §§3.9.2–3.9.3. The activity space is inside the yard, not an additional per-child allowance. |
| [R05 Ministry, 2010](https://www.kirjastot.fi/sites/default/files/content/OKM20.pdf) | Library ~100 useful m²/1,000 residents; urban benchmark 80% within 2 km | Area recommendation is p.55, with greater per-resident needs possible in small municipalities. Access is an **older 2001–04 benchmark** reproduced on p.26, explicitly dated in the table. Neither gives a minimum population for an individual branch. |

## Evidence and editorial boundaries

The machine-readable source is [release-data.json](../data/release-data.json).
Every row has a stable ID, numerical values, units, source ID, context, kind and
qualification. Each source records the exact URL, edition, locator, retrieval
date, content type, byte length and SHA-256 of the retrieved primary source.
R05 is the same PDF and hash as baseline source S23. Captures used for verification
remain outside the repository and public artifact.

The builder reads reviewed local JSON without network requests. Generated
`evidence.html#services-release` lists definitions and links to primary sources;
generated `data/release-data.json` provides the data and source metadata. The
original `#services` evidence gets a link to the supplement. Existing `.proof`
anchors retain panel IDs, so `evidence.html#services` remains the panel proof URL.

The Seinäjoki 2017 example (>2,000 **additional** residents with nearby schools
already full) and Helsinki 2020 health-station proposal (~20,000 residents of
population responsibility) remain in their original wording under Sources and in
baseline evidence. They are local historical cases, not useful universal service
thresholds. The original library details also remain under Sources. No healthcare
population rule or projected enrolment has been invented.

Only the green hierarchy retains a drawing. Its 50 / 150 / 500 m circles share
one radius scale and keep numbered tags and keys. All eight original provision
rows, floor-area denominators, minima, hectares and route-length ranges remain.
The circles do not calculate route distance or network catchments.

## Verification contract

`test_population.py` verifies stable identities; all 12 rows and source mappings;
the Helsinki concurrent-presence denominator; Kauniainen useful/gross distinctions;
Postipuu project scope; the older library-access date; original details/table
preservation; common hierarchy radius scale; source retrieval hashes; and evidence
append-only behavior without canonical-file changes.

`population-browser.cjs` checks the three panels at 320, 390, 768, 1024 and 1440 px.
It checks semantic table content, absence of decorative density/service drawings,
readable table containment, green-circle labels, Sources visibility/reset,
keyboard focus through Explore, supplemental evidence links, no-JS/direct-file
fallback and absence of unnecessary 3D imports. It writes review captures and
results to a temporary directory by default.

Release verification on 13 November 2026: all seven focused Python tests and all
15 Chromium panel/viewport states passed. The 390 px and 1440 px service views
and 390 px density view were also inspected visually. Captures and the browser
result record are in `/tmp/mitoitus-population-release`; this is desktop browser
evidence, not physical-device testing.

The source review establishes the content of these dated publications; it does
not assert they are the latest policies in every municipality. The main table
keeps dates and local scope visible so each reference can be read correctly.
