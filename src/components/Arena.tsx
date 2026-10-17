import { useMemo } from "react";
import * as THREE from "three";
import {
  RigidBody,
  TrimeshCollider,
  CuboidCollider,
} from "@react-three/rapier";
import { COLORS, CONFIG, HOLES } from "../game/config";
import { createArenaGeometry } from "../game/arenaGeometry";
export function Arena() {
  const geo = useMemo(createArenaGeometry, []);
  const collision = useMemo(() => {
    const g = geo.index ? geo : geo.toNonIndexed();
    const positions = new Float32Array(g.attributes.position.array);
    const indices = g.index
      ? new Uint32Array(g.index.array)
      : Uint32Array.from({ length: positions.length / 3 }, (_, i) => i);
    return { positions, indices };
  }, [geo]);
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <TrimeshCollider
          args={[collision.positions, collision.indices]}
          friction={CONFIG.friction}
          restitution={0.15}
        />
        <mesh geometry={geo} receiveShadow castShadow>
          <meshStandardMaterial
            attach="material-0"
            color="#344b70"
            roughness={0.67}
            metalness={0.2}
          />
          <meshStandardMaterial
            attach="material-1"
            color="#16273e"
            roughness={0.8}
          />
        </mesh>
        {[
          [0, -7.1, 9.2, 0.12],
          [0, 7.1, 9.2, 0.12],
          [-9.1, 0, 0.12, 7.1],
          [9.1, 0, 0.12, 7.1],
        ].map(([x, z, w, d], i) => (
          <group key={i}>
            <CuboidCollider position={[x, 0.18, z]} args={[w, 0.24, d]} />
            <mesh position={[x, 0.08, z]} castShadow>
              <boxGeometry args={[w * 2, 0.38, d * 2]} />
              <meshStandardMaterial
                color="#6c8fba"
                metalness={0.5}
                roughness={0.35}
              />
            </mesh>
            <mesh position={[x, -0.4, z]}>
              <boxGeometry args={[w * 2, 0.035, d * 2 + 0.02]} />
              <meshBasicMaterial color="#75d8fd" />
            </mesh>
          </group>
        ))}
      </RigidBody>
      {/* Fine grid floats above the cut mesh; no solid floor spans the holes. */}
      {Array.from({ length: 15 }, (_, i) => i - 7).map((x) => (
        <mesh
          key={"dot" + x}
          position={[x, 0.012, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.012, 2.8]} />
          <meshBasicMaterial color="#6886a6" transparent opacity={0.25} />
        </mesh>
      ))}
      {HOLES.map((h) => (
        <group key={h.id} position={[h.x, 0, h.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <ringGeometry
              args={[CONFIG.holeRadius, CONFIG.holeRadius + 0.16, 64]}
            />
            <meshStandardMaterial
              color={COLORS[h.color]}
              emissive={COLORS[h.color]}
              emissiveIntensity={1.2}
              roughness={0.3}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[1.3, 1.32, 64]} />
            <meshBasicMaterial
              color={COLORS[h.color]}
              transparent
              opacity={0.3}
            />
          </mesh>
          <mesh position={[0, -0.95, 0]}>
            <cylinderGeometry
              args={[CONFIG.holeRadius, CONFIG.holeRadius, 0.6, 64, 1, true]}
            />
            <meshBasicMaterial color="#080f20" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[CONFIG.holeRadius, 48]} />
            <meshBasicMaterial color="#050a16" />
          </mesh>
        </group>
      ))}
      {[
        [-8.4, -6.4],
        [8.4, -6.4],
        [-8.4, 6.4],
        [8.4, 6.4],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.1, z]}>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 8]} />
          <meshBasicMaterial color="#abdfff" />
        </mesh>
      ))}
    </group>
  );
}
