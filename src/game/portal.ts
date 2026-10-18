import { COLORS, type ColorKey, HOLES } from './config';
export const PORTAL={first:8,duration:12,cooldown:6,width:1.5};
export const portalColors=Object.keys(COLORS) as ColorKey[];
export function portalAt(cycle:number){const color=portalColors[cycle%portalColors.length];const spots=[[-1,0],[1,0],[0,-1.5],[0,1.5]] as const;const [x,z]=spots[cycle%spots.length];return {color,x,z};}
export function portalSafe(x:number,z:number){return HOLES.every(h=>Math.hypot(h.x-x,h.z-z)>2.1);}
