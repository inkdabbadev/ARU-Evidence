import { trackEvent } from "../analytics/tracker";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import CaseFrame from "../components/CaseFrame";
import { useGame } from "../state/GameContext";
import { useSound } from "../hooks/useSound";
import "./ExamUpdate.css";
const options = ["Good 👍", "Tired.", "Long story. Will tell you properly.", "Do you have 3–4 hours of uninterrupted, fully attentive time for me to download all this?"];
const reactions = [["❌ INCOMPLETE ANSWER", "We both know that's not the full report.", "Be honest.\nThis is a safe space."], ["2/10", "Technically accurate.\nSuspiciously brief.", "You have approximately 47 open brain tabs.\nTry again."], ["7/10", "Ah. The legendary “later.”", "Unfortunately, the examiner has heard this one before.\nPlease answer the question, ma'am."]];
const repeats = ["Aaru. 👀", "No judgement.\nPromise.", "This website has literally been built for the long answer.", "I can do this all day."];
export default function Piece1QuizRoom() {
 const {addPiece,next}=useGame();const play=useSound();const [selected,setSelected]=useState<number|null>(null);const [accepted,setAccepted]=useState(false);const [wrong,setWrong]=useState(0);const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);const claimed=useRef(false);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 function choose(i:number){if(selected===3)return;trackEvent("puzzle_start",{puzzle:"examination"});trackEvent("puzzle_attempt",{puzzle:"examination",outcome:i===3?"correct":"retry"});if(i===3)trackEvent("puzzle_complete",{puzzle:"examination",stage:1});setSelected(i);if(i===3){timer.current=setTimeout(()=>{setAccepted(true);play("success")},500)}else{setWrong(w=>w+1);play("click")}}
 return <CaseFrame theme="office"><div className="archive-content exam-update"><header className="artifact-heading"><span className="artifact-kicker">EXHIBIT 01 / THE EXAMINATION</span><h1>The 10-Mark Question</h1></header><div className="exam-paper"><p className="exam-question">HOW ARE YOU ACTUALLY DOING?</p><div className="exam-options">{options.map((text,i)=><button key={text} disabled={selected===3} onClick={()=>choose(i)} aria-pressed={selected===i}><strong>{String.fromCharCode(65+i)}.</strong> {text}</button>)}</div>{selected!==null&&selected<3&&<div className="exam-reaction" aria-live="polite"><strong>{reactions[selected][0]}</strong>{reactions[selected].slice(1).map(line=><p key={line}>{line}</p>)}{wrong>1&&<small>{repeats[(wrong-2)%repeats.length]}</small>}</div>}{accepted&&<motion.div className="exam-accepted" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><h2>10/10 ✓</h2><strong>FINALLY. AN HONEST ANSWER.</strong><dl><dt>Estimated download time:</dt><dd>3–4 hours</dd><dt>Attention required:</dt><dd>Undivided</dd><dt>Interruptions:</dt><dd>Absolutely not</dd><dt>Current status:</dt><dd>Pending</dd></dl><p>Interesting.<br/>This keeps happening.</p><button onClick={()=>{if(claimed.current)return;claimed.current=true;addPiece(1);next()}}>collect evidence →</button></motion.div>}</div></div></CaseFrame>
}
