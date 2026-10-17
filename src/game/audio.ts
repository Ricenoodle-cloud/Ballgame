// All sounds are synthesized locally; no network or audio assets.
class GameAudio {
  enabled = true;
  volume = 0.35;
  private context?: AudioContext;
  unlock() {
    if (typeof window === "undefined") return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
    } catch { /* Audio is optional. */ }
  }
  play(kind: "score" | "wrong" | "explosion" | "hit") {
    if (!this.enabled || !this.context || this.context.state !== "running") return;
    const ctx = this.context;
    const notes = kind === "score" ? [880, 1320] : kind === "explosion" ? [85, 42] : [190, 110];
    notes.forEach((frequency, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.075;
      oscillator.type = kind === "score" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.6, start + 0.18);
      gain.gain.setValueAtTime(Math.max(0.001, this.volume * 0.15), start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.23);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.25);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
}
export const audio = new GameAudio();
