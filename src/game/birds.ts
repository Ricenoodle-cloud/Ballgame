export const BIRD_FLOCK = { first: 8, interval: 28, duration: 12, count: 6 };
export function flockWindow(elapsed:number){
  if(elapsed<BIRD_FLOCK.first)return {active:false,cycle:-1,progress:0};
  const cycle=Math.floor((elapsed-BIRD_FLOCK.first)/BIRD_FLOCK.interval),progress=(elapsed-BIRD_FLOCK.first-cycle*BIRD_FLOCK.interval)/BIRD_FLOCK.duration;
  return {active:progress>=0&&progress<=1,cycle,progress};
}
export function birdFlight(elapsed:number,index:number,cycle:number){
  const p=(elapsed-BIRD_FLOCK.first-cycle*BIRD_FLOCK.interval)/BIRD_FLOCK.duration;
  const spread=(index-(BIRD_FLOCK.count-1)/2)*.9;
  return {x:-17+p*34+spread+Math.sin(elapsed*.45+index)*.35,y:8.4+Math.sin(p*Math.PI*2+index*.8)*.55+index%3*.32,z:-15-index%3*1.6,bank:Math.sin(p*Math.PI*2+index)*.08};
}
export function wingBeat(elapsed:number,index:number){const phase=elapsed*2.1+index*.73;return Math.sin(phase)*.28+Math.sin(phase*.43)*.08;}
