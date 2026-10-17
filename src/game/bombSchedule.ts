import { CONFIG } from './config';
export function bombInterval(elapsed:number,random=Math.random){
  const base=elapsed<45?CONFIG.spawnInitial:elapsed<90?7:6;
  return Math.max(CONFIG.spawnMinimum,base+(random()-.5)*CONFIG.bombJitter*2);
}
// Uses game time, so pausing preserves both warning age and the next deadline.
export class BombSchedule {
  nextAt:number=CONFIG.bombGrace;
  poll(elapsed:number,active:number,random=Math.random){
    if(active>=CONFIG.maxBombs||elapsed<this.nextAt)return false;
    this.nextAt=elapsed+bombInterval(elapsed,random);
    return true;
  }
}
