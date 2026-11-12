# Source-link audit — 13 November 2026

Checked the 44 records in canonical `evidence.json`: **42 external source URLs
responded successfully**, and the two local references (`W4`, `W5`) resolve to
`assignment-extract.txt`. No HTTP errors, access restrictions or timeouts were
observed in this bounded check.

Machine-readable observations are in
[`source-link-audit-2026-11-13.json`](../data/source-link-audit-2026-11-13.json).
Each external URL received one GET with `Range: bytes=0-2047`, a 12-second timeout
and redirects enabled; at most six requests ran concurrently. HTTP 200/206 and
reported MIME type establish link reachability, not continuing source authority,
content equivalence, page-fragment validity or a fresh standards review.
The recorded UTC timestamp falls on 12 November; local Helsinki date is 13 November.

## One transport-only update

S10's old `http://production.espoo-cms.finland.wdr.io/…` URL redirects to the
[official Espoo HTTPS PDF](https://admin.espoo.fi/sites/default/files/2021-08/Esteet%C3%B6n%20ymp%C3%A4rist%C3%B6.pdf).
The complete destination PDF was downloaded into memory for hashing:

- HTTP 200; 2,258,465 bytes.
- SHA256 `790826deb23c95102ceb024d70c0a2349b216f22ba11d1a9cc3e9c016a064127`.
- Exact match to canonical S10's retained hash and 6 February 2008 source edition.

[`source-link-updates.json`](../data/source-link-updates.json) contains this single
source-ID mapping with the observed redirect and byte-equivalence evidence.
It is a direct HTTPS destination update, not replacement teaching material.
Canonical `evidence.json` remains unchanged. The release builder should apply the
mapping to the copied evidence register/page and preserve any `#page=…` fragments
when updating direct references. Root owns that integration and final local-link
checks. No other source URL needs a replacement based on this audit.
