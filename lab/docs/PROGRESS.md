# Implementation progress

## T01 started — 12 November 2026

Added an isolated baseline candidate builder and semantic parity checkpoint.
It checks the baseline SHA256 and ordered 11 sheets / 33 panels / 44 drawings,
then copies an explicit public file list into ignored `lab/book/`. All HTML
structure, attributes and normalized text are compared after copying. Existing
output, alternate output paths and symlinked output are rejected.

Checks: candidate build passed; three focused guard/parity tests passed.
Preview: http://localhost:8765/lab/book/ (baseline layout at this stage).

Remaining T01 work: explicit variant-option audit, safe repeat-build workflow,
atomic staging, archive-content regression and a candidate packager that avoids
nesting the old offline ZIP. No new package was produced. T02 has not started.
The existing lab and published checkout remain available. No push/deployment.
