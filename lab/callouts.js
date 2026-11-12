/**
 * Screen-space boundary labels for small architectural illustrations.
 *
 * Two segments per leader: a horizontal tail at the text, followed by one
 * segment to the metric anchor. Labels occupy equal-pitch piles outside bounds.
 * Exact common-angle routes are preferred; when those cannot fit, minimum
 * Euclidean matching between anchors and boundary ports produces uncrossed
 * straight leaders. Every returned layout is independently intersection-checked.
 * No camera, DOM, WebGL or Three.js dependency.
 */
const EPS = 1e-7;
const clamp = (x, low, high) => Math.max(low, Math.min(high, x));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const same = (a, b) => distance(a, b) < EPS;

/** Inclusive segment intersection, including collinear overlap and touching. */
export function segmentsIntersect(a, b, c, d) {
  const on = (p, q, r) => Math.abs(cross(p, q, r)) < EPS &&
    r.x >= Math.min(p.x, q.x) - EPS && r.x <= Math.max(p.x, q.x) + EPS &&
    r.y >= Math.min(p.y, q.y) - EPS && r.y <= Math.max(p.y, q.y) + EPS;
  const abC = cross(a, b, c), abD = cross(a, b, d);
  const cdA = cross(c, d, a), cdB = cross(c, d, b);
  if (((abC > EPS && abD < -EPS) || (abC < -EPS && abD > EPS)) &&
      ((cdA > EPS && cdB < -EPS) || (cdA < -EPS && cdB > EPS))) return true;
  return on(a, b, c) || on(a, b, d) || on(c, d, a) || on(c, d, b);
}

/** Shared anchor endpoints are permitted; coincident/overlapping paths are not. */
export function leadersIntersect(first, second) {
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const a = first.points[i], b = first.points[i + 1];
    const c = second.points[j], d = second.points[j + 1];
    if (!segmentsIntersect(a, b, c, d)) continue;
    // Two labels may describe the same projected point. Their final segments
    // may meet at that one anchor, but must approach along different rays.
    if (i === 1 && j === 1 && same(b, d) && Math.abs(cross(a, b, c)) > EPS) continue;
    return true;
  }
  return false;
}

const rectanglesOverlap = (a, b) => a.x < b.x + b.width - EPS &&
  a.x + a.width > b.x + EPS && a.y < b.y + b.height - EPS &&
  a.y + a.height > b.y + EPS;

/** A separate public validator supports renderer/browser regression tests. */
export function validateCallouts(items, {bounds, width, height, padding = 0} = {}) {
  const errors = [];
  for (const [i, item] of items.entries()) {
    const r = item.label;
    if (![r.x, r.y, r.width, r.height, ...item.points.flatMap(p => [p.x, p.y])].every(Number.isFinite)) errors.push(`nonfinite:${i}`);
    if (r.x < padding - EPS || r.y < padding - EPS || r.x + r.width > width - padding + EPS || r.y + r.height > height - padding + EPS) errors.push(`outside-viewport:${i}`);
    if (rectanglesOverlap(r, {x: bounds.left, y: bounds.top, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top})) errors.push(`inside-image:${i}`);
    if (Math.abs(item.points[0].y - item.points[1].y) > EPS) errors.push(`nonhorizontal-tail:${i}`);
    if (!same(item.points[2], item)) errors.push(`wrong-anchor:${i}`);
    for (let j = 0; j < i; j++) {
      if (rectanglesOverlap(r, items[j].label)) errors.push(`label-overlap:${j},${i}`);
      if (leadersIntersect(item, items[j])) errors.push(`leader-intersection:${j},${i}`);
    }
  }
  return errors;
}

