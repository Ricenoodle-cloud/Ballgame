import { CONFIG, HOLES } from './config';
export const PUDDLES=[{x:-1.8,z:-2.1,r:.72},{x:2.1,z:1.65,r:.62},{x:-2.9,z:1.3,r:.58},{x:1.1,z:-3.1,r:.5}] as const;
export const GRASS=[{x:-2.6,z:-.65},{x:2.65,z:-.8},{x:-.9,z:3.0},{x:2.8,z:-1.9},{x:-2.2,z:-2.4}] as const;
export const WATER_TRACE_LIFE=5;
export const BUTTERFLY_LIFE=4.2;
export function safeNaturePoint(x:number,z:number,r=.5){return Math.hypot(x,z)<CONFIG.arenaRadius-1&&HOLES.every(h=>Math.hypot(h.x-x,h.z-z)>CONFIG.holeRadius+1.1);}
export function inNatureRange(x:number,z:number,point:{x:number;z:number},radius:number){return Math.hypot(x-point.x,z-point.z)<radius;}
export function butterflyFlight(age:number,index:number,origin:{x:number;z:number}){const p=Math.min(1,age/BUTTERFLY_LIFE);return {x:origin.x+Math.sin(age*1.7+index)*(.25+.35*p),y:.35+p*1.3+Math.sin(age*2+index)*.1,z:origin.z+Math.cos(age*1.35+index)*(.22+.25*p),opacity:Math.max(0,1-p)};}
