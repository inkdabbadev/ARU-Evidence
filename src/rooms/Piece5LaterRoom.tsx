import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import CaseFrame from "../components/CaseFrame";
import { useGame } from "../state/GameContext";
import { useSound } from "../hooks/useSound";
import "./LaterChat.css";

const messages = [
  { name: "Aaru", text: "I'll show you later." },
  { name: "Bhuvi", text: "I'll tell you properly later." },
  { name: "Aaru", text: "Will reply to everything later." },
  { name: "Bhuvi", text: "Wait I have a whole story.\nLater." },
  { name: "Aaru", text: "I have follow-up questions.\nWill ask later." },
  { name: "Bhuvi", text: "Can we do this later?" },
];

export default function Piece5LaterRoom() {
  const { addPiece, next } = useGame();
  const play = useSound();
  const reduced = useReducedMotion();
  const [sent, setSent] = useState(false);
  const [progress, setProgress] = useState(12);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [ready, setReady] = useState(false);
  const [reveal, setReveal] = useState(0);
  const chatLog = useRef<HTMLDivElement>(null);
  const sentOnce = useRef(false);
  const claimed = useRef(false);
  useEffect(() => {
    const levels = [28, 43, 61, 76, 89, 99];
    const timers = levels.flatMap((level, i) => [
      setTimeout(() => setVisibleMessages(i + 1), 600 + i * 1150),
      setTimeout(() => setProgress(level), 1050 + i * 1150),
    ]);
    timers.push(setTimeout(() => setReady(true), 7800));
    return () => timers.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    chatLog.current?.scrollTo({ top: chatLog.current.scrollHeight, behavior: reduced ? "instant" : "smooth" });
  }, [visibleMessages, sent, reduced]);
  useEffect(() => {
    if (!sent) return;
    const start = performance.now();
    const interval = setInterval(() => setProgress(99 + Math.min(1, (performance.now() - start) / 600)), 40);
    const timers = [
      setTimeout(() => { clearInterval(interval); setProgress(100); setReveal(1); }, 650),
      setTimeout(() => setReveal(2), 2100),
      setTimeout(() => setReveal(3), 3500),
      setTimeout(() => setReveal(4), 4700),
    ];
    if (chatLog.current) chatLog.current.scrollTo({ top: chatLog.current.scrollHeight, behavior: reduced ? "instant" : "smooth" });
    return () => { clearInterval(interval); timers.forEach(clearTimeout); };
  }, [sent, reduced]);
  function send() { if (!ready || sentOnce.current) return; sentOnce.current = true; setSent(true); play("click"); }
  return <CaseFrame className={`later-mutual ${sent ? "later-phase-shared" : "later-phase-ready"}`}>
    
    <div className="archive-content later-content">
      <header className="later-heading"><span className="artifact-kicker">EXHIBIT 05 / UNFINISHED CONVERSATIONS</span><h1>We'll talk <em>later.</em></h1><p>One more message. What's the worst that could happen?</p></header>
      <div className="later-layout">
        <motion.section className="later-chat" aria-label="Aaru and Bhuvi's shared conversation" animate={reveal === 1 && !reduced ? { x: [0, -3, 3, -2, 0] } : { x: 0 }} transition={{ duration: .4 }}>
          <div className="later-chat-header"><span className="later-avatar" aria-hidden="true">A</span><div><strong>Aaru &amp; Bhuvi</strong><span>collectively excellent at saying "later."</span></div><span className="later-chat-call" aria-hidden="true">☎</span></div>
          <div className="later-chat-log" ref={chatLog} role="log" aria-label="Messages from both Aaru and Bhuvi" aria-live="polite">
            <span className="later-chat-date">SOMEWHERE BETWEEN EVERYTHING</span>
            {messages.slice(0, visibleMessages).map((message, i) => <motion.div initial={{ opacity: 0, y: reduced ? 0 : 12, scale: reduced ? 1 : .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .35 }} key={i} className={`later-bubble ${i % 2 ? "later-outgoing" : "later-incoming"}`}><span className="later-message-name">{message.name}</span><p style={{ whiteSpace: "pre-line" }}>{message.text}</p><span className="later-message-time">{`21:${10+i}`} {i%2 ? "✓✓" : ""}</span></motion.div>)}
            <AnimatePresence>{sent && <motion.div className="later-bubble later-shared-message" initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><span className="later-message-name">Aaru &amp; Bhuvi</span><p>Later, then.</p><span className="later-message-time">✓✓</span></motion.div>}</AnimatePresence>
          </div>
          <div className="later-compose"><span>Surely one more "later" won't hurt...</span><button className="later-send focus-ring" disabled={!ready || sent} onClick={send} aria-label="Send one more later">➤</button></div>
        </motion.section>
        <section className="later-pressure" aria-label="Later capacity">
          <div className="later-meter-label"><span>LATER CAPACITY</span><span>{reveal >= 2 ? "IMPRESSIVE." : ""}</span></div>
          <div className="later-capacity-number" aria-hidden="true">{Math.floor(progress)}<span>%</span></div>
          <motion.div className={`later-meter ${reveal === 1 ? "later-meter-slam" : ""}`} role="progressbar" aria-label="Shared later capacity" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress)} animate={reveal === 1 && !reduced ? { x: [0, -3, 3, 0] } : { x: 0 }} transition={{ duration: .4 }}><div className="later-meter-fill" style={{ width: `${progress}%` }} /></motion.div>
          {reveal === 1 ? <p className="later-meter-caption" role="status">oh.</p> : reveal >= 2 ? <motion.p className="later-meter-caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Collectively achieved. Impressive.</motion.p> : <p className="later-warning">{ready ? "Surely we can fit one more..." : "Recovering our shared backlog..."}</p>}
          {reveal >= 2 && <motion.div className="later-overload" initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }}><h2 role="status">WE HAVE A LOT<br />OF "LATER."</h2><p>To be fair, we're both very good at this.</p>{reveal >= 3 && <motion.p className="later-more-time" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Maybe we just need a little more time.</motion.p>}</motion.div>}
          {reveal >= 4 && <motion.button className="later-continue focus-ring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { if (claimed.current) return; claimed.current = true; addPiece(5); next(); }}>COLLECT EVIDENCE →</motion.button>}
        </section>
      </div>
    </div>
  </CaseFrame>;
}
