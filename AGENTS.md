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

The current task is local only: commits are allowed; do not push, deploy, publish,
or synchronize this branch to a hosted service. This instruction supersedes prior
publication permission for the duration of the visual iteration.

The baseline at 93bb622 is preserved. Work in `lab/`; retain the existing reference
sheets, evidence, offline packages and CAD unchanged. Do not import the private
course repository or original source captures into this public-source repository.

Read `lab/README.md`, `lab/docs/IMPLEMENTATION-PLAN.md` and `lab/docs/STYLE.md`
before extending the prototype. The current handoff is planning only; implement
the bounded tasks only when assigned implementation by the user.
New illustration assumptions and English editorial text remain assistant drafts.
The user accepted the refined prototype as the visual direction on 12 November
2026. The full-edition layout and recipes are an implementation plan, not
already implemented or separately reviewed panels. Use metric geometry,
label source dimensions separately from contextual assets, and record asset licences.

Make focused local commits. Do not automatically propagate experiments to
`/home/antti/mitoitus-public` or `/home/antti/cscape/mitoitus/site`.

Do not run the existing recursive `build-tools/package_downloads.py` in this
worktree: it would include development files. Follow T01/T15 for explicit
artifact allowlists and isolated candidate output.
