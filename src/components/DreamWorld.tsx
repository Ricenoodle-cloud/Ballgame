import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
function Arch({position,scale=1,color='#d9bfd0'}:{position:[number,number,number];scale?:number;color?:string}){
  return <group position={position} scale={scale}>
    {[-1,1].map(x=><mesh key={x} position={[x,1,0]} castShadow><boxGeometry args={[.4,2,.55]} /><meshStandardMaterial color={color} roughness={.9} /></mesh>)}
    <mesh position={[0,2,0]}><torusGeometry args={[1,.2,8,48,Math.PI]} /><meshStandardMaterial color={color} roughness={.9} /></mesh>
    <mesh position={[0,-.15,0]}><boxGeometry args={[2.8,.3,1.1]} /><meshStandardMaterial color="#dfcdbf" /></mesh>
  </group>;
}
export function DreamWorld(){
  const floating=useRef<THREE.Group>(null),motes=useRef<THREE.Group>(null);
  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    floating.current?.children.forEach((c,i)=>{c.position.y=Math.sin(t*.3+i)*.3;c.rotation.y=t*.035+i;});
    motes.current?.children.forEach((c,i)=>{c.position.y=-1+Math.sin(t*.2+i)*1.2;c.rotation.z=t*.1;});
  });
  return <group>
    {/* All buildings are outside the playable disk and have no colliders. */}
    <Arch position={[-13,-2,-7]} scale={1.2} />
    <Arch position={[12,-3,-9]} scale={1.5} color="#b9cad0" />
    <Arch position={[0,-3,-15]} scale={1.1} color="#d8c9e0" />
    {[[-12,-2,4],[13,-3,3],[-6,-4,-15],[7,-4,-15]].map(([x,y,z],i)=><group key={i} position={[x,y,z]}>
      <mesh castShadow><cylinderGeometry args={[.5,.65,3+i%2,6]} /><meshStandardMaterial color={i%2 ? '#c2d5cf' : '#dbc4cf'} roughness={.9} /></mesh>
      <mesh position={[0,1.8,0]}><boxGeometry args={[1.5,.2,1.5]} /><meshStandardMaterial color="#f1e3cf" /></mesh>
    </group>)}
    <group position={[-12,-3,-11]} rotation={[0,-.3,0]}>{Array.from({length:7},(_,i)=><mesh key={i} position={[i*.65,i*.3,0]} castShadow><boxGeometry args={[.7,.25,1.7]} /><meshStandardMaterial color="#e0c8cd" /></mesh>)}</group>
    <group ref={floating}>{[[-11,1,-3],[11,-1,-3],[-10,-2,8],[10,-2,8],[-4,0,-13],[5,-2,-13]].map(([x,y,z],i)=><group key={i}><mesh position={[x,y,z]} rotation={[.2,i,.3]}><boxGeometry args={[.6+i%2*.4,.6+i%2*.4,.6+i%2*.4]} /><meshStandardMaterial color={i%2 ? '#d7c8e1' : '#d8bda3'} roughness={.7} /></mesh></group>)}</group>
    <group ref={motes}>{Array.from({length:36},(_,i)=>{const a=i*2.399,r=10+i%5*1.2;return <group key={i}><mesh position={[Math.cos(a)*r,0,Math.sin(a)*r]}><octahedronGeometry args={[.025+i%3*.01]} /><meshBasicMaterial color="#fff5d3" transparent opacity={.65} /></mesh></group>;})}</group>
    {/* Translucent horizontal veils suggest distant cloud layers. */}
    {[-8,-11].map((y,i)=><mesh key={y} rotation={[-Math.PI/2,0,0]} position={[0,y,-12]}><circleGeometry args={[28+i*10,96]} /><meshBasicMaterial color={i ? '#ece1ed' : '#f0e5df'} transparent opacity={.28} depthWrite={false} /></mesh>)}
  </group>;
}
