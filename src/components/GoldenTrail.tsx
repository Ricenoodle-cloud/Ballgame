import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGame } from '../game/store';
const CAPACITY = 64;
export function GoldenTrail({ body, dashAt }: { body: RefObject<RapierRigidBody | null>; dashAt: RefObject<number> }) {
  const history = useRef<{ x:number; y:number; z:number; time:number }[]>([]);
  const sparks = useRef<THREE.Group>(null);
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(CAPACITY*6),3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('fade',new THREE.BufferAttribute(new Float32Array(CAPACITY*2),1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('across',new THREE.BufferAttribute(Float32Array.from({length:CAPACITY*2},(_,i)=>i%2 ? 1 : -1),1));
    const indices=[];
    for(let i=0;i<CAPACITY-1;i++){ const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2); }
    g.setIndex(indices); g.setDrawRange(0,0);
    const m = new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,side:THREE.DoubleSide,
      vertexShader:`attribute float fade; attribute float across; varying float vFade; varying float vAcross;
      void main(){vFade=fade;vAcross=across;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying float vFade;varying float vAcross;
      void main(){float core=pow(1.-abs(vAcross),2.);float glow=pow(1.-abs(vAcross),.6);
      vec3 gold=mix(vec3(.91,.66,.28),vec3(1.,.96,.77),core);
      gl_FragColor=vec4(gold,vFade*(.55*glow+.45*core));}`,
    });return {geometry:g,material:m};
  },[]);
  useEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
  useFrame(()=>{
    const s=useGame.getState(), rb=body.current;
    const dash=Math.max(0,1-(s.elapsed-dashAt.current)/.75);
    const lifetime=.55+dash*.35;
    if(s.status!=='playing'||!rb){history.current=[];geometry.setDrawRange(0,0);if(sparks.current)sparks.current.visible=false;if(import.meta.env.DEV)Object.assign(window,{__orbitTrail:{count:0,length:0,dash:0}});return;}
    const p=rb.translation(), speed=Math.hypot(rb.linvel().x,rb.linvel().z);
    let points=history.current;
    if(speed>.12 && (!points[0] || Math.hypot(p.x-points[0].x,p.z-points[0].z)>.025))
      points.unshift({x:p.x,y:p.y-.15,z:p.z,time:s.elapsed});
    points=points.filter(v=>s.elapsed-v.time<lifetime).slice(0,CAPACITY);
    history.current=points;
    const pos=geometry.attributes.position as THREE.BufferAttribute, fade=geometry.attributes.fade as THREE.BufferAttribute;
    let length=0;
    for(let i=0;i<points.length;i++){
      const a=points[i], before=points[Math.max(0,i-1)], after=points[Math.min(points.length-1,i+1)];
      const dx=before.x-after.x,dz=before.z-after.z,n=Math.hypot(dx,dz)||1;
      if(i)length+=Math.hypot(a.x-before.x,a.z-before.z);
      const freshness=Math.max(0,1-(s.elapsed-a.time)/lifetime);
      const width=(.11+Math.min(speed,8)*.012+dash*.12)*freshness;
      for(let side=0;side<2;side++){
        const sign=side ? 1 : -1;
        pos.setXYZ(i*2+side,a.x-dz/n*width*sign,a.y,a.z+dx/n*width*sign);
        fade.setX(i*2+side,freshness*Math.min(1,i/2));
      }
    }
    pos.needsUpdate=true;fade.needsUpdate=true;geometry.setDrawRange(0,Math.max(0,points.length-1)*6);
    if(sparks.current){sparks.current.visible=true;sparks.current.children.forEach((c,i)=>{
      const point=points[3+i*3];c.visible=!!point;
      if(point){const age=s.elapsed-point.time;c.position.set(point.x+Math.sin(i*8+age*4)*.14,point.y+.15+age*.35,point.z+Math.cos(i*7)*.12);c.scale.setScalar(Math.max(0,(1-age/lifetime))*(dash ? .055 : .035));}
    });}
    if(import.meta.env.DEV)Object.assign(window,{__orbitTrail:{count:points.length,length,dash}});
  });
  return <group name="golden-magic-trail">
    <mesh geometry={geometry} material={material} frustumCulled={false} />
    <group ref={sparks}>{Array.from({length:16},(_,i)=><mesh key={i} visible={false}><octahedronGeometry args={[1,0]} /><meshBasicMaterial color={i%3 ? '#f4d58b' : '#fff5dc'} transparent opacity={.8} depthWrite={false} /></mesh>)}</group>
  </group>;
}
