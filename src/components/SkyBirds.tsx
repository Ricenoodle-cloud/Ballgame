import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../game/store';
import { BIRD_FLOCK, birdFlight, flockWindow, wingBeat } from '../game/birds';
function birdGeometry(){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-.28,0,0,.28,0,0,0,.1,-.18, 0,.1,-.18,.28,0,0,.82,.12,.04, 0,.1,-.18,-.28,0,0,-.82,.12,.04],3));
  g.setIndex([0,1,2,3,4,5,6,7,8]);g.computeVertexNormals();return g;
}
export function SkyBirds(){
  const flock=useRef<THREE.Group>(null),wings=useRef<THREE.Group[]>([]),geo=useMemo(birdGeometry,[]),mat=useMemo(()=>new THREE.MeshStandardMaterial({color:'#f3eee6',roughness:.72,metalness:.05,transparent:true,opacity:.84}),[]);
  useFrame(()=>{
    const s=useGame.getState(),w=flockWindow(s.elapsed),group=flock.current;if(!group)return;
    const visible=s.status==='playing'&&w.active;group.visible=visible;if(!visible)return;
    group.children.forEach((bird,i)=>{const p=birdFlight(s.elapsed,i,w.cycle);bird.position.set(p.x,p.y,p.z);bird.rotation.z=p.bank;const wing=wings.current[i];if(wing)wing.rotation.z=wingBeat(s.elapsed,i);});
    if(import.meta.env.DEV)Object.assign(window,{__orbitBirds:{active:visible,cycle:w.cycle,count:BIRD_FLOCK.count}});
  });
  return <group ref={flock} name="distant-geometric-birds" visible={false}>{Array.from({length:BIRD_FLOCK.count},(_,i)=><group key={i}><mesh geometry={geo} material={mat} scale={.7+i%3*.12}/><group ref={el=>{if(el)wings.current[i]=el}}><mesh geometry={geo} material={mat} rotation={[0,Math.PI,0]} position={[0,.01,0]} /></group></group>)}</group>;
}
