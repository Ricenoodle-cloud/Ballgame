import { useContext, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bodies } from './Balls';
import { useGame } from '../game/store';
import { COLORS } from '../game/config';
import { PORTAL, portalAt } from '../game/portal';
export function PrismaticPortal(){
  const registry=useContext(Bodies),group=useRef<THREE.Group>(null),prev=useRef(new Map<string,{x:number;z:number}>()),awarded=useRef(new Set<string>()),lastCycle=useRef(-1),lastVisible=useRef(false);
  const mat=useMemo(()=>new THREE.MeshStandardMaterial({transparent:true,opacity:.96,roughness:.28,metalness:.12,emissiveIntensity:1.15,side:THREE.DoubleSide}),[]);
  useFrame(()=>{const s=useGame.getState(),g=group.current;if(!g)return;const cycle=Math.floor(Math.max(0,s.elapsed-PORTAL.first)/(PORTAL.duration+PORTAL.cooldown));const phase=s.elapsed<PORTAL.first?-1:(s.elapsed-PORTAL.first)%(PORTAL.duration+PORTAL.cooldown);const active=s.status==='playing'&&phase<PORTAL.duration;if(cycle!==lastCycle.current){lastCycle.current=cycle;awarded.current.clear();prev.current.clear();}const p=portalAt(Math.max(0,cycle));g.visible=active;g.position.set(p.x,.04,p.z);mat.color.set(COLORS[p.color]);mat.emissive.set(COLORS[p.color]);mat.emissiveIntensity=.3;
    if(active!==lastVisible.current){lastVisible.current=active;useGame.setState({portal:{active,color:p.color,x:p.x,z:p.z,expires:s.elapsed+PORTAL.duration}});}
    if(active){registry.targets.forEach((rb,id)=>{const q=rb.translation(),old=prev.current.get(id);if(old&&((old.z<p.z&&q.z>=p.z)||(old.z>p.z&&q.z<=p.z))&&Math.abs(q.x-p.x)<PORTAL.width/2&&!awarded.current.has(id)){awarded.current.add(id);useGame.getState().portalScore(id,p.color,p.x,p.z);}prev.current.set(id,{x:q.x,z:q.z});});}
    if(import.meta.env.DEV)Object.assign(window,{__orbitPortal:{active,color:p.color,remaining:active?PORTAL.duration-phase:0}});
  });
  return <group ref={group} name="prismatic-geometric-portal" visible={false}><mesh position={[-.82,1.05,0]}><boxGeometry args={[.16,2.1,.18]}/><primitive object={mat} attach="material"/></mesh><mesh position={[.82,1.05,0]}><boxGeometry args={[.16,2.1,.18]}/><primitive object={mat} attach="material"/></mesh><mesh position={[0,2.05,0]}><boxGeometry args={[1.8,.16,.18]}/><primitive object={mat} attach="material"/></mesh><mesh position={[0,.05,0]}><boxGeometry args={[1.8,.12,.18]}/><primitive object={mat} attach="material"/></mesh></group>;
}
