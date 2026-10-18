export const CAMERA={follow:.19,dashFollow:.24,maxOffset:.85,baseY:15.8,baseZ:16.2,fov:43};
export function cameraZoom(aspect:number){return Math.max(1,1.12/Math.max(.55,aspect));}
export function cameraOffset(x:number,z:number,boost=false){
  const factor=boost?CAMERA.dashFollow:CAMERA.follow;
  const ox=x*factor,oz=z*factor,len=Math.hypot(ox,oz),scale=len>CAMERA.maxOffset?CAMERA.maxOffset/len:1;
  return {x:ox*scale,z:oz*scale};
}
