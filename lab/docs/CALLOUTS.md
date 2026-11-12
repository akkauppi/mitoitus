# Outside callouts

Version 0.1 · 12 November 2026 · local visual study.

The user requested labels outside the illustration in orderly piles, two-segment
leaders, aligned directions at the text, preferably aligned inner directions,
no crossed leaders, and a dot at each illustration anchor. This document records
the shared implementation and its limits. It does not change the dimensional
content, source evidence or metric assets.

## Responsibilities

- `scenes.js` supplies each short label and its metric anchor. Scene authors do
  not position labels in pixels or write their own leader routing.
- `viewer.js` projects anchors and illustration bounds, reserves screen space,
  asks for a new layout after camera/viewport changes, and renders SVG.
- `callouts.js` is a pure JavaScript screen-space solver. It depends on neither
  Three.js nor the DOM, making its geometry independently testable.
- `lab.css` supplies the leader, dot and text appearance. Typography stays in
  CSS pixels while the metric scene remains unchanged.

Dimension lines retain their separate annotation system. The callout solver
routes scene-label leaders; it does not reroute dimension lines.

## Geometry and appearance

Each returned label occupies a rectangular slot in a left or right pile. Slots
on a side share their text edge and use the same pitch: `labelHeight + gap`.
The label-side segment is horizontal. Every leader contains exactly three
points—text edge, elbow, anchor—giving two straight segments. The renderer ends
it with a filled circle of radius 2.6 CSS pixels at the anchor.

“Aligned” text-side segments means parallel horizontal directions and a common
text edge. Different rows cannot literally lie on the same infinite horizontal
line. The inner segments use a common 45° direction within each pile when a
valid arrangement fits. Otherwise they fan toward the anchors while preserving
horizontal tails, stack alignment and the no-intersection rule.

The solver may change pile membership and label order as the camera rotates.
It makes a deterministic layout for identical inputs. Arbitrary temporal
animation between two valid layouts is not used: interpolated leaders could
cross between frames even if both endpoint layouts are valid.

## API

```js
import {layoutCallouts, validateCallouts} from './callouts.js';

const result = layoutCallouts({
  anchors: [
    {id: 'walk', text: 'Footway', x: 250, y: 140},
    {id: 'cycle', text: 'Cycle track', x: 420, y: 230},
  ],
  bounds: {left: 190, right: 710, top: 70, bottom: 400},
  width: 900,
  height: 480,
  labelWidth: 110,
  labelHeight: 24,
  gap: 16,
  padding: 14,
});
```

All coordinates and sizes are CSS pixels. `bounds` is the rectangle occupied by
the visible illustration, not the whole viewport. Every supplied anchor must be
inside it. The solver does not project, clamp or silently move metric anchors.

A successful result has this form:

```js
{
  status: 'ok',
  mode: 'parallel-45', // or 'ordered-fan'; 'empty' for no anchors
  items: [{
    id: 'walk', text: 'Footway', x: 250, y: 140,
    side: 'left',
    label: {x: 14, y: 120, width: 110, height: 24},
    points: [textEdge, elbow, anchor] // each point is {x, y}
  }]
}
```

The example shape above illustrates the API, not a specific solver result.
`label.x/y` is the top-left corner. `points[0].y` is the row's vertical centre;
the renderer applies its text baseline offset separately. The solver allocates
boxes but does not measure, shorten or wrap text. Keep scene labels short or
provide measured box dimensions and matching wrapping in the renderer.

Unavailable layouts return:

```js
{status: 'unavailable', mode: 'none', items: [], reason: '…'}
```

This can mean insufficient outside gutters, insufficient height, invalid
coordinates, anchors outside the supplied image bounds, or no valid arrangement
among the candidate stacks. No crossed, clipped or partially dropped substitute
is returned. A caller should reframe the illustration or increase the drawing
area, then retry; it must not describe an unavailable result as a successful
complete callout layout. The current viewer reserves adequate gutters in normal
views and exposes status through `#overlay.dataset.calloutStatus` for tests.

The implementation accepts at most 32 labels per call. The current studies use
at most four. More labels warrant a separately reviewed density/interaction
policy instead of merely shrinking the text.

## Routing method and no-crossing reasoning

1. Determine which outside gutters can hold the label width, text gap, horizontal
   tail and separation from the illustration. Reject insufficient vertical
   capacity before routing.
