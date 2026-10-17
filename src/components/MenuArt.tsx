import type { CSSProperties } from 'react';
import { WhiteFlowers } from './WhiteFlowers';
export function MenuArt(){
  return <div className="menu-art" aria-hidden="true">
    <svg className="menu-architectural-lines" viewBox="0 0 360 600" preserveAspectRatio="none" focusable="false">
      <g fill="none" stroke="#b69b6d" strokeWidth=".7" opacity=".45">
        <path d="M4 84V24L24 4H88M272 4h64l20 20v60M4 510v62l24 24h58M274 596h58l24-24v-62"/>
        <path d="M12 62V30l18-18h32M298 12h32l18 18v32M12 544v22l22 22h28M298 588h28l22-22v-22" opacity=".5"/>
        <path d="M154 4h22l4-4 4 4h22M154 596h22l4 4 4-4h22"/>
      </g>
      <g fill="none" stroke="#a6b6a0" strokeWidth=".8" opacity=".5">
        <path d="M348 478q-22 23-14 52t-15 36M335 512q-11-12-15-5 2 12 15 5M333 535q14-9 17-3-5 10-17 3M328 552q-13-10-15-3 3 9 15 3"/>
      </g>
    </svg>
    <i className="menu-floating-rhombus"/><i className="menu-floating-rhombus second"/>
    {Array.from({length:4},(_,i)=><span className={`menu-mote mote-${i}`} key={i}/>)}
  </div>;
}
export function MenuTitleFlower(){return <span className="menu-title-flower" aria-hidden="true"><WhiteFlowers presentation="menu" phase={1.4}/></span>;}
export function StartOrnaments(){return <>
  <span className="start-flower left" aria-hidden="true"><WhiteFlowers presentation="menu" phase={5.1}/></span>
  <span className="start-flower right" aria-hidden="true"><WhiteFlowers presentation="menu" phase={8.6}/></span>
  <span className="start-geometry left" aria-hidden="true"/><span className="start-geometry right" aria-hidden="true"/>
  <span className="start-sparks" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} style={{'--spark-x':`${Math.cos(i*Math.PI/4)*60}px`,'--spark-y':`${Math.sin(i*Math.PI/4)*30}px`} as CSSProperties}/>)}</span>
</>;}
