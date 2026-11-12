# Implementation progress

## T01 complete — 12 November 2026

The isolated baseline candidate and explicit packaging boundary are implemented.
The candidate remains the original reference layout; T02 has not started.

### Build and export

From the worktree root:

```sh
python3 lab/scripts/build-book.py
# After the first build, explicitly replace an intact generated candidate:
python3 lab/scripts/build-book.py --replace
python3 lab/scripts/package-book.py
python3 -m unittest discover -s lab/tests -p 'test_candidate.py' -v
```

Candidate: ignored `lab/book/`; preview at http://localhost:8765/lab/book/ when
the existing local server is running. Offline export:
`lab/.build/rulebook-offline.zip`. Neither command overwrites root HTML, existing
public ZIPs or CAD. The old recursive packager must not be used here.

### Preservation and output guards

- Baseline SHA256, ordered sheet/panel identities, headings, proof links,
  drawing identities/descriptions and every variant label/index/order/count are
  checked against the plan inventory: 11 sheets, 33 panels and 44 drawings;
  walking/cycling/car/bus groups retain 4/5/3/3 choices.
- `parity.json` records all normalized semantic HTML events, including table cells,
  facts, qualifiers, source-visibility classes and inline markup, plus content
  metadata and per-artifact hashes. Only whitespace is normalized.
- Builds preflight inputs, stage in a temporary sibling, compare staged content,
  verify the output and then install it. A failed install restores the previous
  candidate. Temporary staging is removed after handled failures.
- `--replace` requires a verified generated directory. Edited/missing/unapproved
  files and symlinks fail closed. A one-time byte-verified migration supports the
  initial T01 candidate from commit `75c2d3b`.
- Build output is restricted to `lab/book`; exported ZIP to the fixed `.build`
  path. Alternate paths, traversal spellings and symlink ancestors are rejected.
- ZIP members come only from an explicit 53-file allowlist. The old offline ZIP,
  parity report, sources, lab pages, dependencies, logs and review outputs are
  excluded. A newly generated offline archive supplies the candidate's own link.
  Existing public CAD bundles are copied byte-for-byte; those intended CAD ZIPs
  remain included. Archive names, CRCs, contents and a 32 MiB uncompressed budget
  are checked. Output is deterministic for unchanged inputs.

### Verification

18 focused tests passed on 12 November 2026, using temporary repository copies:
content/identity/variant drift; source visibility and numeric changes; repeat
builds; explicit replacement; source/output symlinks; unknown or edited files;
missing sources; staged-content corruption; staging/install/export failures with
recovery; archive allowlist, bytes, size budget and exclusion of rogue files.

The actual candidate was rebuilt successfully with `--replace` and exported.
Archive: 53 files, 429,894 compressed bytes / 1,038,611 uncompressed bytes.
Course check passed: 6 weeks, 38 items, 46 source hashes; weekly exports match.
Baseline root files and the separate published checkout remain unchanged.

Limits: T01 establishes content/build/package behavior, not new visuals or a
browser/print/wall acceptance result. Directory installation uses verified staging
and rename/rollback; it is not a concurrent-build protocol or a promise of a
zero-gap view to simultaneous HTTP readers. Power-loss recovery is not tested.
No push or deployment. Next task: T02 static shell and state.
