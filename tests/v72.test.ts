import test from 'node:test';
import assert from 'node:assert/strict';
import { useGame } from '../src/game/store';
import { initialBalls } from '../src/game/config';
test('perfect combo counts actual unique correct entries and resets on wrong entry',()=>{
  const balls=initialBalls(16);useGame.setState({status:'playing',level:1,score:0,combo:0,comboFlashAt:-Infinity,balls});
  const hole=(color:string)=>({holeColor:color as any,x:0,z:0});
  for(let i=0;i<3;i++){const b=useGame.getState().balls[0];useGame.getState().resolve([{id:b.id,...hole(b.color)}]);}
  assert.equal(useGame.getState().combo,3);
  const b=useGame.getState().balls[0],wrong=b.color==='red'?'blue':'red';useGame.getState().resolve([{id:b.id,holeColor:wrong as any,x:0,z:0},{id:b.id,holeColor:wrong as any,x:0,z:0}]);
  assert.equal(useGame.getState().combo,0);
});
test('restart and failure clear combo without changing score rules',()=>{
  useGame.setState({status:'playing',combo:5,score:2});useGame.getState().start(1);assert.equal(useGame.getState().combo,0);
  useGame.setState({status:'playing',combo:4});useGame.getState().fall();assert.equal(useGame.getState().combo,0);
});
