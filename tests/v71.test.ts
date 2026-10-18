import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA, cameraOffset, cameraZoom } from '../src/game/camera';
test('camera framing enlarges arena while adapting to aspect',()=>{
  assert.equal(cameraZoom(16/9),1);assert.ok(cameraZoom(1)>cameraZoom(16/9));
  assert.ok(CAMERA.baseY<20&&CAMERA.baseZ<21);assert.ok(CAMERA.maxOffset<1);
});
test('camera follow is gentle, bounded and stronger only during dash',()=>{
  const a=cameraOffset(3,0),b=cameraOffset(3,0,true),c=cameraOffset(-9,9);
  assert.ok(a.x>0&&b.x>a.x);assert.ok(Math.hypot(c.x,c.z)<=CAMERA.maxOffset+.0001);assert.ok(Math.abs(a.z)<.001);
});
