import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FLOWERS, PETAL_LAYERS, PETALS_PER_FLOWER, createPetalGeometry, flowerOpenness } from '../game/flowers';

export function WhiteFlowers(){
  const petals=useRef<THREE.InstancedMesh>(null),farPetals=useRef<THREE.InstancedMesh>(null),centers=useRef<THREE.InstancedMesh>(null),stems=useRef<THREE.InstancedMesh>(null),leaves=useRef<THREE.InstancedMesh>(null),drift=useRef<THREE.InstancedMesh>(null);
  const {gl}=useThree();
  const resources=useMemo(()=>({
    petal:createPetalGeometry(),
    distantPetal:createPetalGeometry(6,4),
    material:new THREE.MeshStandardMaterial({color:'#fffef9',vertexColors:true,roughness:.62,metalness:0,transparent:true,opacity:.88,side:THREE.DoubleSide,forceSinglePass:true,depthWrite:true,emissive:'#fff4d6',emissiveIntensity:.075}),
    dummy:new THREE.Object3D(),base:new THREE.Matrix4(),scale:new THREE.Vector3(),rotation:new THREE.Quaternion(),axis:new THREE.Euler(),result:new THREE.Matrix4(),position:new THREE.Vector3(),
  }),[]);
  useEffect(()=>()=>{resources.petal.dispose();resources.distantPetal.dispose();resources.material.dispose();},[resources]);
  useEffect(()=>{
    const d=resources.dummy;
    FLOWERS.forEach((f,i)=>{
      d.position.set(f.x,f.y+.4*f.scale,f.z);d.rotation.set(0,0,.04*Math.sin(i));d.scale.set(.035*f.scale,.8*f.scale,.035*f.scale);d.updateMatrix();stems.current!.setMatrixAt(i,d.matrix);
      d.position.set(f.x,f.y+.85*f.scale,f.z);d.rotation.set(0,0,0);d.scale.set(.18*f.scale,.09*f.scale,.18*f.scale);d.updateMatrix();centers.current!.setMatrixAt(i,d.matrix);
      centers.current!.setColorAt(i,new THREE.Color(i%3===0?'#e8dcb0':i%3===1?'#ecd5cd':'#dce3c6'));
      for(let j=0;j<2;j++){
        d.position.set(f.x+(j?1:-1)*.12*f.scale,f.y+.3*f.scale+j*.15,f.z);
        d.rotation.set(.3,j, (j?1:-1)*.7);d.scale.set(.1*f.scale,.28*f.scale,.035*f.scale);d.updateMatrix();leaves.current!.setMatrixAt(i*2+j,d.matrix);
      }
    });
    for(const m of [stems.current,centers.current,leaves.current])if(m){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();}
    for(const mesh of [petals.current,farPetals.current])if(mesh)mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  },[resources]);
  useFrame(({clock})=>{
    const t=clock.elapsedTime,r=resources;
    FLOWERS.forEach((f,i)=>{
      // Two shared meshes: full curves on the two focal blooms, lighter curves on distant blooms.
      r.axis.set(.12+Math.sin(t*.35+i)*.035,Math.sin(i)*.15,Math.cos(t*.3+i)*.035);
      r.rotation.setFromEuler(r.axis);r.position.set(f.x,f.y+.82*f.scale,f.z);r.scale.setScalar(f.scale);
      r.base.compose(r.position,r.rotation,r.scale);
      let offset=0;
      PETAL_LAYERS.forEach((layer,l)=>{
        const open=flowerOpenness(t,f.phase,layer.delay),angle=.16+open*(1.08-l*.12);
        for(let p=0;p<layer.count;p++){
          const azimuth=p*Math.PI*2/layer.count+l*.47;
          r.dummy.position.set(Math.sin(azimuth)*.06,l*.045,Math.cos(azimuth)*.06);
          r.dummy.rotation.set(0,azimuth,0);r.dummy.rotateX(angle+.025*Math.sin(p*3+i));
          r.dummy.scale.set(layer.scale*(.92+.08*Math.sin(p*2+i)),layer.scale,layer.scale);
          r.dummy.updateMatrix();r.result.multiplyMatrices(r.base,r.dummy.matrix);
          const mesh=i<2?petals.current:farPetals.current;
          mesh?.setMatrixAt((i<2?i:i-2)*PETALS_PER_FLOWER+offset+p,r.result);
        }
        offset+=layer.count;
      });
    });
    for(const mesh of [petals.current,farPetals.current])if(mesh)mesh.instanceMatrix.needsUpdate=true;
    // Six nonphysical fragments stay close to exterior blooms, never over play.
    for(let i=0;i<6;i++){
      const f=FLOWERS[i],age=(t*.09+i*.173)%1;
      r.dummy.position.set(f.x+Math.sin(t*.2+i)*.45,f.y+.8-age*1.3,f.z+Math.cos(t*.17+i)*.4);
      r.dummy.rotation.set(t*.15+i,t*.1,Math.sin(t*.3+i)*.3);r.dummy.scale.setScalar(.14*(1-Math.abs(age-.5)));
      r.dummy.updateMatrix();drift.current?.setMatrixAt(i,r.dummy.matrix);
    }
    if(drift.current)drift.current.instanceMatrix.needsUpdate=true;
    if(import.meta.env.DEV)Object.assign(window,{__orbitFlowers:{count:FLOWERS.length,petals:FLOWERS.length*PETALS_PER_FLOWER,open:FLOWERS.map(f=>flowerOpenness(t,f.phase)),calls:gl.info.render.calls,triangles:gl.info.render.triangles}});
  });
  return <group name="white-layered-breathing-flowers">
    <instancedMesh ref={petals} args={[resources.petal,resources.material,2*PETALS_PER_FLOWER]} frustumCulled={false} />
    <instancedMesh ref={farPetals} args={[resources.distantPetal,resources.material,(FLOWERS.length-2)*PETALS_PER_FLOWER]} frustumCulled={false} />
    <instancedMesh ref={centers} args={[undefined,undefined,FLOWERS.length]}><sphereGeometry args={[1,12,8]} /><meshStandardMaterial color="#fff5d7" roughness={.8} emissive="#e9dfb8" emissiveIntensity={.08} /></instancedMesh>
    <instancedMesh ref={stems} args={[undefined,undefined,FLOWERS.length]}><cylinderGeometry args={[.8,1,1,5]} /><meshStandardMaterial color="#a2b6a0" roughness={.85} /></instancedMesh>
    <instancedMesh ref={leaves} args={[undefined,undefined,FLOWERS.length*2]}><octahedronGeometry args={[1,0]} /><meshStandardMaterial color="#adbeaa" roughness={.85} /></instancedMesh>
    <instancedMesh ref={drift} args={[resources.distantPetal,resources.material,6]} frustumCulled={false} />
  </group>;
}
