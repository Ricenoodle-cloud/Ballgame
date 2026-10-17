import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, HOLES, initialBalls } from '../src/game/config';
import { useGame } from '../src/game/store';

test('100 fresh layouts have all colors in each quadrant, safe clearances and no overlaps', () => {
  for (const count of [16, 32]) for (let round = 0; round < 100; round++) {
    const balls = initialBalls(count);
    for (let q = 0; q < 4; q++) {
      const region = balls.filter(b => b.id.startsWith(`initial-${q}-`));
      assert.equal(new Set(region.map(b => b.color)).size, 4);
    }
    balls.forEach((b, i) => {
      const [x, , z] = b.position;
      assert.ok(Math.abs(x) < CONFIG.width / 2 - CONFIG.radius);
      assert.ok(Math.abs(z) < CONFIG.depth / 2 - CONFIG.radius);
      assert.ok(Math.hypot(x, z - 1.4) >= 1.65);
      HOLES.forEach(h => assert.ok(Math.hypot(x - h.x, z - h.z) >= 2));
      balls.slice(i + 1).forEach(a => assert.ok(Math.hypot(x - a.position[0], z - a.position[2]) >= 1.15));
    });
  }
  assert.notDeepEqual(initialBalls().map(b => b.position), initialBalls().map(b => b.position));
});
test('wrong hole subtracts once, clamps at zero, removes target; all indirect scores count', () => {
  useGame.getState().start(1);
  const [a, b, c] = useGame.getState().balls;
  const row = (ball: typeof a, correct: boolean) => ({ id: ball.id, holeColor: correct ? ball.color : ball.color === 'red' ? 'blue' as const : 'red' as const, x: 0, z: 0 });
  useGame.getState().resolve([row(a, false), row(a, false)]);
  assert.equal(useGame.getState().score, 0);
  useGame.getState().resolve([row(b, true)]);
  assert.equal(useGame.getState().score, 1);
  useGame.getState().resolve([row(c, false)]);
  assert.equal(useGame.getState().score, 0);
  useGame.getState().resolve([row(b, true), row(c, false)]);
  assert.equal(useGame.getState().score, 0);
  assert.equal(useGame.getState().balls.length, 13);
});
test('bomb hits are deduplicated per session, respect pause and never directly fail player', () => {
  useGame.setState({ unlocked: true });
  useGame.getState().start(2);
  assert.equal(useGame.getState().balls.length, 32);
  useGame.setState({ score: 3 });
  useGame.getState().bombHit('bomb-a', 0, 0);
  useGame.getState().bombHit('bomb-a', 0, 0);
  assert.equal(useGame.getState().score, 2);
  useGame.getState().pause();
  useGame.getState().bombHit('bomb-b', 0, 0);
  assert.equal(useGame.getState().score, 2);
  useGame.getState().pause();
  for (let i = 0; i < 5; i++) useGame.getState().bombHit('bomb-' + i, 0, 0);
  assert.equal(useGame.getState().score, 0);
  assert.equal(useGame.getState().status, 'playing');
  useGame.getState().start(2);
  useGame.setState({ score: 2 });
  useGame.getState().bombHit('bomb-a', 0, 0);
  assert.equal(useGame.getState().score, 1);
});
test('second-stage remaining-target failure uses its twenty-point goal', () => {
  useGame.setState({ unlocked: true });
  useGame.getState().start(2);
  useGame.getState().resolve(useGame.getState().balls.slice(0, 13).map(b => ({ id:b.id, x:0, z:0 })));
  assert.equal(useGame.getState().status, 'failed');
});