2. Construct candidate equal-pitch piles using all valid left/right label-count
   splits. Candidate vertical centres follow the anchors and illustration, with
   small deterministic alternatives for degenerate arrangements.
3. First try exact ±45° inner segments. Their elbows may move within the gutter;
   candidate assignments are accepted only after full intersection validation.
4. If no exact-angle layout fits, place elbows on a shared boundary rail per
   side. Solve a minimum-total-Euclidean-length matching between anchors and
   these fixed elbow ports using the Hungarian algorithm.
5. Validate every selected layout independently. Check finite coordinates,
   viewport containment, labels outside the image, label separation, horizontal
   tails, unchanged anchor endpoints, and every pair of leader segments.

The matching fallback has a useful geometric property. If two straight
anchor-to-port segments properly cross, swapping their destination ports makes
their combined length strictly shorter by the triangle inequality. Therefore a
minimum-length perfect matching cannot contain such a proper crossing. Every
anchor can match every port, so that swap is permitted. The horizontal tails lie
outside the rails, while all inner segments remain between the rails; tails
cannot cross inner segments in this fallback. Tail lengths are fixed per port,
so omitting them from matching cost does not change the optimal assignment.

Collinear overlaps, coincident endpoints and floating-point degeneracies need
more than that proof. The explicit inclusive intersection checker catches these
cases and rejects the layout. Two final segments may meet at one shared anchor
when separate labels describe the same projected point, provided they approach
along different rays rather than overlap. This is a shared endpoint, not a
crossing. A failed candidate never relaxes the intersection rule.

The guarantee is precise: **every returned successful layout has nonintersecting
callout leader segments under the geometric validator, except permitted shared
anchor endpoints.** It is not a guarantee that every possible input has a valid
layout. It also does not guarantee clearance from dimension annotations, scene
objects, projected shadows, or the finite painted thickness of another dot.
Those are separate visual-design checks. The algorithm uses a small numeric
tolerance for coordinate comparisons.

## Current responsive integration

`viewer.js` fits projected bounding boxes of individual mesh parts, including
space for dimension offsets. It does not distort or resize individual assets.
When callouts are enabled:

| Viewport width | Reserved framing margins | Callout slot |
| --- | --- | --- |
| At least 650 px | 148 px left and right | 110 × 24 px; 16 px gap; 14 px padding |
| Below 650 px | 18 px left, 124 px right | 92 × 24 px; 12 px gap; 8 px padding |

The right-side-only arrangement on narrow displays preserves room for the model.
The solver detects available sides from the supplied bounds, so it needs no
mobile-specific routing implementation.

During zoom, a CSS clip-path keeps the WebGL canvas out of the text gutters:
148 px on each side at desktop widths, or 124 px on the right on narrow displays.
The bounds supplied to the solver are the intersection of projected image bounds
and that visible region. Only anchors inside the visible bounds and camera
projection range are supplied. An offscreen anchor does not create a misleading
clamped dot at the frame edge. This visibility filter is geometric clipping; it
is not a depth-buffer occlusion test for anchors behind other objects.

Turning off scene labels removes the canvas clipping and reserved callout space.
The ordinary dimension list remains available beside the scene. SVG export
wraps the exported model geometry in an SVG clipPath matching these gutters,
then appends the callout groups outside that clip. Paths, circles and screen-space
text remain vector elements.

## Verification and extension

From `lab/`:

```sh
node --test tests/callouts.test.mjs
npm test
PLAYWRIGHT_MODULE=/home/antti/cityscape-cam/node_modules/playwright node tests/browser.cjs
```

The browser check requires the local preview at `127.0.0.1:8765` and an available
Playwright installation; the path above is this machine's existing installation.
No network service or external asset is used by the solver.

The eight focused solver tests cover outside equal-pitch stacks, exact 45°
routing, one-sided mobile space, equal-height/near/coincident anchors, explicit
crossing detection, unavailable geometry and 180 deterministic randomized anchor
clouds with two to six labels. The integrated browser review reported 81
scene/style/view/viewport combinations, 48 orbit cases, and 15 narrow-screen zoom
steps passing with all four street callouts routed. These are
bounded checks, not a claim that every possible camera state or browser was
exhaustively tested. Current review evidence belongs in `REVIEW.md`.

When adding another scene, supply metric anchors and concise label text; reuse
this solver. Add adversarial projected layouts if a new kind of arrangement
fails. Preserve the invariant that a failed layout triggers reframing or an
explicit unavailable state, rather than a crossed leader or an invented anchor.
