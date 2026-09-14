import { useCallback, useEffect, useRef } from "react";
import { useGame } from "../state/GameContext";

type SoundName = "key" | "drawer" | "beep" | "success" | "water" | "unlock" | "click" | "error";

let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  return sharedCtx;
}

/** Tiny, sparing sound design. Every sound is synthesised — no audio files to ship. */
export function useSound() {
  const { soundOn } = useGame();
  const lastPlayed = useRef<number>(0);

  const tone = useCallback(
    (ctx: AudioContext, freq: number, start: number, duration: number, type: OscillatorType = "sine", gainPeak = 0.05) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(gainPeak, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    },
    []
  );

  const play = useCallback(
    (name: SoundName) => {
      if (!soundOn || name === "click") return;
      const now = performance.now();
      // avoid rapid-fire spam
      if (now - lastPlayed.current < 60) return;
      lastPlayed.current = now;

      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime;

      switch (name) {
        case "beep":
          tone(ctx, 880, t, 0.08, "square", 0.04);
          tone(ctx, 880, t + 0.12, 0.08, "square", 0.04);
          break;
        case "drawer":
          tone(ctx, 140, t, 0.35, "sawtooth", 0.035);
          tone(ctx, 90, t + 0.12, 0.25, "sawtooth", 0.03);
          break;
        case "key":
          tone(ctx, 660, t, 0.12, "triangle", 0.05);
          tone(ctx, 990, t + 0.1, 0.18, "triangle", 0.05);
          tone(ctx, 1320, t + 0.22, 0.28, "sine", 0.045);
          break;
        case "success":
          tone(ctx, 523, t, 0.12, "sine", 0.05);
          tone(ctx, 659, t + 0.1, 0.12, "sine", 0.05);
          tone(ctx, 784, t + 0.2, 0.22, "sine", 0.05);
          break;
        case "water":
          for (let i = 0; i < 6; i++) {
            tone(ctx, 300 + Math.random() * 400, t + i * 0.05, 0.09, "sine", 0.02);
          }
          break;
        case "unlock":
          tone(ctx, 200, t, 0.1, "square", 0.04);
          tone(ctx, 400, t + 0.09, 0.1, "square", 0.04);
          tone(ctx, 700, t + 0.18, 0.3, "sine", 0.05);
          break;
        case "error":
          tone(ctx, 180, t, 0.22, "sawtooth", 0.04);
          break;
      }
    },
    [soundOn, tone]
  );

  return play;
}

/** Quiet scene ambience using the same shared audio context and saved sound preference. */
export function useNightAmbience(active: boolean) {
  const { soundOn } = useGame();
  useEffect(() => {
    if (!active || !soundOn) return;
    const ctx = getCtx();
    if (!ctx) return;
    void ctx.resume();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < data.length; i++) { previous = (previous + (Math.random() * 2 - 1) * .025) / 1.025; data[i] = previous; }
    const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 380;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(.035, ctx.currentTime + 4);
    source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start();
    return () => { source.stop(); source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }, [active, soundOn]);
}
