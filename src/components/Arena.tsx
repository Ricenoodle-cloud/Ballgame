import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";
import { COLORS, CONFIG, HOLES } from "../game/config";
import { createArenaGeometry } from "../game/arenaGeometry";
export function Arena() {
  const geo = useMemo(createArenaGeometry, []);
  const collision = useMemo(() => {
    const positions = new Float32Array(geo.attributes.position.array);
    const indices = geo.index ? new Uint32Array(geo.index.array) : Uint32Array.from({ length: positions.length / 3 }, (_, i) => i);
    return { positions, indices };
  }, [geo]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <group>
    {/* The SAME perforated circular mesh is used for rendering and physics.
        No cylinder/box collider can span a well or the outside of the disk. */}
    <RigidBody type="fixed" colliders={false} name="circular-arena">
      <TrimeshCollider args={[collision.positions, collision.indices]} friction={CONFIG.friction} restitution={0.15} />
      <mesh geometry={geo} receiveShadow castShadow>
        <meshStandardMaterial attach="material-0" color="#e9dfd5" roughness={0.74} metalness={0.08} />
        <meshStandardMaterial attach="material-1" color="#b8a8bb" roughness={0.8} />
      </mesh>
    </RigidBody>
    {/* Side decorations are open rings, never solid caps beneath the wells. */}
    {[-0.18, -0.7, -1.04].map((y,i) => <mesh key={y} rotation={[Math.PI / 2,0,0]} position={[0,y,0]}>
      <torusGeometry args={[CONFIG.arenaRadius + (i === 2 ? -0.2 : 0.015), i === 2 ? 0.14 : 0.045, 8, 192]} />
      <meshStandardMaterial color={i === 2 ? '#c2b1c9' : '#c6a56b'} roughness={0.45} metalness={0.4} />
    </mesh>)}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.91,0]}>
      <ringGeometry args={[8.65,9.18,192]} /><meshStandardMaterial color="#d7c5cb" side={THREE.DoubleSide} />
    </mesh>
    {Array.from({length:48},(_,i)=>{
      const a=i*Math.PI/24;
      return <mesh key={i} position={[Math.cos(a)*8.7,0.012,Math.sin(a)*8.7]} rotation={[-Math.PI/2,0,-a]}>
        <planeGeometry args={[i%4===0 ? .22 : .08,.025]} /><meshBasicMaterial color="#b69b70" transparent opacity={.6} />
      </mesh>;
    })}
    {/* Central compass is decorative, nonphysical and clear of all wells. */}
    {[1.1,1.22].map(radius=><mesh key={radius} rotation={[-Math.PI/2,0,0]} position={[0,.012,0]}>
      <ringGeometry args={[radius,radius+.015,96]} /><meshBasicMaterial color="#b99a68" transparent opacity={.45} />
    </mesh>)}
    {HOLES.map(h=><group key={h.id} position={[h.x,0,h.z]}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,.022,0]}>
        <ringGeometry args={[CONFIG.holeRadius,CONFIG.holeRadius+.16,96]} />
        <meshStandardMaterial color={COLORS[h.color]} emissive={COLORS[h.color]} emissiveIntensity={.35} roughness={.35} />
      </mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,.018,0]}>
        <ringGeometry args={[1.24,1.265,96]} /><meshStandardMaterial color="#c4a56c" metalness={.5} roughness={.4} />
      </mesh>
      <mesh position={[0,-.6,0]}>
        <cylinderGeometry args={[CONFIG.holeRadius-.02,CONFIG.holeRadius-.02,.9,96,1,true]} /><meshBasicMaterial color="#747087" side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.1,0]}>
        <circleGeometry args={[CONFIG.holeRadius,64]} /><meshBasicMaterial color="#49465f" />
      </mesh>
    </group>)}
  </group>;
}
