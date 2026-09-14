import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useGame } from "../state/GameContext";
import { useNightAmbience } from "../hooks/useSound";
import NightSky from "./NightSky";
import "./DoNothing.css";

const responses = ["That was something.", "Aaru.", "The assignment was extremely clear.", "DO. NOTHING."];
type Phase = "intro" | "sky" | "stay" | "piece";
export default function Piece6DoNothingRoom() {
  const { addPiece, goTo } = useGame();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("intro");
  useNightAmbience(phase !== "intro");
  const [leaving,setLeaving]=useState(false);
  const departure=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>clearTimeout(departure.current),[]);
  const [elapsed, setElapsed] = useState(0);
  const [stayElapsed, setStayElapsed] = useState(0);
  const [pieceElapsed, setPieceElapsed] = useState(0);
  const [response, setResponse] = useState("");
  const [disturbance, setDisturbance] = useState(0);
  const clicks = useRef(0);
  const claimed = useRef(false);
  const responseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(responseTimer.current), []);
  useEffect(() => {
    if (phase === "intro") return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = document.hidden ? 0 : Math.min((now - previous) / 1000, .5);
      previous = now;
      if (phase === "sky") setElapsed(t => Math.min(45, t + delta));
      if (phase === "stay") setStayElapsed(t => Math.min(18, t + delta));
      if (phase === "piece") setPieceElapsed(t => Math.min(23, t + delta));
    }, 100);
    return () => clearInterval(timer);
  }, [phase]);
  function disturb() {
    if (phase !== "sky" && phase !== "stay") return;
    setResponse(responses[Math.min(clicks.current++, 3)]);
    setDisturbance(performance.now());
    clearTimeout(responseTimer.current);
    responseTimer.current = setTimeout(() => setResponse(""), 1250);
  }
  function revealPiece() { setResponse(""); clearTimeout(responseTimer.current); setPhase("piece"); }
  const line = phase === "sky" ? elapsed >= 31.5 && elapsed < 34 ? "This is nice." : elapsed >= 36 && elapsed < 41 ? "Good company does go a long way." : "" : phase === "stay" && stayElapsed >= 13 && stayElapsed < 15.5 ? "Correct answer." : "";
  return <motion.main className={`nothing-scene nothing-${phase} ${leaving?"night-departing":""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .8 }}>
    {phase === "intro" ? <div className="nothing-intro"><span>EXHIBIT 06</span><h1>DO NOTHING</h1><p>No, seriously.</p><button onClick={() => setPhase("sky")}>okay</button></div> : <>
      <div className="night-environment" onClick={disturb}>
        <NightSky elapsed={elapsed} stayElapsed={stayElapsed} pieceElapsed={pieceElapsed} phase={phase} disturbance={disturbance} reduced={!!reduced} />
      </div>
      <p className={`nothing-instruction ${elapsed >= 7.5 || phase !== "sky" ? "nothing-hidden" : ""}`}>DO NOTHING FOR 30 SECONDS.</p>
      <p className={`nothing-response ${response ? "" : "nothing-hidden"}`} aria-live="polite">{response || "\u00a0"}</p>
      <p className={`nothing-line ${line ? "" : "nothing-hidden"} ${phase === "stay" ? "nothing-tiny" : ""}`} aria-live="polite">{line || "\u00a0"}</p>
      {phase === "sky" && elapsed >= 41 && <motion.div className="nothing-choices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}><button onClick={() => { setResponse(""); setPhase("stay"); }}>stay a little longer</button><button onClick={revealPiece}>collect evidence →</button></motion.div>}
      {phase === "stay" && stayElapsed >= 16 && <motion.div className="nothing-choices" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><button onClick={revealPiece}>collect evidence →</button></motion.div>}
      {phase === "piece" && <div className="night-piece-copy"><h2 className={pieceElapsed < 15 ? "nothing-hidden" : ""}>TIME</h2><p className={pieceElapsed < 17 ? "nothing-hidden" : ""}>PIECE 06 / 06<br />RECOVERED</p>{pieceElapsed >= 20 && <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { if (claimed.current) return; claimed.current = true; setLeaving(true); departure.current=setTimeout(()=>{addPiece(6); goTo("final-puzzle");},1300); }}>collect evidence →</motion.button>}</div>}
    </>}
  </motion.main>;
}
