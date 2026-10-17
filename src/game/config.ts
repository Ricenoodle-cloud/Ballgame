export const COLORS = {
  red: "#d97b94",
  blue: "#70a9cf",
  green: "#79b9a5",
  yellow: "#e1bd67",
} as const;
export type ColorKey = keyof typeof COLORS;
export const COLOR_NAMES: Record<ColorKey, string> = {
  red: "珊瑚红",
  blue: "天空蓝",
  green: "薄荷绿",
  yellow: "日光黄",
};
export const CONFIG = {
  radius: 0.45,
  playerMass: 1,
  targetMass: 1.7,
  targetDamping: 0.35,
  targetAngularDamping: 0.5,
  force: 15,
  maxSpeed: 4.8,
  dashImpulse: 10.5,
  dashCooldown: 1.5,
  gravity: -18,
  step: 1 / 120,
  friction: 0.55,
  restitution: 0.32,
  arenaRadius: 9,
  edgeMargin: 1.1,
  width: 18,
  depth: 18,
  holeRadius: 1.05,
  spawnInitial: 4,
  spawnMinimum: 1.5,
  bombWarning: 1.5,
  bombRadius: 0.56,
  blastRadius: 2.4,
  blastImpulse: 4.5,
  maxBombs: 5,
  maxBalls: 40,
};
export const HOLES: { id: string; color: ColorKey; x: number; z: number }[] = [
  { id: "h-red", color: "red", x: -4.4, z: -3.6 },
  { id: "h-blue", color: "blue", x: 4.4, z: -3.6 },
  { id: "h-green", color: "green", x: -4.4, z: 3.6 },
  { id: "h-yellow", color: "yellow", x: 4.4, z: 3.6 },
];
export const LEVELS = [
  {
    id: 1,
    name: "静态推球",
    en: "THE FIRST PUSH",
    goal: 10,
    description: "每一次轻推，都是连锁反应的开始。",
  },
  {
    id: 2,
    name: "天上来敌",
    en: "BOMB ALERT",
    goal: 20,
    description: "躲避空袭，把混合彩球推入同色洞口。",
  },
];
export type BallData = {
  id: string;
  color: ColorKey;
  position: [number, number, number];
  spawned?: boolean;
};
// Each quadrant receives every color, with constrained random positions.
export function initialBalls(count = 16, random = Math.random): BallData[] {
  const balls: BallData[] = [];
  const colors = Object.keys(COLORS) as ColorKey[];
  for (let q = 0; q < 4; q++) {
    const palette = Array.from({ length: count / 4 }, (_, i) => colors[i % 4]);
    for (let i = palette.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [palette[i], palette[j]] = [palette[j], palette[i]];
    }
    for (let i = 0; i < palette.length; i++) {
      let position: [number, number, number] | undefined;
      for (let attempt = 0; attempt < 5000; attempt++) {
        const { x, z } = sampleDisk(CONFIG.arenaRadius - CONFIG.edgeMargin, random, q);
        if (Math.hypot(x, z - 1.4) < 1.65 ||
            HOLES.some(h => Math.hypot(h.x - x, h.z - z) < 2) ||
            balls.some(b => Math.hypot(b.position[0] - x, b.position[2] - z) < 1.15)) continue;
        position = [x, 0.5, z];
        break;
      }
      if (!position) throw new Error("Unable to sample safe target positions");
      balls.push({ id: `initial-${q}-${i}`, color: palette[i], position });
    }
  }
  return balls;
}
export function randomBall(id: string): BallData {
  const { x, z } = safeBombPoint();
  return {
    id,
    color: (Object.keys(COLORS) as ColorKey[])[Math.floor(Math.random() * 4)],
    position: [x, 8, z],
    spawned: true,
  };
}
export function holeAt(x: number, z: number) {
  return HOLES.find(
    (h) => Math.hypot(h.x - x, h.z - z) < CONFIG.holeRadius + 0.15,
  );
}

// sqrt(U) gives uniform area density, including when restricted to a quadrant.
export function sampleDisk(radius: number, random = Math.random, quadrant?: number) {
  const angle = quadrant === undefined ? random() * Math.PI * 2 :
    (quadrant < 2 ? Math.PI : 0) + (quadrant % 2 ? Math.PI / 2 : 0) + random() * Math.PI / 2;
  const distance = Math.sqrt(random()) * radius;
  return { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance };
}
export function safeBombPoint(random = Math.random) {
  for (let i = 0; i < 5000; i++) {
    const p = sampleDisk(CONFIG.arenaRadius - CONFIG.bombRadius - 0.5, random);
    if (HOLES.every(h => Math.hypot(h.x - p.x, h.z - p.z) > CONFIG.holeRadius + CONFIG.bombRadius + 0.2)) return p;
  }
  throw new Error("Unable to sample bomb landing point");
}
