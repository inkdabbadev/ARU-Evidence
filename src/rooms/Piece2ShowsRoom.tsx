import { trackEvent } from "../analytics/tracker";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useGame } from "../state/GameContext";
import { useSound } from "../hooks/useSound";
import { books, shelfRows, type Filler } from "./bookstoreBooks";
import "./Bookstore.css";
import Book, { ArtworkFace } from "./Book";


export default function Piece2ShowsRoom() {
  const { addPiece, next } = useGame();
  const play = useSound();
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [briefingStep, setBriefingStep] = useState(0);
  const briefingNext = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!ready) briefingNext.current?.focus(); }, [briefingStep, ready]);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<"pull" | "cover" | "open" | "piece" | "bag" | "return">("pull");
  const [beat, setBeat] = useState(0);
  const bag = useRef<HTMLDivElement>(null);
  const recoveredPiece = useRef<HTMLDivElement>(null);
  const [bagTravel,setBagTravel]=useState({x:0,y:0});
  const [nudge, setNudge] = useState<number | null>(null);
  const returning = useRef(false);
  const opened = useRef(false);
  const source = useRef<HTMLButtonElement | null>(null);
  const focus = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0, scale: .5, width: 30 });
  const returnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(returnTimer.current), []);
  const busy = useRef(false);
  const advanced = useRef(false);
  const book = selected === null ? null : books[selected];
  const target = !!book?.target;
  const pickUpPiece = () => { trackEvent("item_open", {item:"library-evidence"}); setPhase("piece"); play("click"); };
  const close = () => {
    if (phase === "bag" || phase === "return") return;
    if(book)trackEvent("book_close",{book:book.id});
    returning.current = true; setPhase("return"); setBeat(0);
    returnTimer.current = setTimeout(() => { setSelected(null); requestAnimationFrame(() => source.current?.focus({preventScroll:true})); }, reduced ? 0 : 950);
  };

  useEffect(() => { if (beat === 1 && target) play("key"); }, [beat, target, play]);

  useEffect(() => {
    if (selected === null) return;
    const timer = window.setTimeout(() => { if (!returning.current) { setPhase("cover"); focus.current?.focus(); } }, reduced ? 0 : 1150);
    const timers = target ? [2000,3100,4300,5500,7300].map((delay,index)=>window.setTimeout(()=>{
      if(returning.current || opened.current)return;
      setBeat(index+1);
    },delay)) : [];
    return () => { clearTimeout(timer); timers.forEach(clearTimeout); };
  }, [selected, target, reduced]);
  useEffect(() => {
    if (nudge === null) return;
    const timer = window.setTimeout(() => setNudge(null), 600);
    return () => clearTimeout(timer);
  }, [nudge]);
  useEffect(() => {
    if (phase !== "bag") return;
    const timer = window.setTimeout(() => { if (advanced.current) return; advanced.current = true; addPiece(2); next(); }, reduced ? 30 : 850);
    return () => clearTimeout(timer);
  }, [phase, addPiece, next, reduced]);

  function choose(index: number, button: HTMLButtonElement) {
    if (!ready || selected !== null) return;
    
    returning.current = false;
    opened.current = false;
    const rect = button.getBoundingClientRect();
    const item = books[index];
    trackEvent("book_open",{book:item.id});
    const ratio = item.artwork ? item.artwork.coverCrop.width * item.artwork.sourceAspect / item.artwork.coverCrop.height : item.coverWidth / item.coverHeight;
    setOrigin({ x: rect.x + rect.width / 2 - innerWidth / 2, y: rect.y + rect.height / 2 - innerHeight / 2, scale: rect.height / Math.min(item.coverHeight, innerHeight * .55, innerWidth * .70 / ratio), width: item.frontFacing && item.artwork ? rect.height * item.artwork.spineCrop.width * item.artwork.sourceAspect / item.artwork.spineCrop.height : button.offsetWidth });
    source.current = button;
    setPhase("pull"); setBeat(0); setSelected(index); play("click");
  }

  return <motion.main className={`bookstore ${phase === "bag" ? "bookstore-leaving" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <header className="bookstore-identity"><div>CASE #2711<br /><span>EXHIBIT 02 / HIGGINBOTHAMS</span></div><span>PIECE 02 / 06</span></header>
    {!ready && <div className="book-briefing-backdrop">
      <motion.section key={briefingStep} className="book-briefing-popup" role="dialog" aria-modal="true" aria-labelledby="book-briefing-title" initial={{opacity:0,y:reduced?0:10}} animate={{opacity:1,y:0}} transition={{duration:.25}}>
        <span className="book-briefing-kicker">EXHIBIT 02 / HIGGINBOTHAMS</span>
        <div className="book-briefing-steps" aria-label={`Instruction ${briefingStep+1} of 2`}><span className={briefingStep===0?"is-current":""}>01 / THE INCIDENT</span><span className={briefingStep===1?"is-current":""}>02 / THE CLUE</span></div>
        {briefingStep===0 ? <><h1 id="book-briefing-title">THE BOOKSTORE INCIDENT</h1><p>You were looking for books.<br/>I had a slightly different plan.</p><p className="book-briefing-aside">Somewhere on this shelf is<br/>the exact moment this became an incident.</p></> : <><h1 id="book-briefing-title">ARCHIVIST'S NOTE</h1><p>Subject was surprised.<br/>Location involved books.</p><p>Exact words were approximately:</p><blockquote>“HOW ARE YOU HERE?!”</blockquote><p className="book-briefing-aside">Find the book that sounds suspiciously familiar.</p></>}
        <div className="book-briefing-actions">{briefingStep===1&&<button onClick={()=>{setBriefingStep(0);play("click")}}>BACK</button>}<button ref={briefingNext} data-analytics-action="library-instruction-next" className="book-briefing-next" onClick={()=>{play("click");if(briefingStep===0)setBriefingStep(1);else{setReady(true);window.scrollTo({top:0,behavior:"instant"});requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(".book-spine")?.focus({preventScroll:true}))}}}>{briefingStep===0?"NEXT →":"ENTER THE BOOKSHELF →"}</button></div>
      </motion.section>
    </div>}
    {ready && <><div className="bookstore-intro"><h1>THE BOOKSTORE INCIDENT</h1><p className="book-browsing-instruction">A familiar sentence is hiding somewhere on this shelf.</p></div>
    <div className="bookcase" aria-label="Bookstore shelves" inert={selected !== null}>
      {shelfRows.map((row,rowIndex)=><div className="bookstore-shelf" key={rowIndex}>
        {row.map(item=>item.kind==="custom"?<Book key={item.id} index={item.index} ready={ready} selected={selected} nudge={nudge} onChoose={choose}/>:item.kind==="stack"?<div className="filler-stack" key={item.id} aria-hidden="true">{item.books.map(filler=><FillerBook key={filler.id} item={filler}/>)}</div>:<FillerBook key={item.id} item={item}/>)}
      </div>)}
    </div>
    </>}
    {book && <div className={`book-focus ${target && beat > 0 ? "book-match-focus" : ""}`} onClick={close} onKeyDown={e => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const buttons = Array.from(focus.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
        if (!buttons.length) { e.preventDefault(); return; }
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (e.shiftKey && current <= 0) { e.preventDefault(); buttons.at(-1)?.focus(); }
        else if (!e.shiftKey && (current === buttons.length - 1 || current < 0)) { e.preventDefault(); buttons[0].focus(); }
      }
    }}>
      <div ref={focus} role="region" aria-label={book.title} tabIndex={-1} className={`book-stage ${phase === "piece" || phase === "bag" ? "book-show-recovery" : ""} ${phase === "open" || phase === "piece" || phase === "bag" ? "book-is-open" : ""}`} onClick={e => e.stopPropagation()}>
        <motion.div className={`held-book binding-${book.material} ${!book.artwork ? "pending-art-book" : ""}`} style={{ "--book-color": book.color, "--book-ink": book.ink, "--cover-width": `${book.artwork ? book.coverHeight*book.artwork.coverCrop.width*book.artwork.sourceAspect/book.artwork.coverCrop.height : book.coverWidth}px`, "--cover-height": `${book.coverHeight}px`, "--held-depth": `${origin.width / origin.scale}px`, "--cover-ratio": book.artwork ? book.artwork.coverCrop.width * book.artwork.sourceAspect / book.artwork.coverCrop.height : book.coverWidth / book.coverHeight } as CSSProperties}
          initial={reduced ? false : { x: origin.x, y: origin.y, scale: origin.scale, rotateY: book.frontFacing ? 0 : 90 }}
          animate={reduced ? {x:0,y:0,scale:1,rotateY:0} : phase === "return" ? {x:[0,origin.x,origin.x],y:[0,origin.y-16,origin.y],scale:[1,origin.scale,origin.scale],rotateY:[0,book.frontFacing?0:90,book.frontFacing?0:90]} : { x: [origin.x,origin.x,0], y: [origin.y,origin.y-16,0], scale: [origin.scale,origin.scale,1], rotateY: [book.frontFacing?0:90,book.frontFacing?0:90,0] }}
          transition={{ duration: reduced ? 0 : phase === "return" ? .95 : 1.15, times: [0,.3,1], ease: [.22,.7,.2,1] }}>
          <div className="held-spine">{book.artwork ? <ArtworkFace art={book.artwork} face="spine"/> : <span>{book.title}</span>}</div>
          <div className="book-pages" aria-hidden={phase !== "open"}><div className="book-left-page"><small>MISSION</small><p>Surprise Aaru at Higginbothams</p><small>STATUS</small><p>Somehow successful.</p></div><div className="book-right-page"><small>MEMORY RECOVERED ✓</small>{phase === "open" && <button className="tucked-piece" aria-label="Pick up puzzle piece" onClick={pickUpPiece}><CardboardPiece /></button>}</div></div>
          <div className={`book-front ${book.artwork ? "artwork-cover" : ""}`}>{book.artwork ? <ArtworkFace art={book.artwork} face="cover"/> : <><h2>{target?"HOW ARE YOU HERE?!":book.title}</h2>{target&&<p className="cover-subtitle">A HIGGINBOTHAMS STORY</p>}</>}</div>
        </motion.div>
        {phase === "cover" && <div className="book-actions">
          {!target&&book.memory&&<p className="memory-book-line">{book.memory}</p>}
          {target&&beat>0&&<div className="incident-reconstruction" aria-live="polite"><p className="book-match">MATCH FOUND ✓</p>{beat===2&&<p><small>LOCATION</small>HIGGINBOTHAMS</p>}{beat===3&&<p><small>SUBJECT RESPONSE</small>“How are you here?!”</p>}{beat>=4&&<p><small>BHUVAN'S INTERNAL RESPONSE</small>MISSION ACCOMPLISHED.<span>+450 XP</span></p>}</div>}
          {target&&<button className="book-open-action" onClick={()=>{opened.current=true;setPhase("open");play("click")}}>OPEN BOOK →</button>}
          <button onClick={close}>PUT BACK</button></div>}

        {phase === "open" && <div className="book-actions"><button onClick={pickUpPiece}>PICK UP PIECE</button><button onClick={close}>PUT BACK</button></div>}
        {(phase === "piece" || phase === "bag") && <div className="book-recovery" aria-live="polite"><motion.div ref={recoveredPiece} initial={{ y: 90, rotateY: 180, rotate: -18, scale: .6 }} animate={phase === "bag" ? { x:bagTravel.x,y:bagTravel.y, scale: .1, opacity: 0 } : { y: 0, rotateY: 0, rotate: 8, scale: 1 }} transition={{ duration: reduced ? 0 : .75 }}><CardboardPiece /></motion.div><p>PIECE 02 / 06<br /><strong>RECOVERED</strong></p><button disabled={phase === "bag"} onClick={() => { if (busy.current) return; busy.current = true;
const destination=document.querySelector(".evidence-toggle")?.getBoundingClientRect() ?? bag.current?.getBoundingClientRect(),piece=recoveredPiece.current?.getBoundingClientRect();
if(destination&&piece)setBagTravel({x:destination.left+destination.width/2-piece.left-piece.width/2,y:destination.top+destination.height/2-piece.top-piece.height/2});
setPhase("bag"); play("success"); }}>PUT IN EVIDENCE BAG →</button><div ref={bag} className="evidence-bag" aria-label="Evidence bag">EVIDENCE</div></div>}
      </div>
    </div>}
  </motion.main>;
}

function CardboardPiece() { return <svg viewBox="0 0 150 150" aria-hidden="true"><path d="M24 24H60C45 0 105 0 90 24H126V60C150 45 150 105 126 90V126H90C105 102 45 102 60 126H24V90C0 105 0 45 24 60Z" fill="#b9a17a" stroke="#725b3e" strokeWidth="3"/><path d="M30 31H55M32 115H53M116 35V55" fill="none" stroke="#e0ceb0" strokeWidth="2"/></svg>; }

function FillerBook({item}:{item:Filler}) {
  return <div data-filler-id={item.id} className={`filler-book binding-${item.material}`} aria-hidden="true" style={{"--filler-width":`${item.width}px`,"--filler-height":`${item.height}%`,"--filler-lean":`${item.lean}deg`,"--filler-depth":`${item.depth}px`,"--filler-color":item.color,"--label-position":`${item.label}%`} as CSSProperties}><i/><span>{item.mark}</span></div>;
}
