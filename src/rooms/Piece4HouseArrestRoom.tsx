import { trackEvent } from "../analytics/tracker";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useGame } from "../state/GameContext";
import { useSound } from "../hooks/useSound";
import LittleObject from "./LittleObject";
import "./LittleThings.css";

const labels = ["MUFFY", "1000 PIECES", "RANDOM AARU UPDATE", "BURRITO MODE", "FIRM FOUNDATION", "HIGGINBOTHAMS", "AARU-CODED SKY", "VOICE NOTE"];
const sequences = [[0, 2, 1], [4, 5, 6, 7], [0, 6, 2, 5, 3]];
const sounds = ["key", "click", "beep", "drawer", "click", "drawer", "water", "beep"] as const;

export default function Piece4HouseArrestRoom() {
  const { addPiece, next } = useGame();
  const play = useSound();
  const reduced = useReducedMotion();
  const [round, setRound] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"watch" | "turn" | "almost" | "check" | "done">("watch");
  const [active, setActive] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const locked = useRef(false);
  const claimed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sound = useRef(play);
  useEffect(() => { sound.current = play; }, [play]);
  useEffect(() => {
    const scheduled: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, delay: number) => scheduled.push(setTimeout(fn, delay));
    sequences[round].forEach((object, i) => {
      later(() => { setActive(object); sound.current(sounds[object]); }, 900 + i * 1000);
      later(() => setActive(null), 1630 + i * 1000);
    });
    later(() => { setPhase("turn"); locked.current = false; }, 900 + sequences[round].length * 1000);
    return () => scheduled.forEach(clearTimeout);
  }, [round, attempt]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function later(fn: () => void, delay: number) { timers.current.push(setTimeout(fn, delay)); }
  function select(id: number) {
    if (phase !== "turn" || locked.current) return;
    trackEvent("puzzle_start", {puzzle:"memory"});
    locked.current = true;
    setActive(id); play(sounds[id]);
    if (id !== sequences[round][step]) {
      trackEvent("puzzle_attempt",{puzzle:"memory",stage:round,outcome:"retry"});
      setPhase("almost");
      later(() => { setActive(null); setStep(0); setPhase("watch"); setAttempt(a => a + 1); }, 850);
      return;
    }
    const finished = step + 1 === sequences[round].length;
    if(finished)trackEvent("puzzle_attempt",{puzzle:"memory",stage:round+1,outcome:"matched"});
    setStep(s => s + 1);
    later(() => {
      setActive(null);
      if (!finished) { locked.current = false; return; }
      setPhase("check");
      later(() => {
        if (round === 2) { trackEvent("puzzle_complete",{puzzle:"memory",stage:3}); setPhase("done"); play("success"); }
        else { setStep(0); setPhase("watch"); setRound(r => r + 1); }
      }, 850);
    }, 280);
  }
  return <motion.main className="little-things" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <header className="little-identity"><span>CASE #2711</span><span>EXHIBIT 04</span></header>
    <header className="little-heading"><h1>THE LITTLE THINGS</h1><p>Funny what sticks.</p></header>
    <div className={`little-table round-${round} ${phase === "done" ? "little-finished" : ""}`}>
      <div className="little-centre" aria-live="polite" aria-atomic="true">
        {phase !== "done" ? <><p className="little-instruction">{phase === "watch" ? "WATCH CLOSELY." : phase === "turn" ? "YOUR TURN." : phase === "almost" ? "ALMOST." : "✓"}</p><span className="little-round" aria-label={`Round ${round + 1} of 3`}>{[0, 1, 2].map(i => <i key={i} className={i <= round ? "marked" : ""} />)}</span><span className="little-active-label">{active !== null ? labels[active] : "\u00a0"}</span></> : <div className="little-result"><span>MEMORY CHECK</span><h2>PASSED ✓</h2><p>Okay wow.<br />You do remember the random stuff.</p><div className="little-prize"><LittleObject id={1} /></div><p className="little-recovered">PIECE 04 / 06<br />RECOVERED</p><button onClick={() => { if (claimed.current) return; claimed.current = true; addPiece(4); next(); }}>COLLECT EVIDENCE →</button></div>}
      </div>
      {labels.map((label, id) => <button key={label} aria-label={label} aria-pressed={active === id} disabled={phase !== "turn" || (round === 0 && id > 3) || (round === 1 && id < 4)} onClick={() => select(id)} className={`little-object object-${id} ${active === id ? "object-active" : ""} ${round === 0 && id > 3 ? "object-unintroduced" : ""}`} data-object={id} data-reduced-motion={!!reduced}><LittleObject id={id} /><span className="little-label">{label}</span></button>)}
    </div>
  </motion.main>;
}
