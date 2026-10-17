import * as THREE from 'three';
export const FLOWERS = [
  {x:-10.9,y:-.3,z:-2.5,scale:1.05,phase:0},
  {x:10.8,y:-.2,z:-2.8,scale:1.1,phase:3.1},
  {x:-10.3,y:-.8,z:5.7,scale:.65,phase:6.4},
  {x:10.3,y:-.8,z:5.7,scale:.7,phase:9.2},
  {x:-5.3,y:-.6,z:-11,scale:.85,phase:1.7},
  {x:5.2,y:-1,z:-11.7,scale:.6,phase:7.7},
  {x:12.8,y:-1.2,z:-7.1,scale:.65,phase:4.4},
  {x:-12.8,y:-1.6,z:-8.8,scale:.55,phase:10.6},
];
export const PETAL_LAYERS = [{count:8,scale:1.12,delay:0},{count:7,scale:.88,delay:.28},{count:5,scale:.62,delay:.55}];
export const PETALS_PER_FLOWER = PETAL_LAYERS.reduce((n,l)=>n+l.count,0);
const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function flowerOpenness(time:number,phase=0,delay=0){
  const t=((time+phase-delay)%13.6+13.6)%13.6;
  if(t<4.5)return .16+.84*smooth(t/4.5);
  if(t<6.5)return 1; // two-second fully open hold
  if(t<11)return 1-.84*smooth((t-6.5)/4.5);
  return .16;
}
// Volumetric cup-shaped petal: broad scalloped lip, asymmetric outline,
// folded edges and a curved midrib; neither a flat card nor a daisy blade.
export function createPetalGeometry(rows=10,cols=6){
  const positions:number[]=[],colors:number[]=[],indices:number[]=[];
  for(let j=0;j<=rows;j++){
    const t=j/rows;
    for(let i=0;i<=cols;i++){
      const u=i/cols*2-1;
      const width=.52*Math.pow(Math.sin(Math.PI*t*.91),.72)*(.94+.06*Math.sin(t*13));
      const edge=Math.pow(Math.abs(u),3);
      const scallop=edge*.035*Math.sin(t*31+u*5)*t;
      const x=u*width*(1+.05*Math.sin(u*9+t*7));
      const y=t*.96+scallop+.035*Math.sin(u*8)*t*t;
      const z=-.29*t*t+.2*u*u*Math.sin(Math.PI*t)+.05*Math.sin(u*7+t*4)*t*t;
      positions.push(x,y,z);
      const color=new THREE.Color().lerpColors(new THREE.Color('#eee4d0'),new THREE.Color('#fffefa'),smooth(t*2));
      colors.push(color.r,color.g,color.b);
      if(j<rows&&i<cols){const a=j*(cols+1)+i;indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}
