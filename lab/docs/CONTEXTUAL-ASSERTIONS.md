# Contextual assertion format 0.2.0

The contextual dataset publishes a small collection of source-backed
assertions and analytical examples. The published JSON Schema sits beside the
dataset at `data/contextual-assertions.schema.v0.2.0.json`. The data catalogue
also links to a Markdown rendering and a test fixture of reference questions.

## Quantities and evidence

| Field | Use |
| --- | --- |
| `quantityMeaning` | Meaning of the quantity, such as clear turning diameter, yard area rate or FAR. A unit of `1` denotes a dimensionless value. FAR specifically requires named numerator and land denominator bases. |
| `quantity.kind` | Scalar, range, one-sided bound, named components or rate. Bounds use `gt`, `gte`, `lt`, or `lte`. The bound operator conveys comparison only. |
| `intervalType` | Separates a source range or prescribed interval from a recommendation interval, uncertainty interval or observed variation. An approximate value carries its own flag. |
| `numerator`, `denominator` | A rate carries explicit numerical factors, units and bases. Its numerator can itself have a range or bound. A child, early-childhood place or impermeable square metre is a distinct denominator. |
| `applicability`, `exception`, `limitation` | Human-readable conditions. Null and omitted values retain unknown or unavailable information. |
| `role`, `evidence` | Distinguish guidance, local targets, example provisions, historical references and calculations. Evidence links resolve through the baseline register or an exact service-space row, with a source edition or retrieval date. |

Typed `relationships` target assertion revisions or measurement dictionary
IDs. A calculation can use `derived_from` to identify its pinned input
revision. Other relationships identify a definition, illustration, an
alternative measurement method, or a difference in geography or application
conditions. `panels`, `evidence` and `example` carry the existing panel,
evidence and calculation connections. The older `relatedAssertionIds` field
remains available for series-level discovery.

The first 15 revisions retain their 0.1.0 fields and meanings. Version 0.2.0
adds annotations, URLs and new assertion records. Consumers with enumerated
roles or quantity variants should use the 0.2.0 schema to read the whole
collection. Existing rulebook JSON and CSV remain available at their
published paths. The new assertions do not change the city model exchange
schema.

## Citation and portability

Cite the assertion series and revision, such as
`wheelchair-turning-clear-diameter/r1`, and the assertion’s `urls.canonical`.
The source document’s `sourceEdition` tracks the evidence version. It may be
null when the edition is unavailable. `sourceRetrieved` records retrieval
where known. The dataset’s `edition` identifies the rulebook software
release. Those dates are independent of the integer assertion revision.

| Location | Resolve against |
| --- | --- |
| `urls.portable` in an assertion or evidence reference | The URL of the contextual JSON itself. The same link works over HTTP and in the extracted archive. |
| `urls.canonical`, `sourceUrl` and the schema `$id` | Already absolute. The canonical assertion URLs open the online evidence page at its revision anchor. |
| Legacy `citationUrl`, `evidenceUrl`, `measurementDictionary`, rulebook panel URLs and questions’ `supportingEvidence` | Site root. For an offline or mirrored copy, resolve `siteRoot` against the containing dataset URL first. `urlBase` identifies the canonical online site root. |
| `schema` in the contextual dataset | The contextual dataset URL. This field names its adjacent schema. |

For example, on the extracted copy `data/contextual-assertions.json` resolves
`../evidence.html#assertion-wheelchair-turning-clear-diameter-r1` to the root
evidence page. The site-root alias reaches that same file via `evidence.html`.
The legacy CSV has site-relative panel links. The catalogue links to the
site root and the sibling JSON declares the base. The service-space data and
measurement dictionary use absolute source or vocabulary URLs.

## Revision integrity

The [revision ledger](../data/knowledge/revision-lock.json) stores SHA-256
digests of deterministic UTF‑8 JSON with sorted keys and compact separators.
It covers each assertion’s semantic fields, source references and complete
embedded calculation example when present. The edition and portable
navigation fields are outside the semantic digest. Formula text, inputs,
scope, limitations and results are inside it. The ledger records the SHA-256
of the live v2026-11-25.2 dataset used to confirm its 15 original revisions.

A changed meaning requires a new revision with `supersedes` and the
previous revision still present. A new example gets a new identifier when
an old assertion cites the previous example. For a reviewed addition,
compute the digest with `revision_hashes` on the generated dataset and append
the new digest. The generation helper can assemble an unlocked draft
explicitly for this review. Normal candidate builds require exact ledger
coverage. The Pages push job also checks that entries inherited from the
previous commit were retained byte for byte as digest strings.

A source locator or cited source edition change is reviewable revision
content. Ordinary navigation path changes are separate and are checked by
the release verifier. The lock depends on trusted repository history and
does not replace review of the source or the measurement method.

## Verification

Run the usual build and release verifier. It exercises a deterministic
consumer from the staged homepage, resolving resources and fragment anchors.
To run the same tests over a development server, pass its homepage URL.

```sh
python3 lab/tests/knowledge_consumer.py http://127.0.0.1:8765/lab/book/
```

The corpus includes no measured hydraulic performance or newly verified
statutory requirement. Source context and the explicit assumptions in the
detention example determine what the figures support.
