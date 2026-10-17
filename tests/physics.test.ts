import { test } from "node:test";
import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import { createArenaGeometry } from "../src/game/arenaGeometry";
import { CONFIG, HOLES } from "../src/game/config";
await RAPIER.init();
function arena() {
  const world = new RAPIER.World({ x: 0, y: CONFIG.gravity, z: 0 });
  world.timestep = CONFIG.step;
  const geo = createArenaGeometry();
  const pos = new Float32Array(geo.attributes.position.array);
  const idx = Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);
  const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(
    RAPIER.ColliderDesc.trimesh(pos, idx).setFriction(CONFIG.friction),
    fixed,
  );
  geo.dispose();
  return world;
}
function ball(
  world: RAPIER.World,
  x: number,
  y: number,
  z: number,
  mass: number,
  damping = 0.65,
) {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .setCcdEnabled(true)
      .setLinearDamping(damping),
  );
  world.createCollider(
    RAPIER.ColliderDesc.ball(CONFIG.radius)
      .setMass(mass)
      .setFriction(CONFIG.friction)
      .setRestitution(CONFIG.restitution),
    rb,
  );
  return rb;
}
test("actual extruded arena supports a ball, and all four circular openings allow gravity falls", () => {
  const w = arena();
  const safe = ball(w, 0, 1, 0, 1);
  const holes = HOLES.map((h) => ball(w, h.x, 1, h.z, 3.5));
  for (let i = 0; i < 180; i++) w.step();
  assert.ok(safe.translation().y > 0.42 && safe.translation().y < 0.49);
  for (const b of holes)
    assert.ok(
      b.translation().y < -2,
      "ball must physically fall through cutout",
    );
  w.free();
});
test("sustained player impulse moves a heavy ball without teleportation", () => {
  const w = arena();
  const p = ball(w, 0, 0.46, 0, 1, 2.1);
  const target = ball(w, 1, 0.46, 0, 3.5);
  for (let i = 0; i < 240; i++) {
    p.applyImpulse({ x: CONFIG.force * CONFIG.step, y: 0, z: 0 }, true);
    w.step();
  }
  assert.ok(
    target.translation().x > 2,
    "heavy target should move under sustained pushing",
  );
  assert.ok(p.translation().x < target.translation().x);
  w.free();
});
test("dash transfers real momentum through a chain of heavy balls with CCD", () => {
  const w = arena();
  const p = ball(w, -1.2, 0.46, 0, 1, 2.1);
  const a = ball(w, 0, 0.46, 0, 3.5);
  const b = ball(w, 1, 0.46, 0, 3.5);
  p.applyImpulse({ x: CONFIG.dashImpulse, y: 0, z: 0 }, true);
  let peak = 0;
  for (let i = 0; i < 100; i++) {
    w.step();
    peak = Math.max(peak, b.linvel().x);
  }
  assert.ok(
    peak > 0.5,
    "second heavy ball receives indirect collision impulse",
  );
  assert.ok(b.translation().x > 1.2);
  assert.ok(p.translation().y > 0, "no floor tunneling");
  assert.ok(a.translation().x < b.translation().x, "no ball tunneling");
  w.free();
});
