import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useGame, type Effect } from "../game/store";
function Burst({ effect }: { effect: Effect }) {
  const group = useRef<THREE.Group>(null);
  const age = useRef(0);
  const cleaned = useRef(false);
  const particles = useMemo(
    () =>
      Array.from({ length: effect.kind === "explosion" ? 32 : effect.kind === "score" ? 18 : effect.kind === "combo" ? 12 : 8 }, (_, i) => {
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
    if (age.current > 1.5 && !cleaned.current && effect.id !== 999) {
      cleaned.current = true;
      useGame.setState(s => ({ effects: s.effects.filter(e => e.id !== effect.id) }));
    }
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
      {effect.kind === "explosion" && <Shockwave />}
      {effect.kind === "combo" && <ComboRosette />}
      {effect.kind === "wrong" && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02 - effect.y, 0]}><ringGeometry args={[1.05, 1.28, 40]} /><meshBasicMaterial color="#ff244c" transparent opacity={0.8} /></mesh>}
      {effect.text && (
        <Html center position={[0, 1.2, 0]}>
          <span
            className={`score-float ${effect.kind === "wrong" ? "wrong" : ""} ${effect.kind === "combo" ? "combo-float" : ""}`}
            style={{ color: effect.kind === "score" ? "#a37c32" : effect.color }}
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


function Shockwave() {
  const ref = useRef<THREE.Mesh>(null);
  const age = useRef(0);
  useFrame((_, dt) => {
    if (useGame.getState().status === "paused") return;
    age.current += dt;
    if (!ref.current) return;
    ref.current.scale.setScalar(age.current * 5);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - age.current);
  });
  return <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.8, 1, 40]} /><meshBasicMaterial color="#ffb14e" transparent opacity={0.8} depthWrite={false} /></mesh>;
}
function ComboRosette(){
  const ref=useRef<THREE.Group>(null);const age=useRef(0);
  useFrame((_,dt)=>{if(useGame.getState().status==='paused')return;age.current+=dt;if(ref.current){const p=Math.min(1,age.current/1.5);ref.current.scale.setScalar(.65+p*.8);ref.current.rotation.y=age.current*.35;ref.current.children.forEach((c,i)=>{c.rotation.z=i*Math.PI/4;});}});
  return <group ref={ref} rotation={[-Math.PI/2,0,0]} position={[0,.15,0]}>{Array.from({length:8},(_,i)=><mesh key={i} position={[Math.cos(i*Math.PI/4)*.5,Math.sin(i*Math.PI/4)*.5,0]}><planeGeometry args={[.38,.025]} /><meshBasicMaterial color="#e7c77e" transparent opacity={.7} depthWrite={false}/></mesh>)}</group>;
}
