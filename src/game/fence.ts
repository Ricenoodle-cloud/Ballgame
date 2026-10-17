import { CONFIG } from './config';
export const FENCE = { radius: CONFIG.arenaRadius - .15, segments: 96, halfThickness: .13, height: 1.6 };
// Overlapping tangent boxes form a closed, vertical ring. No slopes or post gaps.
export function fenceSegments() {
  return Array.from({length:FENCE.segments},(_,i)=>{
    const angle=(i+.5)*Math.PI*2/FENCE.segments;
    return {x:Math.cos(angle)*FENCE.radius,z:Math.sin(angle)*FENCE.radius,
      rotation:Math.PI/2-angle,
      halfLength:FENCE.radius*Math.tan(Math.PI/FENCE.segments)+.035};
  });
}
