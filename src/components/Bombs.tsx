import { useContext, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { BallCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { Bodies } from "./Balls";
import { CONFIG, safeBombPoint } from "../game/config";
import { useGame } from "../game/store";
import { audio } from "../game/audio";

export type BombData = { id: string; x: number; z: number; born: number };
export function blastStrength(distance: number) {
  return distance <= CONFIG.blastRadius ? 1 - distance / (CONFIG.blastRadius + 0.1) : 0;
}
function Bomb({ data, remove }: { data: BombData; remove: (id: string) => void }) {
  const rb = useRef<RapierRigidBody>(null);
  const marker = useRef<THREE.Group>(null);
  const registry = useContext(Bodies);
  const done = useRef(false);
  const [falling, setFalling] = useState(false);
  const explode = () => {
    const s = useGame.getState();
    if (done.current || s.status !== "playing") return;
    done.current = true; // Collision and frame callbacks may happen together.
    const p = rb.current?.translation() ?? { x: data.x, y: 0, z: data.z };
    audio.play("explosion");
    const apply = (body: RapierRigidBody, player: boolean) => {
      const t = body.translation();
      const dx = t.x - p.x, dz = t.z - p.z;
      const distance = Math.hypot(dx, dz);
      const strength = blastStrength(distance);
      if (!strength || t.y < -0.15) return;
      if (player) s.bombHit(data.id, t.x, t.z);
      const factor = CONFIG.blastImpulse * strength * (player ? 0.6 : 1);
      body.applyImpulse({ x: (distance ? dx / distance : 1) * factor, y: 0.25 * factor, z: (distance ? dz / distance : 0) * factor }, true);
    };
    if (registry.player) apply(registry.player, true);
    registry.targets.forEach(body => apply(body, false));
    s.effect({ x: p.x, y: Math.max(0.1, p.y), z: p.z, color: "#ff7949", kind: "explosion" });
    remove(data.id); // Model, circle, arrow and tail share this lifecycle.
  };
  useFrame(() => {
    const s = useGame.getState();
    if (s.status !== "playing") return;
    const age = s.elapsed - data.born;
    if (!falling && age >= CONFIG.bombWarning) setFalling(true);
    if (marker.current) {
      const p = rb.current?.translation();
      if (p) { marker.current.position.x = p.x; marker.current.position.z = p.z; }
      marker.current.scale.setScalar(1 + Math.sin(age * 12) * 0.06);
    }
    const p = rb.current?.translation();
    // Failsafe covers a fall through an opening or a missed contact event.
    if ((p && p.y <= CONFIG.bombRadius + 0.03) || age > CONFIG.bombWarning + 3) explode();
  });
  return <>
    <group ref={marker} position={[data.x, 0.04, data.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CONFIG.blastRadius, 40]} />
        <meshBasicMaterial color="#ff274c" transparent opacity={0.17} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[CONFIG.blastRadius - 0.06, CONFIG.blastRadius, 40]} />
        <meshBasicMaterial color="#ff365b" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 1.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.23, 0.6, 4]} />
        <meshBasicMaterial color="#ff365b" />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[0.12, 0.5, 0.12]} />
        <meshBasicMaterial color="#ff365b" />
      </mesh>
    </group>
    {falling && <RigidBody ref={rb} colliders={false} position={[data.x, 9, data.z]} ccd onCollisionEnter={explode}>
      <BallCollider args={[CONFIG.bombRadius]} mass={2} />
      <mesh castShadow>
        <sphereGeometry args={[CONFIG.bombRadius, 24, 18]} />
        <meshStandardMaterial color="#1a1921" metalness={0.7} roughness={0.25} />
      </mesh>
      {[0, Math.PI / 2].map((angle, i) => <mesh key={i} rotation={[angle, 0, 0]}>
        <torusGeometry args={[CONFIG.bombRadius, 0.035, 6, 32]} />
        <meshBasicMaterial color="#ff2649" />
      </mesh>)}
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} /><meshBasicMaterial color="#ff4855" />
      </mesh>
      {[0.9, 1.3, 1.7].map((y, i) => <mesh key={i} position={[0, y, 0]}>
        <sphereGeometry args={[0.13 - i * 0.025, 6, 6]} /><meshBasicMaterial color="#ff365b" transparent opacity={0.5 - i * 0.12} />
      </mesh>)}
    </RigidBody>}
  </>;
}
export function Bombs() {
  const status = useGame(s => s.status);
  const [bombs, setBombs] = useState<BombData[]>([]);
  const next = useRef(CONFIG.spawnInitial);
  const counter = useRef(0);
  if (import.meta.env.DEV) Object.assign(window, { __orbitBombs: {
    count: bombs.length,
    spawn: (x: number, z: number) => setBombs(list => [...list, { id: `test-${++counter.current}`, x, z, born: useGame.getState().elapsed }]),
  } });
  useEffect(() => {
    if (status !== "playing") setBombs([]);
    next.current = useGame.getState().elapsed + CONFIG.spawnInitial;
  }, [status]);
  useFrame(() => {
    const s = useGame.getState();
    if (s.status !== "playing" || s.level !== 2 || s.elapsed < next.current) return;
    next.current = s.elapsed + Math.max(CONFIG.spawnMinimum, CONFIG.spawnInitial - s.elapsed * 0.018);
    if (bombs.length >= CONFIG.maxBombs) return;
    const { x, z } = safeBombPoint();
    setBombs(b => [...b, { id: `bomb-${s.session}-${++counter.current}`, x, z, born: s.elapsed }]);
  });
  return <>{status === "playing" && bombs.map(b => <Bomb key={b.id} data={b} remove={id => setBombs(list => list.filter(b => b.id !== id))} />)}</>;
}
