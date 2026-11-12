# Quick-reference writing — user amendment

13 November 2026. User requested a strict cull of AI filler and disclaimers, then
asked for this rule near the top of project `AGENTS.md`. It supersedes the previous
practice of displaying recipe explanation paragraphs beneath every live model.

## Current presentation

Main views contain the model, labels/dimensions, controls, numeric tables and brief
practical notes. Equal density and storage retain one compact arithmetic line.
Long scene explanations, section mechanics, repeated case headings, floor-count
cards, duplicate source profiles and illustration assumptions appear only when
Sources is enabled. Control hints appear during interaction, not in every corner.

`book-app.js` owns an explicit `quickNotes` editorial map across the book. It
retains each original paragraph in its original panel with `data-reference-note`
and adds a short `.quick-note` for the main view. Sources displays the original
wording instead. Numeric tables, evidence links and canonical root files are
unchanged; editorial notes are assistant drafts. There is no automatic keyword
filter that might remove a necessary numeric qualification. Existing service
content remains pending its separately recorded rework.

Examples:

- Remove the equal-density paragraph about metric geometry, ground datums,
  assumed heights and what the model does not prove from the main view.
- Keep `512 × 2 = 256 × 4 = 128 × 8 = 1,024 m²` and the floor/coverage labels.
- Replace the planting paragraph with “Check rooting volume separately.”
- Keep useful differences: platform 0.30 m / Helsinki 0.27 m; indoor/outdoor stair
  relations; ATU-based clearance; driving/boom allowances and transfer space.
- Keep specification/source scope and all geometric assumptions inspectable under
  Sources and in the implementation records, without narrating them around models.

## Extension rule

Before adding a caption, ask whether it adds a fact needed to use the reference.
If it repeats the title, dimension, table or model, omit it. If it explains how the
renderer was built or what the drawing does not guarantee, use documentation or
Sources. Keep any necessary practical guidance short, specific and actionable.
Do not add another generic disclaimer paragraph to compensate for a new asset.

Verification: `quick-reference-browser.cjs` checks concise notes, absent visible
filler, source-only duplicate graphics/assumptions, preserved arithmetic, Sources
switching and direct-file presentation. Whole-shell source parity compares original
paragraphs after removing only explicit presentation copies/attributes. Focused
landscape checks independently compare canonical facts and original figures.
