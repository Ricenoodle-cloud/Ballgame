import { test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG, HOLES } from '../src/game/config';
import { FENCE, fenceSegments } from '../src/game/fence';
import { createArenaGeometry } from '../src/game/arenaGeometry';
import { BombSchedule, bombInterval } from '../src/game/bombSchedule';
import { FLOWERS, createPetalGeometry, flowerOpenness, PETAL_LAYERS } from '../src/game/flowers';
await RAPIER.init();
function world(sealWells=false){
 const w=new RAPIER.World({x:0,y:CONFIG.gravity,z:0});w.timestep=CONFIG.step;
 const g=createArenaGeometry(),pos=new Float32Array(g.attributes.position.array),idx=Uint32Array.from({length:pos.length/3},(_,i)=>i);
 w.createCollider(RAPIER.ColliderDesc.trimesh(pos,idx));g.dispose();
 // Isolate fence stress from legitimate rebounds into a well. The separate
 // well regression below uses the unchanged real perforated platform.
 if(sealWells)for(const h of HOLES)w.createCollider(RAPIER.ColliderDesc.cylinder(.45,CONFIG.holeRadius+.02).setTranslation(h.x,-.45,h.z));
 for(const s of fenceSegments()){
  w.createCollider(RAPIER.ColliderDesc.cuboid(s.halfLength,FENCE.height/2,FENCE.halfThickness)
   .setTranslation(s.x,FENCE.height/2-.04,s.z).setRotation({x:0,y:Math.sin(s.rotation/2),z:0,w:Math.cos(s.rotation/2)}).setRestitution(.3));
 }
 return w;
}
function ball(w:RAPIER.World,x:number,z:number,mass=1){
 const body=w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,.5,z).setCcdEnabled(true));
 w.createCollider(RAPIER.ColliderDesc.ball(CONFIG.radius).setMass(mass).setRestitution(.32),body);return body;
}
test('continuous fence blocks CCD player and target at segment centers and joins under dash/blast-speed impacts',()=>{
 for(let i=0;i<24;i++){
  const w=world(true),a=(i*4+(i%2?.5:0))*Math.PI*2/FENCE.segments;
  const b=ball(w,Math.cos(a)*7.2,Math.sin(a)*7.2,i%2?CONFIG.targetMass:1);
  b.setLinvel({x:Math.cos(a)*22,y:i%2?1:0,z:Math.sin(a)*22},true);
  for(let j=0;j<240;j++){
   if(j>70)b.applyImpulse({x:Math.cos(a)*CONFIG.force*CONFIG.step,y:0,z:Math.sin(a)*CONFIG.force*CONFIG.step},true);
   w.step();assert.ok(Math.hypot(b.translation().x,b.translation().z)<8.5,`ball must stay inside closed ring: case ${i}, step ${j}, position ${JSON.stringify(b.translation())}`);
  }
  assert.ok(b.translation().y>.4,'no fall outside platform');w.free();
 }
});
test('fence does not close any physical colored well',()=>{
 const w=world(),bodies=HOLES.map(h=>ball(w,h.x,h.z));
 for(let i=0;i<180;i++)w.step();bodies.forEach(b=>assert.ok(b.translation().y<-2));w.free();
});
test('bomb schedule has grace period, 8/7/6 second jittered cadence, minimum and single active cap',()=>{
 const clock=new BombSchedule();assert.equal(clock.poll(5.999,0),false);
 assert.equal(clock.poll(6,0,()=>.5),true);assert.equal(clock.nextAt,14);
 assert.equal(clock.poll(14,1),false);assert.equal(clock.nextAt,14);
 assert.equal(clock.poll(14,0,()=>.5),true);assert.equal(clock.nextAt,22);
 for(const [time,base] of [[0,8],[50,7],[100,6],[1000,6]])for(const random of [0,.5,1]){
  const dt=bombInterval(time,()=>random);assert.ok(dt>=5&&Math.abs(dt-base)<=.351);
 }
});
test('paused game time preserves bomb deadline; fresh schedule resets grace',()=>{
 const clock=new BombSchedule();clock.poll(6,0,()=>.5);
 const deadline=clock.nextAt;for(let i=0;i<100;i++)assert.equal(clock.poll(9,0),false);
 assert.equal(clock.nextAt,deadline);assert.equal(clock.poll(14,0,()=>.5),true);
 assert.equal(new BombSchedule().nextAt,6);
});
test('white flowers stay outside playable disk; curved petal mesh is volumetric and finite',()=>{
 for(const f of FLOWERS)assert.ok(Math.hypot(f.x,f.z)-1.5*f.scale>CONFIG.arenaRadius);
 const g=createPetalGeometry();g.computeBoundingBox();const size=g.boundingBox!.getSize(new Vector3());
 assert.ok(size.z>.15&&size.x>.5&&size.y>.8);
 for(const value of g.attributes.position.array)assert.ok(Number.isFinite(value));
 const far=createPetalGeometry(6,4);far.computeBoundingBox();assert.ok(far.boundingBox!.getSize(new Vector3()).z>.15);
 assert.ok(g.index!.count/3*40+far.index!.count/3*126<12000,'decorative petal triangle budget');
 far.dispose();g.dispose();
});
import {Vector3} from 'three';
test('layered opening is smooth, asynchronous, holds for two seconds and loops in 13.6 seconds',()=>{
 assert.equal(PETAL_LAYERS.length,3);
 assert.equal(flowerOpenness(4.5),1);assert.equal(flowerOpenness(6.5),1);
 assert.equal(flowerOpenness(11),.16);assert.equal(flowerOpenness(13.6),.16);
 assert.notEqual(flowerOpenness(2),flowerOpenness(2,3));
 assert.notEqual(flowerOpenness(2,0,0),flowerOpenness(2,0,.55));
 for(let i=0;i<1360;i++){
  const a=flowerOpenness(i*.01),b=flowerOpenness(i*.01+.001);
  assert.ok(Math.abs(a-b)<.001);assert.ok(a>=.1599&&a<=1);
 }
});
test('balls slide along the fence and can move back inward without getting trapped at joins',()=>{
 const w=world(true),b=ball(w,8.1,0);
 b.setLinearDamping(2.1);b.setAngularDamping(1.6);
 b.setLinvel({x:1,y:0,z:3},true);
 for(let i=0;i<180;i++){
  const p=b.translation(),r=Math.hypot(p.x,p.z);
  b.applyImpulse({x:(-p.z/r*12+p.x/r*2)*CONFIG.step,y:0,z:(p.x/r*12+p.z/r*2)*CONFIG.step},true);w.step();
 }
 const start=b.translation();assert.ok(start.z>2,'can slide along several fence segments');
 for(let i=0;i<150;i++){
  const p=b.translation(),r=Math.hypot(p.x,p.z);
  b.applyImpulse({x:-p.x/r*CONFIG.force*CONFIG.step,y:0,z:-p.z/r*CONFIG.force*CONFIG.step},true);w.step();
 }
 assert.ok(Math.hypot(b.translation().x,b.translation().z)<7.8,'inward input releases ball from fence');w.free();
});
