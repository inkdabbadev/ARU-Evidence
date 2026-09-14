import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useGame } from '../state/GameContext';
import { evidencePieces } from '../state/evidence';
import './EvidenceBag.css';
export default function ProgressIndicator() {
  const {collectedPieces,collectionNotice} = useGame();
  const [open,setOpen] = useState(false);
  const [fresh,setFresh] = useState<number[]>([]);
  const previous = useRef(collectionNotice);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reduced = useReducedMotion();
  useEffect(() => {
    if(previous.current === collectionNotice)return;
    previous.current = collectionNotice;
    const added = collectionNotice ? [collectionNotice.id] : [];
    clearTimeout(closeTimer.current);
    const timer = setTimeout(() => {
      setFresh(added); setOpen(added.length > 0);
      if(added.length) closeTimer.current = setTimeout(() => {setOpen(false);setFresh([]);},3400);
    },0);
    return () => clearTimeout(timer);
  },[collectionNotice]);
  useEffect(() => () => clearTimeout(closeTimer.current),[]);
  function toggle(){clearTimeout(closeTimer.current);setFresh([]);setOpen(value=>!value);}
  const latest = evidencePieces.find(p => p.id === fresh.at(-1));
  return <aside className={`evidence-progress ${fresh.length ? 'evidence-celebrating' : ''}`}>
    <button className="evidence-toggle" onClick={toggle} aria-expanded={open} aria-controls="evidence-drawer" aria-label={`Evidence bag: ${collectedPieces.length} of ${evidencePieces.length} pieces recovered`}>
      <svg className="evidence-bag-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7V5a4 4 0 0 1 8 0v2M5 7h14l2 14H3Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
      <span className="evidence-control-copy"><strong>EVIDENCE BAG</strong><small>{open?'CLOSE BAG':'OPEN BAG'}</small></span><span className="evidence-counter">{collectedPieces.length}/{evidencePieces.length}</span><svg className={`evidence-chevron ${open?'is-open':''}`} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
    </button>
    <span className="evidence-announcement" role="status" aria-live="polite">{latest ? `${latest.label} evidence collected. ${collectedPieces.length} of ${evidencePieces.length} pieces recovered.` : ''}</span>
    <AnimatePresence>{open && <motion.div id="evidence-drawer" className="evidence-bag-drawer" initial={{opacity:0,y:reduced?0:-12,scale:reduced?1:.88,rotate:reduced?0:-3}} animate={{opacity:1,y:0,scale:1,rotate:0}} exit={{opacity:0,y:reduced?0:-8,scale:reduced?1:.94}} transition={reduced?{duration:.15}:{type:'spring',stiffness:310,damping:23}} style={{transformOrigin:'top left'}}>
      <header>{latest?'EVIDENCE SECURED':'EVIDENCE BAG'}<br/><small>{latest?latest.label:'CASE #2711'}</small></header>
      <div className="evidence-slots">{evidencePieces.map(piece=>{
        const collected=collectedPieces.includes(piece.id);
        return <div key={piece.id} className={fresh.includes(piece.id)?'evidence-slot-new':''} data-piece={piece.id} data-collected={collected} aria-label={`${piece.label}: ${collected?'collected':'not collected'}`}>
          <svg viewBox="0 0 150 150" aria-hidden="true"><path d="M24 24H60C45 0 105 0 90 24H126V60C150 45 150 105 126 90V126H90C105 102 45 102 60 126H24V90C0 105 0 45 24 60Z" fill={collected?piece.color:'none'} stroke="#675b45" strokeDasharray={collected?undefined:'4 5'} strokeWidth="2"/></svg>
          <span>PIECE {String(piece.id).padStart(2,'0')}</span><small>{piece.label}</small>
        </div>;
      })}</div>
      <p className="evidence-bag-note">{collectedPieces.length===evidencePieces.length?'Every piece is safely filed.':`${collectedPieces.length} safely filed / ${evidencePieces.length-collectedPieces.length} still to find`}</p>
    </motion.div>}</AnimatePresence>
  </aside>;
}
