export const COLORS = {
  red: "#ff668b",
  blue: "#55baff",
  green: "#59e5ba",
  yellow: "#ffd263",
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
  targetMass: 3.5,
  force: 15,
  maxSpeed: 4.8,
  dashImpulse: 10.5,
  dashCooldown: 1.5,
  gravity: -18,
  step: 1 / 120,
  friction: 0.55,
  restitution: 0.32,
  width: 18,
  depth: 14,
  holeRadius: 1.05,
  spawnInitial: 3,
  spawnMinimum: 0.8,
  maxBalls: 40,
};
export const HOLES: { id: string; color: ColorKey; x: number; z: number }[] = [
  { id: "h-red", color: "red", x: -6.4, z: -4.3 },
  { id: "h-blue", color: "blue", x: 6.4, z: -4.3 },
  { id: "h-green", color: "green", x: -6.4, z: 4.3 },
  { id: "h-yellow", color: "yellow", x: 6.4, z: 4.3 },
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
    en: "COLOR RAIN",
    goal: 20,
    description: "彩球从天而降，在混乱中找到你的节奏。",
  },
];
export type BallData = {
  id: string;
  color: ColorKey;
  position: [number, number, number];
  spawned?: boolean;
};
export function initialBalls(): BallData[] {
  return HOLES.flatMap((h, c) =>
    [
      [h.x * 0.69, h.z * 0.68],
      [h.x * 0.4, h.z * 0.84],
      [h.x * 0.78, h.z * 0.28],
      [h.x * 0.4, h.z * 0.33],
    ].map(([x, z], i) => ({
      id: `initial-${c}-${i}`,
      color: h.color,
      position: [x, 0.5, z],
    })),
  );
}
export function randomBall(id: string): BallData {
  let x = 0,
    z = 0;
  for (let i = 0; i < 30; i++) {
    x = (Math.random() - 0.5) * 15;
    z = (Math.random() - 0.5) * 11;
    if (HOLES.every((h) => Math.hypot(h.x - x, h.z - z) > 2)) break;
  }
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
