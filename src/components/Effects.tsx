import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useGame, type Effect } from "../game/store";
function Burst({ effect }: { effect: Effect }) {
  const group = useRef<THREE.Group>(null);
  const age = useRef(0);
  const particles = useMemo(
    () =>
      Array.from({ length: effect.kind === "score" ? 18 : 8 }, (_, i) => {
        const angle = i * 2.399;
        return new THREE.Vector3(
          Math.cos(angle) * (1 + (i % 3) * 0.4),
          1.5 + (i % 4) * 0.4,
          Math.sin(angle) * (1 + (i % 3) * 0.4),
        );
      }),
    [effect.kind],
  );
  useFrame((_, dt) => {
    if (useGame.getState().status === "paused") return;
    age.current += dt;
    if (!group.current) return;
    group.current.visible = age.current < 1.4;
    group.current.children.forEach((child, i) => {
      if (i < particles.length) {
        const v = particles[i],
          t = age.current;
        child.position.set(v.x * t, v.y * t - 2 * t * t, v.z * t);
        child.scale.setScalar(Math.max(0, 1 - t / 1.4));
      }
    });
  });
  return (
    <group ref={group} position={[effect.x, effect.y, effect.z]}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.055, 5, 5]} />
          <meshBasicMaterial color={effect.color} />
        </mesh>
      ))}
      {effect.text && (
        <Html center position={[0, 1.2, 0]}>
          <span
            className={`score-float ${effect.kind === "wrong" ? "wrong" : ""}`}
            style={{ color: effect.color }}
          >
            {effect.text}
          </span>
        </Html>
      )}
    </group>
  );
}
export function Effects() {
  const effects = useGame((s) => s.effects);
  const status = useGame((s) => s.status);
  return (
    <>
      {effects.map((e) => (
        <Burst key={e.id} effect={e} />
      ))}
      {status === "victory" && (
        <Burst
          effect={{
            id: 999,
            x: 0,
            y: 2,
            z: 0,
            color: "#ffe09c",
            kind: "score",
            born: 0,
          }}
        />
      )}
    </>
  );
}
