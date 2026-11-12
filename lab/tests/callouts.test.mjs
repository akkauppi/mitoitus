import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutCallouts, validateCallouts, leadersIntersect, segmentsIntersect} from '../callouts.js';

const desktop = {bounds: {left: 190, right: 710, top: 70, bottom: 400}, width: 900, height: 480};
const mobile = {bounds: {left: 16, right: 200, top: 90, bottom: 380}, width: 360, height: 460, labelWidth: 92, labelHeight: 32};
function assertLayout(input, result = layoutCallouts(input)) {
  assert.equal(result.status, 'ok', result.reason);
  assert.equal(result.items.length, input.anchors.length);
  assert.deepEqual(validateCallouts(result.items, input), []);
  const ids = result.items.map(item => item.id).sort();
  assert.deepEqual(ids, input.anchors.map(a => a.id).sort());
  for (const item of result.items) {
    assert.equal(item.points.length, 3);
    assert.equal(item.points[0].y, item.points[1].y);
    assert.equal(item.points[2].x, item.x);
    assert.equal(item.points[2].y, item.y);
    assert.ok(Math.abs(item.points[0].x - item.points[1].x) >= 8 - 1e-7);
    assert.ok(item.side === 'left' ? item.label.x + item.label.width < input.bounds.left : item.label.x > input.bounds.right);
  }
  for (const side of ['left', 'right']) {
    const rows = result.items.filter(i => i.side === side).sort((a, b) => a.label.y - b.label.y);
    for (let i = 1; i < rows.length; i++) {
      assert.equal(rows[i].label.x, rows[0].label.x);
      assert.ok(Math.abs(rows[i].label.y - rows[i - 1].label.y - (input.labelHeight || 22) - (input.gap ?? 10)) < 1e-6);
    }
  }
  return result;
}

test('intersection check catches crossings, endpoint touches and collinear overlaps', () => {
  assert.ok(segmentsIntersect({x: 0, y: 0}, {x: 10, y: 10}, {x: 0, y: 10}, {x: 10, y: 0}));
  assert.ok(segmentsIntersect({x: 0, y: 0}, {x: 10, y: 0}, {x: 5, y: 0}, {x: 15, y: 0}));
  assert.ok(segmentsIntersect({x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 0}, {x: 10, y: 5}));
  assert.equal(segmentsIntersect({x: 0, y: 0}, {x: 10, y: 0}, {x: 0, y: 1}, {x: 10, y: 1}), false);
});

test('labels form tidy outside piles with exactly two noncrossing segments', () => {
  assertLayout({...desktop, anchors: [
    {id: 'footway', text: 'Footway', x: 260, y: 120},
    {id: 'cycle', text: 'Cycle track', x: 390, y: 155},
    {id: 'trees', text: 'Trees', x: 530, y: 200},
    {id: 'traffic', text: 'Traffic', x: 650, y: 320},
  ]});
});

test('uses the available right gutter on mobile without dropping anchors', () => {
  const result = assertLayout({...mobile, anchors: [
    {id: 'a', x: 40, y: 130}, {id: 'b', x: 90, y: 190},
    {id: 'c', x: 125, y: 240}, {id: 'd', x: 185, y: 320},
  ]});
  assert.ok(result.items.every(item => item.side === 'right'));
});

test('uses parallel45 degree inner segments when a regular stack fits', () => {
  const input = {width: 700, height: 400, bounds: {left: 100, right: 500, top: 80, bottom: 300},
    anchors: [{id: 'a', x: 470, y: 100}, {id: 'b', x: 470, y: 132}, {id: 'c', x: 470, y: 164}]};
  const result = assertLayout(input);
  assert.equal(result.mode, 'parallel-45');
  for (const item of result.items) {
    const [, elbow, anchor] = item.points;
    assert.ok(Math.abs(Math.abs(elbow.y - anchor.y) - Math.abs(elbow.x - anchor.x)) < 1e-6);
  }
});

test('close, equal-height and coincident anchors remain complete and uncrossed', () => {
  for (const anchors of [
    [{id:'a',x:210,y:200},{id:'b',x:400,y:200},{id:'c',x:690,y:200}],
    [{id:'a',x:210,y:200},{id:'b',x:210.0001,y:200.0001},{id:'c',x:690,y:200}],
    [{id:'a',x:400,y:200},{id:'b',x:400,y:200},{id:'c',x:400,y:200}],
    [{id:'a',x:210,y:75},{id:'b',x:210,y:399},{id:'c',x:690,y:75},{id:'d',x:690,y:399}],
  ]) assertLayout({...desktop, anchors});
});

test('impossible gutters/height produce no crossed or clipped fallback geometry', () => {
  const anchors = [{id:'a',x:100,y:100},{id:'b',x:150,y:120}];
  for (const input of [
    {width:300,height:250,bounds:{left:20,right:280,top:20,bottom:220},anchors},
    {width:800,height:25,bounds:{left:200,right:600,top:0,bottom:25},anchors:anchors.map(a=>({...a,x:a.x+150,y:10}))},
  ]) {
    const result=layoutCallouts(input);assert.equal(result.status,'unavailable');assert.deepEqual(result.items,[]);assert.ok(result.reason);
  }
});

test('independent validator detects a deliberately crossed leader arrangement', () => {
  const first = {x:300,y:250,side:'left',label:{x:14,y:40,width:110,height:22},points:[{x:128,y:51},{x:184,y:51},{x:300,y:250}]};
  const second = {x:300,y:100,side:'left',label:{x:14,y:90,width:110,height:22},points:[{x:128,y:101},{x:184,y:101},{x:300,y:100}]};
  assert.ok(leadersIntersect(first,second));
  assert.ok(validateCallouts([first,second],desktop).some(error=>error.startsWith('leader-intersection')));
});

test('deterministic randomized anchor clouds never return crossed layouts', () => {
  let seed=0x12345678;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  for(let trial=0;trial<180;trial++){
    const config=trial%2?mobile:desktop;
    const anchors=Array.from({length:2+trial%5},(_,i)=>({id:String(i),
      x:config.bounds.left+2+random()*(config.bounds.right-config.bounds.left-4),
      y:config.bounds.top+2+random()*(config.bounds.bottom-config.bounds.top-4)}));
    assertLayout({...config,anchors});
  }
});
