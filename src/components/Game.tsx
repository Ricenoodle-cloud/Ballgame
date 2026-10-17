import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { DreamWorld } from "./DreamWorld";
import { Arena } from "./Arena";
import { Bodies, PlayerBall, TargetBall } from "./Balls";
import { Bombs } from "./Bombs";
import { Effects } from "./Effects";
import { CONFIG, holeAt } from "../game/config";
import { useGame, type Resolution } from "../game/store";
import { useInput } from "../game/input";
import * as THREE from "three";
function Systems() {
  const registry = useMemo(() => ({ player: null, targets: new Map(), session: useGame.getState().session }), []);
  if (import.meta.env.DEV) {
    Object.assign(window, { __orbitBodies: registry, __orbitGame: useGame });
  }
  const balls = useGame((s) => s.balls);
  const status = useGame((s) => s.status);
  const falling = useRef(0);
  const processed = useRef(new Set<string>());
  const entered = useRef(new Map<string, NonNullable<ReturnType<typeof holeAt>>>());
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = useGame.getState();
    if (s.status === "falling") {
      falling.current += dt;
      if (falling.current > 0.7) s.finishFall();
      return;
    }
    if (s.status !== "playing") return;
    s.tick(dt);
    const p = registry.player as
      import("@react-three/rapier").RapierRigidBody | null;
    if (p && p.translation().y < -0.15) {
      s.fall();
      return;
    }
    const rows: Resolution[] = [];
    registry.targets.forEach((rb, id) => {
      if (processed.current.has(id)) return;
      const t = rb.translation();
      if (t.y < 0 && !entered.current.has(id)) {
        const hole = holeAt(t.x, t.z);
        if (hole) entered.current.set(id, hole);
      }
      if (t.y < -0.7) {
        processed.current.add(id);
        const h = entered.current.get(id) ?? holeAt(t.x, t.z);
        rows.push({ id, holeColor: h?.color, x: h?.x ?? t.x, z: h?.z ?? t.z });
      }
    });
    if (rows.length) s.resolve(rows);

  });
  return (
    <Bodies.Provider value={registry}>
      <Physics
        gravity={[0, CONFIG.gravity, 0]}
        timeStep={CONFIG.step}
        paused={!["playing", "falling"].includes(status)}
        numSolverIterations={8}
      >
        <Arena />
        <PlayerBall />
        <Bombs />
        {balls.map((b) => (
          <TargetBall key={b.id} data={b} />
        ))}
      </Physics>
      <Effects />
    </Bodies.Provider>
  );
}
function CameraRig() {
  const { camera, size } = useThree();
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }, dt) => {
    const aspect = size.width / size.height;
    const zoom = Math.max(1, 1.4 / aspect);
    const s = useGame.getState();
    const shake =
      s.status === "playing" && s.cooldown > 1.35
        ? Math.sin(clock.elapsedTime * 80) * 0.035
        : 0;
    desired.set(shake, 20 * zoom, 20.5 * zoom);
    camera.position.lerp(desired, Math.min(1, dt * 5));
    camera.lookAt(0, -0.2, 0);
  });
  return null;
}
export function Game() {
  useInput();
  const session = useGame((s) => s.session);
  return (
    <Canvas
      shadows
      dpr={[1, 1.7]}
      camera={{ position: [0, 20, 20.5], fov: 43, near: 0.1, far: 180 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <fog attach="fog" args={["#e4ddea", 30, 85]} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#fff4de", "#bdafc5", 1.2]} />
      <directionalLight
        position={[-8, 16, 6]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0003}
        shadow-radius={4}
      />
      <pointLight position={[8, 6, -8]} color="#f6d7b0" intensity={12} />
      <Suspense fallback={null}>
        <DreamWorld />
        <Systems key={session} />
      </Suspense>
      <CameraRig />
    </Canvas>
  );
}
