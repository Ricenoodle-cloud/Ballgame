import * as THREE from "three";
import { CONFIG, HOLES } from "./config";
export function createArenaGeometry() {
  const s = new THREE.Shape();
  s.absarc(0, 0, CONFIG.arenaRadius, 0, Math.PI * 2, false);
  for (const h of HOLES) {
    const p = new THREE.Path();
    p.absarc(h.x, -h.z, CONFIG.holeRadius, 0, Math.PI * 2, true);
    s.holes.push(p);
  }
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.9,
    bevelEnabled: false,
    curveSegments: 64,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -0.9, 0);
  return geo;
}
