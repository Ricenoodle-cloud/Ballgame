import { audio } from "./audio";
import { useEffect } from "react";
import { useGame } from "./store";
export const input = { keys: new Set<string>(), dash: false };
export function useInput() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      audio.unlock();
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "ShiftLeft",
          "Space",
        ].includes(e.code)
      )
        e.preventDefault();
      input.keys.add(e.code);
      if ((e.code === "ShiftLeft" || e.code === "Space") && !e.repeat)
        input.dash = true;
      if (e.code === "Escape" && !e.repeat) useGame.getState().pause();
    };
    const up = (e: KeyboardEvent) => input.keys.delete(e.code);
    const blur = () => {
      input.keys.clear();
      input.dash = false;
      if (useGame.getState().status === "playing") useGame.getState().pause();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      input.keys.clear();
      input.dash = false;
    };
  }, []);
}
export function direction() {
  let x =
    Number(input.keys.has("KeyD") || input.keys.has("ArrowRight")) -
    Number(input.keys.has("KeyA") || input.keys.has("ArrowLeft"));
  let z =
    Number(input.keys.has("KeyS") || input.keys.has("ArrowDown")) -
    Number(input.keys.has("KeyW") || input.keys.has("ArrowUp"));
  const length = Math.hypot(x, z);
  if (length) {
    x /= length;
    z /= length;
  }
  return { x, z, length };
}
