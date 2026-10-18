import { CONFIG } from './config';
export const FENCE = { radius: CONFIG.arenaRadius - .15, segments: 96, halfThickness: .13, height: 1.6 };
export const FENCE_MATERIAL = { friction: .2, restitution: .62 };

/** A bounded, inward-only nudge used when a rolling sphere reaches a seam. */
export function fenceAssistImpulse(x:number,z:number,vx:number,vz:number,ballRadius=CONFIG.radius){
  const r=Math.hypot(x,z), limit=FENCE.radius-ballRadius-.025;
  if(r<limit-.09||r===0)return {x:0,z:0};
  const nx=x/r,nz=z/r, outward=vx*nx+vz*nz;
  const correction=Math.min(.7,Math.max(.04,outward*.18));
  return {x:-nx*correction,z:-nz*correction};
}
// Overlapping tangent boxes form a closed, vertical ring. No slopes or post gaps.
export function fenceSegments() {
  return Array.from({length:FENCE.segments},(_,i)=>{
    const angle=(i+.5)*Math.PI*2/FENCE.segments;
    return {x:Math.cos(angle)*FENCE.radius,z:Math.sin(angle)*FENCE.radius,
      rotation:Math.PI/2-angle,
      halfLength:FENCE.radius*Math.tan(Math.PI/FENCE.segments)+.035};
  });
}
