import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, HOLES, initialBalls, sampleDisk, safeBombPoint } from '../src/game/config';
import { sanitizeAudioSettings, musicStep, MUSIC_STEPS, MUSIC_BPM } from '../src/game/audio';
test('circular target and bomb sampling preserves radial clearance and hole safety',()=>{
 for(let i=0;i<100;i++){
  for(const b of initialBalls(32))assert.ok(Math.hypot(b.position[0],b.position[2])<=CONFIG.arenaRadius-CONFIG.edgeMargin);
  const p=safeBombPoint();assert.ok(Math.hypot(p.x,p.z)<=CONFIG.arenaRadius-CONFIG.bombRadius-.5);
  for(const h of HOLES)assert.ok(Math.hypot(h.x-p.x,h.z-p.z)>CONFIG.holeRadius+CONFIG.bombRadius+.2);
 }
});
test('disk sampler distributes area uniformly rather than concentrating at center',()=>{
 let seed=4789;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 let sum=0;for(let i=0;i<10000;i++){const p=sampleDisk(1,random);sum+=p.x*p.x+p.z*p.z;}
 assert.ok(Math.abs(sum/10000-.5)<.02);
});
test('original music has four distinct phrases, deterministic seamless score wrapping and level-two variation',()=>{
 assert.ok(MUSIC_BPM>=65&&MUSIC_BPM<=85);
 const phrases=Array.from({length:4},(_,p)=>JSON.stringify(Array.from({length:64},(_,i)=>musicStep(p*64+i,1))));
 assert.equal(new Set(phrases).size,4);
 for(let i=0;i<MUSIC_STEPS;i++)assert.deepEqual(musicStep(i,1),musicStep(i+MUSIC_STEPS,1));
 assert.notDeepEqual(musicStep(6,1),musicStep(6,2));
});
test('audio settings sanitize persistent values without changing independent toggles',()=>{
 const s=sanitizeAudioSettings({musicEnabled:false,sfxEnabled:true,musicVolume:5,sfxVolume:-2});
 assert.deepEqual(s,{musicEnabled:false,sfxEnabled:true,musicVolume:1,sfxVolume:0});
 assert.equal(sanitizeAudioSettings({musicVolume:NaN}).musicVolume,.32);
});
