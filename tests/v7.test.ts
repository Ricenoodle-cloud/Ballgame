import test from 'node:test';
import assert from 'node:assert/strict';
import { GRASS, PUDDLES, WATER_TRACE_LIFE, BUTTERFLY_LIFE, butterflyFlight, safeNaturePoint } from '../src/game/nature';
test('geometric nature decorations stay sparse, playable and outside wells',()=>{
  assert.ok(PUDDLES.length>=3&&PUDDLES.length<=5);assert.ok(GRASS.length>=4&&GRASS.length<=7);
  for(const p of PUDDLES)assert.ok(safeNaturePoint(p.x,p.z,p.r));
  for(const p of GRASS)assert.ok(safeNaturePoint(p.x,p.z));
  assert.ok(WATER_TRACE_LIFE>=4&&WATER_TRACE_LIFE<=6);assert.ok(BUTTERFLY_LIFE>=3&&BUTTERFLY_LIFE<=5);
});
test('butterfly flight rises and fades without physics',()=>{
  const a=butterflyFlight(0,1,{x:0,z:0}),b=butterflyFlight(2,1,{x:0,z:0}),c=butterflyFlight(BUTTERFLY_LIFE,1,{x:0,z:0});
  assert.ok(b.y>a.y);assert.ok(b.opacity>c.opacity);assert.ok(Number.isFinite(b.x+b.z));
});