// Hungarian minimum-cost perfect matching, O(n³). Infinite routes use a large
// finite sentinel; an impossible assignment is rejected by its caller.
function minimumMatching(cost) {
  const n = cost.length, u = Array(n + 1).fill(0), v = Array(n + 1).fill(0);
  const p = Array(n + 1).fill(0), way = Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const min = Array(n + 1).fill(Infinity), used = Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0]; let delta = Infinity, j1 = 0;
      for (let j = 1; j <= n; j++) if (!used[j]) {
        const value = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (value < min[j]) { min[j] = value; way[j] = j0; }
        if (min[j] < delta) { delta = min[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
        else min[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0 !== 0);
  }
  const assigned = Array(n);
  for (let j = 1; j <= n; j++) assigned[p[j] - 1] = j - 1;
  return assigned;
}

/**
 * @param {object} input anchors [{id,text,x,y}], tight projected image bounds,
 * viewport width/height, and CSS-pixel typography metrics.
 * @returns {{status:string,mode:string,items:Array,reason?:string}}
 * Impossible inputs produce no leader geometry, never a crossed compromise.
 */
export function layoutCallouts({anchors, bounds, width, height,
  labelWidth = 110, labelHeight = 22, gap = 10, padding = 14}) {
  const unavailable = reason => ({status: 'unavailable', mode: 'none', items: [], reason});
  if (!Array.isArray(anchors) || !bounds || ![width, height, labelWidth, labelHeight, gap, padding, ...Object.values(bounds)].every(Number.isFinite)) return unavailable('Invalid screen geometry.');
  if (!anchors.length) return {status: 'ok', mode: 'empty', items: []};
  if (width <= 0 || height <= 0 || labelWidth <= 0 || labelHeight <= 0 || gap < 0 || padding < 0 || anchors.length > 32) return unavailable('Unsupported viewport or label count.');
  if (anchors.some(a => !Number.isFinite(a.x) || !Number.isFinite(a.y))) return unavailable('An anchor has no finite screen position.');
  if (anchors.some(a => a.x < bounds.left - EPS || a.x > bounds.right + EPS || a.y < bounds.top - EPS || a.y > bounds.bottom + EPS)) return unavailable('Anchor outside the illustration bounds.');
  const n = anchors.length, pitch = labelHeight + gap, textGap = 4, minTail = 8, imageGap = 6;
  const leftText = padding + labelWidth + textGap;
  const rightText = width - padding - labelWidth - textGap;
  const rails = {left: bounds.left - imageGap, right: bounds.right + imageGap};
  const available = {left: rails.left - leftText >= minTail, right: rightText - rails.right >= minTail};
  if (!available.left && !available.right) return unavailable('No outside label gutter; reframe the illustration.');
  const capacity = Math.max(0, Math.floor((height - 2 * padding + gap) / pitch));
  if (n > capacity * (Number(available.left) + Number(available.right))) return unavailable('Not enough vertical space for the label piles.');
  const averageY = anchors.reduce((s, a) => s + a.y, 0) / n;
  const splits = [];
  for (let left = 0; left <= n; left++) if ((!left || available.left) && (!(n - left) || available.right) && left <= capacity && n - left <= capacity) splits.push(left);
  // The first offsets prioritize a stable compact pile near the anchors. Small
  // subpixel alternatives break collinear ties without distorting the model.
  const centers = [...new Set([averageY, (bounds.top + bounds.bottom) / 2, height / 2,
    averageY - pitch / 2, averageY + pitch / 2, averageY + 0.371, averageY - 0.617])];
  let best;
  function portsFor(left, center) {
    const ports = [];
    for (const [side, count] of [['left', left], ['right', n - left]]) {
      if (!count) continue;
      const pileHeight = labelHeight + (count - 1) * pitch;
      const top = clamp(center - pileHeight / 2, padding, height - padding - pileHeight);
      for (let j = 0; j < count; j++) {
        const y = top + labelHeight / 2 + j * pitch;
        ports.push({side, x: side === 'left' ? leftText : rightText, y,
          label: {x: side === 'left' ? padding : width - padding - labelWidth,
            y: y - labelHeight / 2, width: labelWidth, height: labelHeight}});
      }
    }
    return ports;
  }
  function candidate(ports, slopes, mode) {
    const routes = anchors.map(a => ports.map(port => {
      let elbowX = rails[port.side];
      if (slopes) {
        elbowX = a.x + (port.y - a.y) / slopes[port.side];
        if (port.side === 'left' ? elbowX < port.x + minTail || elbowX > rails.left : elbowX > port.x - minTail || elbowX < rails.right) return null;
      }
      return {...a, side: port.side, label: {...port.label},
        points: [{x: port.x, y: port.y}, {x: elbowX, y: port.y}, {x: a.x, y: a.y}]};
    }));
    const costs = routes.map(row => row.map(r => r ? distance(r.points[1], r.points[2]) : 1e12));
    const match = minimumMatching(costs), items = match.map((j, i) => routes[i][j]);
    if (items.some(i => !i) || validateCallouts(items, {bounds, width, height, padding}).length) return;
    const length = items.reduce((s, r) => s + distance(r.points[0], r.points[1]) + distance(r.points[1], r.points[2]), 0);
    const displacement = items.reduce((s, r) => s + Math.abs(r.label.y + labelHeight / 2 - r.y), 0);
    const score = length + displacement * .15;
    if (!best || score < best.score) best = {status: 'ok', mode, items, score};
  }
  // Exact common-angle leaders have visual priority over slightly shorter fans.
  for (const left of splits) for (const center of centers) {
    const ports = portsFor(left, center);
    for (const slopes of [{left: 1, right: 1}, {left: -1, right: -1}, {left: 1, right: -1}, {left: -1, right: 1}]) candidate(ports, slopes, 'parallel-45');
  }
  if (best) { delete best.score; return best; }
  // With a shared boundary rail the tails are outside all anchor-to-port
  // segments. A minimum Euclidean perfect matching cannot have a proper
  // crossing: swapping the two destinations would strictly shorten it.
  for (const left of splits) for (const center of centers) candidate(portsFor(left, center), null, 'ordered-fan');
  if (best) { delete best.score; return best; }
  return unavailable('No collision-free two-segment arrangement in the available gutters.');
}
