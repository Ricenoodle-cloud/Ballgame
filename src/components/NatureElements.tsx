import { useContext, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bodies } from './Balls';
import { useGame } from '../game/store';
import { audio } from '../game/audio';
import { BUTTERFLY_LIFE, butterflyFlight, GRASS, inNatureRange, PUDDLES, WATER_TRACE_LIFE } from '../game/nature';

const TRACE_CAP=56, BUTTERFLY_CAP=16;
function puddleShape(){const s=new THREE.Shape();for(let i=0;i<12;i++){const a=i*Math.PI*2/12,r=1+(i%3)*.08;s[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}s.closePath();return new THREE.ShapeGeometry(s);}
function grassGeometry(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.1,.8,0,-.05,.15,.02, 0,0,0,-.1,.72,.02,.05,.15,0],3));g.setIndex([0,1,2,3,4,5]);g.computeVertexNormals();return g;}
export function NatureElements(){
  const registry=useContext(Bodies),puddles=useRef<THREE.Group[]>([]),grass=useRef<THREE.Group[]>([]),traces=useRef<THREE.Group[]>([]),butterflies=useRef<THREE.Group[]>([]);
  const wetUntil=useRef(0),traceData=useRef<{x:number;z:number;born:number;angle:number}[]>([]),traceAt=useRef(0),puddleInside=useRef<boolean[]>([]),grassInside=useRef<boolean[]>([]),grassReady=useRef(GRASS.map(()=>0)),swarm=useRef<{born:number;x:number;z:number;index:number}[]>([]),swarmSlot=useRef(0),session=useGame(s=>s.session);
  const puddleGeo=useMemo(puddleShape,[]),bladeGeo=useMemo(grassGeometry,[]),waterMat=useMemo(()=>new THREE.MeshBasicMaterial({color:'#a9cbd0',transparent:true,opacity:.38,depthWrite:false}),[]),bladeMat=useMemo(()=>new THREE.MeshStandardMaterial({color:'#91ad9b',roughness:.9,side:THREE.DoubleSide}),[]),butterflyMat=useMemo(()=>new THREE.MeshBasicMaterial({color:'#f3e4c4',transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}),[]);
  useEffect(()=>()=>{puddleGeo.dispose();bladeGeo.dispose();waterMat.dispose();bladeMat.dispose();butterflyMat.dispose();},[puddleGeo,bladeGeo,waterMat,bladeMat,butterflyMat]);
  useEffect(()=>{traceData.current=[];swarm.current=[];wetUntil.current=0;},[session]);
  useFrame(({clock})=>{
    const s=useGame.getState(),rb=registry.player,now=s.elapsed;
    if(s.status!=='playing'||!rb){traces.current.forEach(g=>g.visible=false);butterflies.current.forEach(g=>g.visible=false);return;}
    const pos=rb.translation(),speed=Math.hypot(rb.linvel().x,rb.linvel().z);
    PUDDLES.forEach((p,i)=>{const inside=inNatureRange(pos.x,pos.z,p,p.r);if(inside&&!puddleInside.current[i]){wetUntil.current=Math.max(wetUntil.current,now+WATER_TRACE_LIFE);audio.menuClick();const ripple=puddles.current[i];if(ripple){ripple.scale.setScalar(1.2);ripple.userData.born=now;}}puddleInside.current[i]=inside;});
    if(now<wetUntil.current&&speed>.08&&now-traceAt.current>.08){traceAt.current=now;traceData.current.unshift({x:pos.x,z:pos.z,born:now,angle:Math.atan2(rb.linvel().x,rb.linvel().z)});traceData.current=traceData.current.slice(0,TRACE_CAP);}
    traces.current.forEach((g,i)=>{const t=traceData.current[i];if(!t||now-t.born>WATER_TRACE_LIFE){g.visible=false;return;}g.visible=true;g.position.set(t.x,.035,t.z);g.rotation.y=t.angle;g.scale.setScalar(.55*(1-(now-t.born)/WATER_TRACE_LIFE));((g.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.22*(1-(now-t.born)/WATER_TRACE_LIFE);});
    puddles.current.forEach(g=>{const born=g.userData.born as number|undefined;if(born===undefined)return;const age=now-born;if(age>1){g.scale.setScalar(1);delete g.userData.born;}else g.scale.setScalar(1+Math.sin(age*Math.PI)*.22);});
    GRASS.forEach((p,i)=>{const inside=inNatureRange(pos.x,pos.z,p,.72);if(inside&&!grassInside.current[i]&&now>=grassReady.current[i]){grassReady.current[i]=now+12;for(let j=0;j<3;j++){swarm.current[swarmSlot.current++%BUTTERFLY_CAP]={born:now,x:p.x,z:p.z,index:j+i*3};} }grassInside.current[i]=inside;const g=grass.current[i];if(g)g.rotation.z=Math.sin(now*.7+i*1.7)*(inside?.1:.035);});
    butterflies.current.forEach((g,i)=>{const b=swarm.current[i];if(!b||now-b.born>BUTTERFLY_LIFE){g.visible=false;return;}const q=butterflyFlight(now-b.born,b.index,{x:b.x,z:b.z});g.visible=true;g.position.set(q.x,q.y,q.z);g.rotation.y=Math.sin(now*1.4+b.index)*.35;g.rotation.z=Math.sin(now*2.4+b.index)*.12;g.scale.setScalar(.16);((g.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.8*q.opacity;});
    if(import.meta.env.DEV)Object.assign(window,{__orbitNature:{wet:now<wetUntil.current,traces:traceData.current.length,butterflies:swarm.current.filter(b=>now-b.born<BUTTERFLY_LIFE).length}});
  });
  return <group name="geometric-natural-interactions">
    {PUDDLES.map((p,i)=><group key={`puddle-${i}`} ref={g=>{if(g)puddles.current[i]=g}} position={[p.x,.026,p.z]} rotation={[-Math.PI/2,0,0]}><mesh geometry={puddleGeo} scale={p.r} material={waterMat}/><mesh geometry={puddleGeo} scale={p.r*.55} position={[.16,.002,.08]} material={waterMat}/></group>)}
    {Array.from({length:TRACE_CAP},(_,i)=><group key={`trace-${i}`} ref={g=>{if(g)traces.current[i]=g}} visible={false}><mesh><ringGeometry args={[.12,.16,6]} /><meshBasicMaterial color="#a9cbd0" transparent opacity={.2} depthWrite={false}/></mesh></group>)}
    {GRASS.map((p,i)=><group key={`grass-${i}`} ref={g=>{if(g)grass.current[i]=g}} position={[p.x,.03,p.z]}>{[0,.18,-.18].map((x,j)=><mesh key={j} geometry={bladeGeo} material={bladeMat} position={[x,0,j*.03]} rotation={[0,j*.7-.3,0]} scale={[.8+j*.1,.65+j*.1,1]}/>)}</group>)}
    {Array.from({length:BUTTERFLY_CAP},(_,i)=><group key={`butterfly-${i}`} ref={g=>{if(g)butterflies.current[i]=g}} visible={false}><mesh geometry={bladeGeo} material={butterflyMat} rotation={[0,0,Math.PI/2]}/></group>)}
  </group>;
}
