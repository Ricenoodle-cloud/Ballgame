import { create } from "zustand";
import {
  CONFIG,
  LEVELS,
  initialBalls,
  type BallData,
  type ColorKey,
} from "./config";
export type Status =
  "menu" | "playing" | "paused" | "falling" | "failed" | "victory";
export type Effect = {
  id: number;
  x: number;
  y: number;
  z: number;
  color: string;
  text?: string;
  kind: "score" | "wrong" | "dash" | "hit" | "spawn" | "win";
  born: number;
};
export type Resolution = {
  id: string;
  holeColor?: ColorKey;
  x: number;
  z: number;
};
function readUnlock() {
  try {
    return localStorage.getItem("orbit-ball-unlocked") === "true";
  } catch {
    return false;
  }
}
type State = {
  status: Status;
  level: number;
  score: number;
  session: number;
  balls: BallData[];
  unlocked: boolean;
  elapsed: number;
  cooldown: number;
  effects: Effect[];
  reason: string;
  start: (level: number) => void;
  menu: () => void;
  pause: () => void;
  tick: (dt: number) => void;
  dash: () => void;
  effect: (e: Omit<Effect, "id" | "born">) => void;
  resolve: (rows: Resolution[]) => void;
  fall: () => void;
  finishFall: () => void;
  spawn: (b: BallData) => void;
};
let effectId = 0;
export const useGame = create<State>((set, get) => ({
  status: "menu",
  level: 1,
  score: 0,
  session: 0,
  balls: initialBalls(),
  unlocked: readUnlock(),
  elapsed: 0,
  cooldown: 0,
  effects: [],
  reason: "",
  start: (level) => {
    if (level === 2 && !get().unlocked) return;
    set((s) => ({
      status: "playing",
      level,
      score: 0,
      session: s.session + 1,
      balls: initialBalls(),
      elapsed: 0,
      cooldown: 0,
      effects: [],
      reason: "",
    }));
  },
  menu: () =>
    set((s) => ({
      status: "menu",
      balls: initialBalls(),
      session: s.session + 1,
      score: 0,
      effects: [],
      elapsed: 0,
      cooldown: 0,
    })),
  pause: () =>
    set((s) => ({
      status:
        s.status === "playing"
          ? "paused"
          : s.status === "paused"
            ? "playing"
            : s.status,
    })),
  tick: (dt) =>
    set((s) =>
      s.status === "playing"
        ? {
            elapsed: s.elapsed + dt,
            cooldown: Math.max(0, s.cooldown - dt),
            effects: s.effects.filter((e) => s.elapsed - e.born < 1.5),
          }
        : {},
    ),
  dash: () => set({ cooldown: CONFIG.dashCooldown }),
  effect: (e) =>
    set((s) => ({
      effects: [
        ...s.effects.slice(-35),
        { ...e, id: ++effectId, born: s.elapsed },
      ],
    })),
  resolve: (rows) => {
    const s = get();
    if (s.status !== "playing") return;
    const unique = new Map(rows.map((r) => [r.id, r]));
    let score = s.score;
    const effects = [...s.effects];
    const balls = s.balls.filter((b) => {
      const r = unique.get(b.id);
      if (!r) return true;
      const correct = r.holeColor === b.color;
      if (correct) score++;
      if (r.holeColor)
        effects.push({
          id: ++effectId,
          x: r.x,
          y: 0.3,
          z: r.z,
          color: correct ? COLORS_LOCAL[b.color] : "#f998a9",
          text: correct ? "+1" : "颜色不匹配",
          kind: correct ? "score" : "wrong",
          born: s.elapsed,
        });
      return false;
    });
    const won = score >= LEVELS[s.level - 1].goal;
    let unlocked = s.unlocked;
    if (won && s.level === 1) {
      unlocked = true;
      try {
        localStorage.setItem("orbit-ball-unlocked", "true");
      } catch {}
    }
    const impossible =
      !won && s.level === 1 && score + balls.length < LEVELS[0].goal;
    set({
      balls,
      score,
      effects,
      status: won ? "victory" : impossible ? "failed" : s.status,
      unlocked,
      reason: impossible ? "剩余彩球不足以达到目标，再试一次吧。" : "",
    });
  },
  fall: () => {
    if (get().status === "playing")
      set({ status: "falling", reason: "你的球掉入了洞口或离开了平台。" });
  },
  finishFall: () => {
    if (get().status === "falling") set({ status: "failed" });
  },
  spawn: (b) =>
    set((s) =>
      s.status === "playing" && s.balls.length < CONFIG.maxBalls
        ? { balls: [...s.balls, b] }
        : {},
    ),
}));
const COLORS_LOCAL: Record<ColorKey, string> = {
  red: "#ff668b",
  blue: "#55baff",
  green: "#59e5ba",
  yellow: "#ffd263",
};
