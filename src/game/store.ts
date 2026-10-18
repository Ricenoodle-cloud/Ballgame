import { audio } from "./audio";
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
  kind: "score" | "wrong" | "dash" | "hit" | "spawn" | "win" | "explosion" | "combo";
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
  combo: number;
  comboFlashAt: number;
  session: number;
  balls: BallData[];
  unlocked: boolean;
  elapsed: number;
  cooldown: number;
  effects: Effect[];
  reason: string;
  feedback: { id: number; kind: "score" | "wrong"; text: string };
  bombHit: (id: string, x: number, z: number) => void;
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
const hitBombs = new Set<string>();
export const useGame = create<State>((set, get) => ({
  status: "menu",
  level: 1,
  score: 0,
  combo: 0,
  comboFlashAt: -Infinity,
  session: 0,
  balls: initialBalls(),
  unlocked: readUnlock(),
  elapsed: 0,
  cooldown: 0,
  effects: [],
  reason: "",
  feedback: { id: 0, kind: "score", text: "" },
  start: (level) => {
    if (level === 2 && !get().unlocked) return;
    audio.unlock();
    hitBombs.clear();
    set((s) => ({
      feedback: { id: 0, kind: "score", text: "" },
      status: "playing",
      level,
      score: 0,
      combo: 0,
      comboFlashAt: -Infinity,
      session: s.session + 1,
      balls: initialBalls(level === 2 ? 32 : 16),
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
      combo: 0,
      comboFlashAt: -Infinity,
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
    let feedback = s.feedback;
    let combo = s.combo;
    let comboFlashAt = s.comboFlashAt;
    const balls = s.balls.filter((b) => {
      const r = unique.get(b.id);
      if (!r) return true;
      const correct = r.holeColor === b.color;
      if (r.holeColor) {
        score = Math.max(0, score + (correct ? 1 : -1));
        combo = correct ? combo + 1 : 0;
        audio.play(correct ? "score" : "wrong");
        if(correct && combo%3===0){
          comboFlashAt=s.elapsed;audio.perfectCombo();
          effects.push({id:++effectId,x:0,y:2.1,z:-1.1,color:'#e7c77e',text:`完美连击 ×${combo}`,kind:'combo',born:s.elapsed});
        }
        feedback = { id: ++effectId, kind: correct ? "score" : "wrong", text: correct ? "+1" : "-1" };
      }
      if (r.holeColor)
        effects.push({
          id: ++effectId,
          x: r.x,
          y: 0.3,
          z: r.z,
          color: correct ? COLORS_LOCAL[b.color] : "#c65370",
          text: correct ? "+1" : "-1",
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
      !won && score + balls.length < LEVELS[s.level - 1].goal;
    set({
      balls,
      score,
      combo,
      comboFlashAt,
      feedback,
      effects,
      status: won ? "victory" : impossible ? "failed" : s.status,
      unlocked,
      reason: impossible ? "剩余彩球不足以达到目标，再试一次吧。" : "",
    });
  },
  bombHit: (id, x, z) => {
    const s = get();
    if (s.status !== "playing" || hitBombs.has(id)) return;
    hitBombs.add(id);
    audio.play("hit");
    set({ score: Math.max(0, s.score - 1), feedback: { id: ++effectId, kind: "wrong", text: "炸弹命中 -1" } });
    s.effect({ x, y: 0.8, z, color: "#ff526a", text: "炸弹命中 -1", kind: "wrong" });
  },
  fall: () => {
    if (get().status === "playing")
      set({ status: "falling", combo: 0, reason: "你的球掉入了洞口或离开了平台。" });
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
