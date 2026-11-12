# Standalone offline ZIP acceptance

13 November 2026 · passed against the actual distributed archive, extracted into
an owned temporary directory. The browser read no files from the source checkout.

Archive: `downloads/rulebook-offline.zip` — 182 files, 9,596,892 uncompressed bytes,
4,437,085 ZIP bytes. Candidate and staged release archives have the same SHA-256:

```text
eec6def844047637e7e511eb470d37ccb3309978c3a29177b61228605ef9fab9
```

| Check | Direct `file://` | Isolated HTTP |
| --- | --- | --- |
| Five category controls; selection retained on reload | Passed | Passed |
| Four legacy variant controls; selection retained on reload | Passed | Passed |
| Sources toggle and walking evidence fragment | Passed | Passed |
| CAD unit selection and actual `tram-ft.dxf` download | Identical bytes | Identical bytes |
| Current visualization | Static poster fallback | Walking variant and parking category in 3D |
| Unavailable ZIP self-download | Absent | Absent |

The run checked 858 local link occurrences. There were no external requests,
missing HTTP files or JavaScript errors. The archive does not contain itself.
External evidence links remain available as links; the test blocks external
requests and does not fetch their destinations. One successful direct-file CAD
download produced Chromium's expected `ERR_ABORTED` navigation handoff; it is
accepted only after the downloaded bytes match the extracted CAD file.

Run from the repository root after building the archive:

```sh
node lab/tests/offline-release-browser.cjs
```

The runner uses Python's standard-library ZIP reader, the existing Playwright
installation and an automatically allocated loopback HTTP port. `OFFLINE_ZIP`
selects another archive, `OFFLINE_PORT` can select a fixed port, and
`PLAYWRIGHT_MODULE` overrides the Playwright installation. It deletes its temporary
extraction/server after the run and writes machine-readable results to
`lab/review/offline-release-results.json`.
