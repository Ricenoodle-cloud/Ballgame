import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
export function useMenuStart(menu:boolean){
  const [starting,setStarting]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const pending=useRef(false);
  useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current);},[]);
  useEffect(()=>{if(!menu){if(timer.current!==null)clearTimeout(timer.current);timer.current=null;pending.current=false;setStarting(false);}},[menu]);
  const start=useCallback((level:number)=>{
    const s=useGame.getState();
    if(pending.current||s.status!=='menu'||(level===2&&!s.unlocked))return;
    pending.current=true;setStarting(true);
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current=setTimeout(()=>{
      timer.current=null;
      if(useGame.getState().status!=='menu'){pending.current=false;setStarting(false);return;}
      const update=()=>{useGame.getState().start(level);setStarting(false);pending.current=false;};
      if(!reduced&&document.startViewTransition){
        try{
          const transition=document.startViewTransition(update);
          void transition.ready.catch(()=>{});
          void transition.updateCallbackDone.catch(()=>{if(pending.current&&useGame.getState().status==='menu')update();});
        }catch{update();}
      }else update();
    },reduced?0:220);
  },[]);
  return {starting,start};
}
