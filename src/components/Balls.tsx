import { createContext, useContext, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BallCollider,
  RigidBody,
  useBeforePhysicsStep,
  type RapierRigidBody,
} from "@react-three/rapier";
import { Html } from "@react-three/drei";
import { COLORS, CONFIG, type BallData } from "../game/config";
import { direction, input } from "../game/input";
import { useGame } from "../game/store";
import * as THREE from "three";
export const Bodies = createContext<{
  player: RapierRigidBody | null;
  targets: Map<string, RapierRigidBody>;
}>({ player: null, targets: new Map() });
export function PlayerBall() {
  const ref = useRef<RapierRigidBody>(null);
  const registry = useContext(Bodies);
  const last = useRef({ x: 0, z: -1 });
  const flash = useRef<THREE.MeshStandardMaterial>(null);
  const dashAt = useRef(-10);
  const trail = useRef<THREE.Group>(null);
  const trailPoints = useRef<THREE.Vector3[]>([]);
  const tick = useRef(0);
  useEffect(() => {
    registry.player = ref.current;
    return () => {
      registry.player = null;
    };
  }, [registry]);
  useBeforePhysicsStep(() => {
    const s = useGame.getState();
    if (s.status !== "playing") {
      input.dash = false;
      return;
    }
    const rb = ref.current;
    if (!rb) return;
    const d = direction();
    const v = rb.linvel();
    const pos = rb.translation();
    if (d.length) {
      last.current = { x: d.x, z: d.z };
      if (
        Math.hypot(v.x, v.z) < CONFIG.maxSpeed ||
        s.elapsed - dashAt.current < 0.24
      )
        rb.applyImpulse(
          {
            x: d.x * CONFIG.force * CONFIG.step,
            y: 0,
            z: d.z * CONFIG.force * CONFIG.step,
          },
          true,
        );
    }
    if (input.dash) {
      input.dash = false;
      if (s.cooldown <= 0 && pos.y > 0.1) {
        const aim = d.length ? d : last.current;
        rb.applyImpulse(
          {
            x: aim.x * CONFIG.dashImpulse,
            y: 0,
            z: aim.z * CONFIG.dashImpulse,
          },
          true,
        );
        dashAt.current = s.elapsed;
        s.dash();
        s.effect({
          x: pos.x,
          y: pos.y,
          z: pos.z,
          color: "#a8e8ff",
          kind: "dash",
        });
      }
    }
  });
  useFrame((_, dt) => {
    const rb = ref.current;
    if (!rb) return;
    const s = useGame.getState();
    if (flash.current)
      flash.current.emissiveIntensity =
        s.elapsed - dashAt.current < 0.25
          ? 2
          : 0.18 + Math.sin(s.elapsed * 2) * 0.08;
    if (s.status === "playing") {
      tick.current += dt;
      if (tick.current > 0.035) {
        tick.current = 0;
        const p = rb.translation();
        trailPoints.current.unshift(new THREE.Vector3(p.x, p.y, p.z));
        trailPoints.current = trailPoints.current.slice(0, 10);
      }
    }
    trail.current?.children.forEach((c, i) => {
      const p = trailPoints.current[i];
      c.visible = !!p && s.elapsed - dashAt.current < 0.45;
      if (p) c.position.copy(p);
      c.scale.setScalar((1 - i / 10) * 0.22);
    });
  });
  return (
    <>
      <RigidBody
        ref={ref}
        colliders={false}
        position={[0, 0.5, 1.4]}
        linearDamping={2.1}
        angularDamping={1.6}
        ccd
        canSleep
        friction={CONFIG.friction}
        restitution={CONFIG.restitution}
        name="player"
      >
        <BallCollider args={[CONFIG.radius]} mass={CONFIG.playerMass} />
        <mesh castShadow>
          <sphereGeometry args={[CONFIG.radius, 40, 28]} />
          <meshStandardMaterial
            ref={flash}
            color="#e7f6ff"
            roughness={0.24}
            metalness={0.35}
            emissive="#54baff"
            emissiveIntensity={0.2}
          />
        </mesh>
        {[0, Math.PI / 2].map((rot, i) => (
          <mesh key={i} rotation={[rot, 0, 0.35]}>
            <torusGeometry args={[0.444, 0.035, 8, 64]} />
            <meshStandardMaterial
              color="#309fff"
              emissive="#1c8aff"
              emissiveIntensity={0.6}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        ))}
        <mesh position={[0, 0.447, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.14, 16]} />
          <meshBasicMaterial color="#103c78" />
        </mesh>
      </RigidBody>
      <group ref={trail}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} visible={false}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial
              color="#90dcff"
              transparent
              opacity={0.26 * (1 - i / 10)}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
export function TargetBall({ data }: { data: BallData }) {
  const ref = useRef<RapierRigidBody>(null);
  const registry = useContext(Bodies);
  const lastHit = useRef(-5);
  useEffect(() => {
    if (ref.current) registry.targets.set(data.id, ref.current);
    return () => {
      registry.targets.delete(data.id);
    };
  }, [data.id, registry]);
  return (
    <>
      <RigidBody
        ref={ref}
        colliders={false}
        position={data.position}
        linearDamping={0.65}
        angularDamping={0.8}
        ccd
        onContactForce={(e) => {
          const s = useGame.getState();
          if (
            s.status === "playing" &&
            e.totalForceMagnitude > 180 &&
            s.elapsed - lastHit.current > 0.4
          ) {
            lastHit.current = s.elapsed;
            const p = ref.current?.translation();
            if (p)
              s.effect({
                x: p.x,
                y: p.y,
                z: p.z,
                color: COLORS[data.color],
                kind: "hit",
              });
          }
        }}
        restitution={CONFIG.restitution}
      >
        <BallCollider
          args={[CONFIG.radius]}
          mass={CONFIG.targetMass}
          friction={CONFIG.friction}
        />
        <mesh castShadow>
          <sphereGeometry args={[CONFIG.radius, 28, 20]} />
          <meshStandardMaterial
            color={COLORS[data.color]}
            roughness={0.26}
            metalness={0.15}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.445, 0.008, 6, 40]} />
          <meshStandardMaterial color="white" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      {data.spawned && <SpawnMarker data={data} />}
    </>
  );
}
function SpawnMarker({ data }: { data: BallData }) {
  const marker = useRef<THREE.Group>(null);
  const age = useRef(0);
  useFrame((_, dt) => {
    if (useGame.getState().status === "playing") age.current += dt;
    if (marker.current) {
      marker.current.visible = age.current < 1.2;
      marker.current.scale.setScalar(1 + Math.sin(age.current * 10) * 0.1);
    }
  });
  return (
    <group ref={marker} position={[data.position[0], 0.03, data.position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.64, 32]} />
        <meshBasicMaterial
          color={COLORS[data.color]}
          transparent
          opacity={0.7}
        />
      </mesh>
      <Html center position={[0, 1.5, 0]}>
        <span className="drop-warning">↓</span>
      </Html>
    </group>
  );
}
