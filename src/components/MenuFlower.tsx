import { useId, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { createPetalGeometry, flowerOpenness, PETAL_LAYERS } from '../game/flowers';

// UI projection of the EXISTING V4 curved petal mesh, not a replacement flower.
// One cached outline and one animation clock; no second WebGL context or assets.
let outline: THREE.Vector3[] | undefined;
function petalOutline() {
  if (outline) return outline;
  const rows=10,cols=6,g=createPetalGeometry(rows,cols),p=g.attributes.position;
  const edge:number[]=[];
  for(let j=0;j<=rows;j++)edge.push(j*(cols+1));
  for(let i=1;i<=cols;i++)edge.push(rows*(cols+1)+i);
  for(let j=rows-1;j>=0;j--)edge.push(j*(cols+1)+cols);
  for(let i=cols-1;i>0;i--)edge.push(i);
  outline=edge.map(i=>new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)));
  g.dispose();return outline;
}
const camera=new THREE.OrthographicCamera(-1.45,1.45,1.45,-1.45,.1,20);
camera.position.set(0,3.4,4);camera.lookAt(0,.28,0);camera.updateMatrixWorld();
let time=0,last=0,raf=0;
const listeners=new Set<()=>void>();
function tick(now:number){
  if(now-last>=100&&!document.hidden){time=now/1000;last=now;listeners.forEach(fn=>fn());}
  if(listeners.size)raf=requestAnimationFrame(tick);
}
function subscribe(fn:()=>void){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return ()=>{};
  listeners.add(fn);if(listeners.size===1)raf=requestAnimationFrame(tick);
  return ()=>{listeners.delete(fn);if(!listeners.size)cancelAnimationFrame(raf);};
}
const snapshot=()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?5:time;
export function menuFlowerFrame(t:number,phase:number){
  const dummy=new THREE.Object3D(),point=new THREE.Vector3();
  const base=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(.12+Math.sin(t*.35+phase)*.035,Math.sin(phase)*.15,0));
  const matrix=new THREE.Matrix4();
  const petals:{d:string;depth:number;layer:number}[]=[];
  PETAL_LAYERS.forEach((layer,l)=>{
    const open=flowerOpenness(t,phase,layer.delay),angle=.16+open*(1.08-l*.12);
    for(let p=0;p<layer.count;p++){
      const a=p*Math.PI*2/layer.count+l*.47;
      dummy.position.set(Math.sin(a)*.06,l*.045,Math.cos(a)*.06);
      dummy.rotation.set(0,a,0);dummy.rotateX(angle+.025*Math.sin(p*3+phase));
      dummy.scale.set(layer.scale*(.92+.08*Math.sin(p*2+phase)),layer.scale,layer.scale);dummy.updateMatrix();matrix.multiplyMatrices(base,dummy.matrix);
      let depth=0;
      const points=petalOutline().map(v=>{point.copy(v).applyMatrix4(matrix);depth+=point.z;point.project(camera);return `${(50+point.x*50).toFixed(2)},${(50-point.y*50).toFixed(2)}`;});
      petals.push({d:`M${points.join(' L')} Z`,depth:depth/points.length,layer:l});
    }
  });
  return petals.sort((a,b)=>a.depth-b.depth);
}
export function MenuFlower({phase=0}:{phase?:number}){
  const t=useSyncExternalStore(subscribe,snapshot,()=>5),id=useId().replace(/[^a-zA-Z0-9_-]/g,'');
  const petals=menuFlowerFrame(t,phase);
  return <svg className="menu-flower" viewBox="0 0 100 100" aria-hidden="true" focusable="false" data-flower-model="v4-shared-curved-petals">
    <defs><linearGradient id={`petal-${id}`} x1="0" y1="1" x2=".35" y2="0"><stop stopColor="#eee4d0"/><stop offset=".45" stopColor="#fffefa"/><stop offset="1" stopColor="#ffffff" stopOpacity=".87"/></linearGradient><radialGradient id={`heart-${id}`}><stop stopColor="#fff5d7"/><stop offset="1" stopColor={phase>3?'#e7d2ca':'#e4dfbb'}/></radialGradient></defs>
    {petals.map((p,i)=><path key={i} d={p.d} fill={`url(#petal-${id})`} fillOpacity=".91" stroke="#cabfaa" strokeOpacity=".32" strokeWidth=".32" strokeLinejoin="round"/>)}
    <ellipse cx="50" cy="56" rx="4.2" ry="2.8" fill={`url(#heart-${id})`} opacity={.35+flowerOpenness(t,phase)*.65}/>
  </svg>;
}
