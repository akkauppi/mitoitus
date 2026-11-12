# Evidence for the diorama studies

Recorded 12 November 2026. Assistant-drafted implementation notes, using the
existing rulebook's evidence register and sheet generator at baseline `93bb622`.
No new dimensional standard or teaching content is adopted by these studies.
Source editions and draft status are retained. This is a local visual experiment;
the published reference sheets remain unchanged.

The claim IDs below link to the existing [evidence page](../evidence.html).
Exact source metadata, retrieval dates and preserved-file hashes are in
[evidence.json](../evidence.json). Diagram implementation is in
[build_sheets.py](../build-tools/build_sheets.py). These source observations were
recorded by the existing project on 12 November 2026; this note does not claim
an additional live-source verification.

## 01 — Walking, cycling, planting and a traffic lane

| Element | Study dimension | Existing claim and source | Interpretation to preserve |
| --- | --- | --- | --- |
| Footway | 2.5 m | [walking](../evidence.html#walking), S01, Espoo 2010 printed p. 18, §5.1 / [PDF p. 19](https://admin.espoo.fi/sites/default/files/2021-08/Espoo_Katupoikkileikk_suun_ohje_kansineen_liitteineen.pdf#page=19) | Basic total footway width; not the SuRaKu clear-passage value. |
| Two-way cycle track | 2.5 m | [cycling](../evidence.html#cycling), S09, Helsinki May 2014 printed p. 19 / [PDF p. 22](https://www.hel.fi/static/hkr/julkaisut/ohjeet/katutila_mitoitus.pdf#page=22) | Lower end of the 2.5–4 m main-route range at footway level; walking and roadside separation are additional. |
| Tree planting strip | 3.0 m | [ground](../evidence.html#ground), S01, Espoo 2010 printed p. 19 / [PDF p. 20](https://admin.espoo.fi/sites/default/files/2021-08/Espoo_Katupoikkileikk_suun_ohje_kansineen_liitteineen.pdf#page=20) | Source minimum tree-strip width, not proof of sufficient soil volume. Main-street tree strips have a separate ≥3.5 m value. |
| Single traffic lane | 3.0 m | [car-turn](../evidence.html#car-turn), S01, Espoo 2010 printed p. 16 / [PDF p. 17](https://admin.espoo.fi/sites/default/files/2021-08/Espoo_Katupoikkileikk_suun_ohje_kansineen_liitteineen.pdf#page=17) | Existing rulebook uses the lower end of the 3.0–3.25 m local-collector range. The bus-governing case is ≥3.25 m. |

The four widths sum to **11.0 m**. This is an assistant-composed visual example
juxtaposing independent dated source cases, **not a sourced complete 11 m street
section** or a site recommendation. Keep the planting strip between the cycle
track and traffic lane: Helsinki's cycle case requires a roadside strip of at
least 1 m, enlarged for snow. The planting strip provides visible separation in
this illustrative composition; its width alone does not validate winter storage,
rooting space, visibility, access, drainage or any complete street design.

Longitudinal length, pavement and display-plinth thickness, tree positions and
asset placement are illustration assumptions. Do not dimension them as prescribed
construction details. The original traffic-lane drawing uses an illustrative
18 m length, but this is not a minimum length requirement for the 3D study.

## 02 — A tram stop

| Element | Study dimension | Existing claim and source | Interpretation to preserve |
| --- | --- | --- | --- |
| Side platform | 3.5 m each | [tram-width](../evidence.html#tram-width), S26, [regional tram guide §2.4](https://raitiotieohje.fi/2-4-raitiotiepysakit/) | Normal side-platform width; shelters, waiting and clear passage fit within it. |
| Track zone between platforms | 5.5 m | [tram-width](../evidence.html#tram-width), S27, [Raitiotien mitoitus kadulla](https://kaupunkiliikenne.fi/raitiotien-mitoitus-kadulla/) | Straight dedicated double-track case between platforms. |
| Combined width | 12.5 m | [tram-width](../evidence.html#tram-width) | Derived 3.5 + 5.5 + 3.5 m, before outer routes and buffers; not full street width. |
| Flat platform service area | 45 m | [tram-length](../evidence.html#tram-length), S26, [regional tram guide §2.4](https://raitiotieohje.fi/2-4-raitiotiepysakit/) | Normal light-rail flat service area. Ramps and crossing waiting areas are additional. |
| Tram body plan | 34 × 2.4 m | [tram-length](../evidence.html#tram-length), S35, [Kalusto, table 1](https://kaupunkiliikenne.fi/kalusto/) | Nominal five-part Artic XL body in the guide; joint/window details are illustrative. The body is not an ATU clearance envelope. |

If platform height is drawn to scale, the existing source gives generally **0.30 m
above rail**, with **0.27 m normally in Helsinki**. State the context used. The
existing full-stop example assumes a 0.30 m rise from adjacent ground and 5%
ramps, giving 6 m at each end and 57 m total before crossing waiting areas.
A 45 m long diorama should therefore represent only the flat service-area
segment, not a complete accessible stop with its approaches.

Do not infer tram height, window sizes, wheels, bogie spacing or articulation
lengths from the cited body plan. Any such modeled detail is illustrative.
If rails are drawn at a claimed gauge or track-centre distance, use the separate
existing [tram-corridor](../evidence.html#tram-corridor) evidence and retain its
network and alignment context; decorative rail placement is not new engineering
evidence. Platform furniture placement is a visual composition, not a checked
passenger-space or circulation calculation.

## 03 — Rooting volume

| Element | Study dimension | Existing claim and source | Interpretation to preserve |
| --- | --- | --- | --- |
| Conventional growing medium | Approximately 25 m³ | [trees](../evidence.html#trees), S19, [Helsinki tree/tram card](https://kaupunkitilaohje.hel.fi/kortti/katupuut-raitioliikenne-mitoitusohje/), 8 May 2024, “Puiden kasvualustan mitoitus” | Publisher-marked **draft**, contextual indicative volume for a large-growing tree, not a universal minimum. |
| Illustrated volume | 5 × 5 × 1 m = 25 m³ | [trees](../evidence.html#trees), existing rulebook drawing | Assistant-selected equal-scale geometry showing volume; **not a prescribed planting-pit shape or depth**. |
| Continuous rooting conditions | No new dimension | S20, [Helsinki Kasvualustat](https://kaupunkitilaohje.hel.fi/kortti/kasvualustojen-laatuvaatimukset-2/), and S04, [Katu- ja puistopuut](https://kaupunkitilaohje.hel.fi/kortti/katu-puistopuut-uusi/) | Coordinate mature crown, connected growing space, groundwater and utilities; grouped trees benefit from continuous soil. |

Keep the 1 m depth on the same metric scale as the 5 m plan dimensions. A ground
cutaway can expose this volume without implying that all depicted layers are
construction specifications. The source's separate 40–60 m³ structural-soil
discussion is not interchangeable with 25 m³ conventional soil.

Tree height, crown width, species, root shape and relationship between a particular
depicted tree and this volume are illustration assumptions. A small stylized tree
must not imply that the approximate source volume is calibrated to that tree's
shown maturity.

## Shared scale assets and provenance

- **People:** 1.75 m tall is the existing rulebook's declared illustration
  assumption, retained under [walking](../evidence.html#walking). It is not a
  population percentile or accessible-clearance envelope. Posture and proportions
  are illustrative. The existing light-grey treatment is a user-approved graphic
  convention, not a dimensional source.
- **Car:** preserve the existing **5.0 × 1.8 m body plan**, S36,
  [Helsinki Hietalahdenranta drawing, PDF p. 37](https://www.hel.fi/static/liitteet/kaupunkiymparisto/asuminen-ja-ymparisto/kaavoitus/LMA_VSU_WSP.pdf#page=37),
  drawing dated 11 December 2020. Use 5.0 m rather than an invented 4.8 m if
  presenting the model as this existing reference car. Height, wheelbase,
  wheels, mirrors and detailing are illustration assumptions; its body does not
  validate a swept path. The W4 restriction on long-term private-car parking
  remains unchanged.
- **Bicycle:** existing [bike-parking](../evidence.html#bike-parking) uses
  **0.6 × 2.0 m**, with **1.2 m typical height**, S29,
  [Helsinki bicycle-parking guide](https://pyoraliikenne.hel.fi/pyorapysakointi/pyorapysakointi-yleisilla-alueilla/).
  These are reference envelopes; shape, equipment and movement clearances vary.
- **Tram:** retain the 34 × 2.4 m body plan above. Height and decorative details
  require explicit assumption provenance rather than a new source claim.
- **Trees, benches and display ground:** dimensions not listed above are visual
  assumptions. Keep their metric values in the asset catalogue and distinguish
  them from cited dimensions. A tree's crown geometry does not demonstrate
  maintained clearances or future mature size.

Every proposed scene remains assistant-drafted. No new student task, dimensioning
obligation, legal-compliance claim or publication approval follows from this
visual iteration.
