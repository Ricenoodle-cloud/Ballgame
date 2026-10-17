import { test } from "node:test";
import assert from "node:assert/strict";
import { useGame } from "../src/game/store";
import { CONFIG, holeAt, initialBalls, randomBall } from "../src/game/config";
test("sixteen unique targets; four of every color", () => {
  const b = initialBalls();
  assert.equal(new Set(b.map((x) => x.id)).size, 16);
  for (const c of ["red", "blue", "green", "yellow"])
    assert.equal(b.filter((x) => x.color === c).length, 4);
});
test("same-frame scoring, deduplication, wrong colors and removal are atomic", () => {
  useGame.getState().start(1);
  const rows = initialBalls()
    .slice(0, 3)
    .map((b) => ({ id: b.id, holeColor: b.color, x: 0, z: 0 }));
  useGame
    .getState()
    .resolve([
      ...rows,
      rows[0],
      { id: "initial-1-0", holeColor: "red", x: 0, z: 0 },
    ]);
  assert.equal(useGame.getState().score, 3);
  assert.equal(useGame.getState().balls.length, 12);
  useGame.getState().resolve(rows);
  assert.equal(useGame.getState().score, 3);
});
test("indirect balls require no player attribution; ten scores unlock level two once", () => {
  useGame.getState().start(1);
  const rows = initialBalls()
    .slice(0, 11)
    .map((b) => ({ id: b.id, holeColor: b.color, x: 0, z: 0 }));
  useGame.getState().resolve(rows);
  assert.equal(useGame.getState().score, 11);
  assert.equal(useGame.getState().status, "victory");
  assert.equal(useGame.getState().unlocked, true);
  useGame.getState().resolve(rows);
  assert.equal(useGame.getState().score, 11);
  useGame.getState().start(2);
  assert.equal(useGame.getState().level, 2);
});
test("pause freezes timers, cooldown and score", () => {
  useGame.getState().start(1);
  useGame.getState().dash();
  useGame.getState().tick(0.5);
  useGame.getState().pause();
  useGame.getState().tick(20);
  useGame
    .getState()
    .resolve([{ id: "initial-0-0", holeColor: "red", x: 0, z: 0 }]);
  assert.equal(useGame.getState().elapsed, 0.5);
  assert.equal(useGame.getState().cooldown, 1);
  assert.equal(useGame.getState().score, 0);
  useGame.getState().pause();
  assert.equal(useGame.getState().status, "playing");
});
test("player death is once-only and takes precedence over scoring", () => {
  useGame.getState().start(1);
  useGame.getState().fall();
  useGame.getState().fall();
  useGame
    .getState()
    .resolve(
      initialBalls().map((b) => ({ id: b.id, holeColor: b.color, x: 0, z: 0 })),
    );
  assert.equal(useGame.getState().score, 0);
  assert.equal(useGame.getState().status, "falling");
  useGame.getState().finishFall();
  assert.equal(useGame.getState().status, "failed");
});
test("impossible static round fails; rain level caps active targets", () => {
  useGame.getState().start(1);
  useGame.getState().resolve(
    initialBalls()
      .slice(0, 7)
      .map((b) => ({ id: b.id, x: 0, z: 0 })),
  );
  assert.equal(useGame.getState().status, "failed");
  useGame.getState().start(2);
  for (let i = 0; i < 100; i++)
    useGame.getState().spawn(randomBall("test-" + i));
  assert.equal(useGame.getState().balls.length, CONFIG.maxBalls);
});
test("rain positions avoid real openings", () => {
  for (let i = 0; i < 200; i++) {
    const b = randomBall(String(i));
    assert.equal(holeAt(b.position[0], b.position[2]), undefined);
    assert.equal(b.position[1], 8);
  }
});
test("second stage wins at twenty and stops spawning", () => {
  useGame.setState({ unlocked: true });
  useGame.getState().start(2);
  for (let i = 0; i < 4; i++) useGame.getState().spawn(randomBall("win-" + i));
  const rows = useGame
    .getState()
    .balls.map((b) => ({ id: b.id, holeColor: b.color, x: 0, z: 0 }));
  useGame.getState().resolve(rows);
  assert.equal(useGame.getState().score, 20);
  assert.equal(useGame.getState().status, "victory");
  useGame.getState().spawn(randomBall("late"));
  assert.equal(useGame.getState().balls.length, 0);
});
