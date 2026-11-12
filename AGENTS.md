# Mitoitus visual experiment

## Product writing — quick reference first

User direction, 13 November 2026: strictly cull AI filler, disclaimers and verbose
explanatory captions. This is a tool to consult quickly, not a page to fill with
small text. Keep the main view to dimensions, formulas, concise labels and brief
practical guidance. Do not narrate the model, repeat the table, or add generic
“not a specification / no guarantee / illustrative only” caveats around it.
Keep necessary source scope, assumptions and artwork/implementation provenance
under Sources and in documentation. Preserve useful source qualifications and
numeric distinctions; express them briefly where needed to interpret a value.
Apply this rule to every new scene and review existing text before adding more.

## Legacy visualization retirement

User direction, 13 November 2026: old 2D illustrations are retired from the
publishable edition, including fallback, print and offline output. Keep originals
in Git history/source preservation only. New native SVG charts are allowed;
they must follow the accepted visual style. Use reviewed renders of current
scenes for static fallbacks. Do not release a package containing legacy figures.
T15 must complete this migration before any publication gate can pass.

## Current release authorization — 13 November 2026

The user explicitly set the goal to finish, test, push and release the rulebook.
This supersedes the earlier local-only hold and task-by-task implementation limit.
Complete T15/T16 and the release corrections before publishing through the existing
GitHub Pages repository. Do not deploy unfinished candidates. No private course
files or original source captures may enter the public repository.

Release corrections: remove the unaccepted “Check every link” panel; rework or
omit unclear stormwater storage; replace every retired illustration in all public
outputs; correct turning-vehicle orientation; use technical headings; distinguish
walking-width contexts; expand sourced residents/services data and remove visuals
that do not help; use square corners throughout the interface.

The baseline at 93bb622 is preserved. Work in `lab/`; retain the existing reference
sheets, evidence, offline packages and CAD unchanged. Do not import the private
course repository or original source captures into this public-source repository.

Read `lab/README.md`, `lab/docs/IMPLEMENTATION-PLAN.md` and `lab/docs/STYLE.md`
before extending the prototype. The original planning-only/task-by-task restriction is superseded by the current
release authorization above.
New illustration assumptions and English editorial text remain assistant drafts.
The user accepted the refined prototype as the visual direction on 12 November
2026. The full-edition layout and recipes are an implementation plan, not
already implemented or separately reviewed panels. Use metric geometry,
label source dimensions separately from contextual assets, and record asset licences.

Make focused commits. Release only the verified public artifact through the existing
repository workflow. Leave the private `/home/antti/cscape/mitoitus/site` mirror alone.

Do not run the existing recursive `build-tools/package_downloads.py` in this
worktree: it would include development files. Follow T01/T15 for explicit
artifact allowlists and isolated candidate output.
