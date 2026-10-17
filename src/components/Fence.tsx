import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { FENCE, fenceSegments } from '../game/fence';
const POSTS=40;
export function Fence(){
  const segments=useMemo(fenceSegments,[]);
  const posts=useRef<THREE.InstancedMesh>(null),caps=useRef<THREE.InstancedMesh>(null),rails=useRef<THREE.InstancedMesh>(null);
  useEffect(()=>{
    const dummy=new THREE.Object3D();
    for(let i=0;i<POSTS;i++){
      const a=i*Math.PI*2/POSTS,front=Math.sin(a)>.2,h=front?.66:.93;
      dummy.position.set(Math.cos(a)*FENCE.radius,h/2,Math.sin(a)*FENCE.radius);
      dummy.rotation.set(0,-a,0);dummy.scale.set(.13,h,.13);dummy.updateMatrix();posts.current!.setMatrixAt(i,dummy.matrix);
      posts.current!.setColorAt(i,new THREE.Color(i%3===0?'#e2cfb1':'#f0e3cd'));
      dummy.position.y=h+.025;dummy.scale.set(.145,.09,.145);dummy.updateMatrix();caps.current!.setMatrixAt(i,dummy.matrix);
      const mid=a+Math.PI/POSTS,railH=Math.sin(mid)>.2?.5:.73;
      for(let row=0;row<2;row++){
        dummy.position.set(Math.cos(mid)*FENCE.radius,row===0?.23:railH,Math.sin(mid)*FENCE.radius);
        dummy.rotation.set(0,Math.PI/2-mid,0);dummy.scale.set(2*FENCE.radius*Math.sin(Math.PI/POSTS)+.06,.075,.075);
        dummy.updateMatrix();rails.current!.setMatrixAt(i*2+row,dummy.matrix);
      }
    }
    for(const mesh of [posts.current,caps.current,rails.current])if(mesh){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();}
  },[]);
  return <group name="geometric-vine-fence">
    <RigidBody type="fixed" colliders={false} name="continuous-fence">
      {segments.map((s,i)=><CuboidCollider key={i} position={[s.x,FENCE.height/2-.04,s.z]} rotation={[0,s.rotation,0]} args={[s.halfLength,FENCE.height/2,FENCE.halfThickness]} friction={.25} restitution={.3} />)}
    </RigidBody>
    <instancedMesh ref={posts} args={[undefined,undefined,POSTS]} castShadow><cylinderGeometry args={[1,1,1,6]} /><meshStandardMaterial roughness={.85} color="#fff8ed" /></instancedMesh>
    <instancedMesh ref={caps} args={[undefined,undefined,POSTS]}><sphereGeometry args={[1,6,3]} /><meshStandardMaterial color="#efe0c5" roughness={.8} /></instancedMesh>
    <instancedMesh ref={rails} args={[undefined,undefined,POSTS*2]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#d7c09d" roughness={.85} /></instancedMesh>
    <Vines />
  </group>;
}
function Vines(){
  const leaves=useRef<THREE.InstancedMesh>(null);
  const stems=useMemo(()=>Array.from({length:6},(_,i)=>{
    const angle=i*Math.PI/3+.2;
    const pts=Array.from({length:13},(_,j)=>{
      const a=angle+(j/12-.5)*.2,r=FENCE.radius+.1*Math.sin(j*.8);
      return new THREE.Vector3(Math.cos(a)*r,.18+j/12*.5+Math.sin(j)*.04,Math.sin(a)*r);
    });
    return {geometry:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.018,4,false),points:pts};
  }),[]);
  useEffect(()=>()=>stems.forEach(s=>s.geometry.dispose()),[stems]);
  const dummy=useMemo(()=>new THREE.Object3D(),[]);
  useFrame(({clock})=>{
    stems.forEach((s,i)=>{for(let j=0;j<6;j++){
      const p=s.points[j*2+1];dummy.position.copy(p);dummy.rotation.set(.4+Math.sin(clock.elapsedTime*.7+i+j)*.035,i+j*.7,.4);dummy.scale.set(.095,.18,.045);dummy.updateMatrix();leaves.current?.setMatrixAt(i*6+j,dummy.matrix);
    }});
    if(leaves.current)leaves.current.instanceMatrix.needsUpdate=true;
  });
  return <group name="sparse-sage-vines">
    {stems.map((s,i)=><mesh key={i} geometry={s.geometry}><meshStandardMaterial color="#91a892" roughness={.9} /></mesh>)}
    <instancedMesh ref={leaves} args={[undefined,undefined,36]} frustumCulled={false}><octahedronGeometry args={[1,0]} /><meshStandardMaterial color="#a0bca7" roughness={.85} /></instancedMesh>
  </group>;
}
