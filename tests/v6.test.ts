import test from 'node:test';
import assert from 'node:assert/strict';
import { FENCE, FENCE_MATERIAL, fenceAssistImpulse } from '../src/game/fence';
import { BIRD_FLOCK, birdFlight, flockWindow, wingBeat } from '../src/game/birds';
test('elastic fence has bounded inward seam assistance',()=>{
  assert.ok(FENCE_MATERIAL.restitution>=.55&&FENCE_MATERIAL.restitution<=.7);
  const a=fenceAssistImpulse(FENCE.radius-.4,0,2,0);assert.ok(a.x<0&&Math.abs(a.x)<=.7);
  assert.deepEqual(fenceAssistImpulse(0,0,0,0),{x:0,z:0});
});
test('bird flock appears on a calm staggered schedule',()=>{
  assert.equal(flockWindow(7.99).active,false);assert.equal(flockWindow(8).active,true);
  assert.equal(flockWindow(21).active,false);assert.equal(flockWindow(36).active,true);
  const a=birdFlight(10,0,0),b=birdFlight(10,1,0);assert.notEqual(a.z,b.z);assert.notEqual(wingBeat(1,0),wingBeat(1,1));
  assert.equal(BIRD_FLOCK.count,6);
});
