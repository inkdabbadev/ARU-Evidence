import { useEffect, useRef, useState, type PointerEvent } from "react";
import { motion, useMotionTemplate, useReducedMotion, useSpring, useTransform } from "framer-motion";
import "./LandingPage.css";

export default function LandingPage({ onBegin }: { onBegin: () => void }) {
  const reducedMotion = useReducedMotion();
  const page = useRef<HTMLElement>(null);
  const [size, setSize] = useState({width:1000,height:900});
  useEffect(() => { const element=page.current; if(!element)return; const observer=new ResizeObserver(()=>setSize({width:element.clientWidth,height:element.clientHeight})); observer.observe(element); return ()=>observer.disconnect(); }, []);
  const pointerX = useSpring(50, { stiffness: 500, damping: 45, mass: .6 });
  const pointerY = useSpring(42, { stiffness: 500, damping: 45, mass: .6 });
  const rotate = useTransform([pointerX,pointerY], ([x,y]) => Math.max(-38,Math.min(38,-Math.atan2((Number(x)-50)*size.width/100,Math.max(45,Number(y)*size.height/100-70))*180/Math.PI)));
  const tilt = useTransform(pointerY,[0,100],[-12,12]);
  const beam = useTransform([pointerX,pointerY], ([x,y]) => {const tx=Number(x)*size.width/100,ty=Math.max(90,Number(y)*size.height/100),ox=size.width/2,oy=70;const dx=tx-ox,dy=ty-oy,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;return [ox+nx*25,oy+ny*25,ox-nx*25,oy-ny*25,tx-nx*115,ty-ny*115,tx+nx*115,ty+ny*115].join(' ');});
  const light = useMotionTemplate`radial-gradient(circle clamp(180px, 30vw, 420px) at ${pointerX}% ${pointerY}%, rgba(255,242,202,0.24) 0%, rgba(255,242,202,0.08) 16%, rgba(15,16,16,0.26) 42%, rgba(15,16,16,0.58) 72%, rgba(15,16,16,0.68) 100%)`;

  function followPointer(event: PointerEvent<HTMLElement>) {
    if (reducedMotion || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)));
    pointerY.set(Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)));
  }

  function resetPointer() {
    pointerX.set(50);
    pointerY.set(42);
  }

  return (
    <motion.main
      ref={page}
      className="landing-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerMove={followPointer}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
    >
      <div className="landing-wall" aria-hidden="true" />
      <motion.div className="landing-light" style={{ background: light }} aria-hidden="true" />
      <svg className="landing-beam" aria-hidden="true"><defs><filter id="lamp-feather"><feGaussianBlur stdDeviation="12" /></filter><linearGradient id="lamp-falloff" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff1cb" stopOpacity=".18"/><stop offset="1" stopColor="#fff1cb" stopOpacity=".02"/></linearGradient></defs><motion.polygon points={beam} fill="url(#lamp-falloff)" filter="url(#lamp-feather)" /><defs><clipPath id="lamp-dust-cone"><motion.polygon points={beam}/></clipPath></defs><g clipPath="url(#lamp-dust-cone)" fill="#fff4d3" opacity=".16">{Array.from({length:24},(_,i)=><circle key={i} cx={(.1+((i*37)%83)/100)*size.width} cy={80+((i*59)%79)/100*size.height} r={i%3===0?1:.6}/>)}</g></svg>
      <div className="landing-lamp-anchor" aria-hidden="true">
        <motion.div className="landing-lamp" style={{ rotate, rotateX: tilt }}>
          <div className="landing-lamp-cord" />
          <div className="landing-lamp-shade" />
          <div className="landing-lamp-bulb" />
        </motion.div>
      </div>

      <p className="landing-scribble landing-scribble-left" aria-hidden="true">
        Same people.<br />New chaos.<br />Let’s find<br />the missing<br />pieces. ♡
      </p>
      <p className="landing-scribble landing-scribble-right" aria-hidden="true">
        Good<br />company<br />does go a<br />long way.<br />♡
      </p>

      <div className="landing-content">
        <span className="landing-case">CASE #2711</span>
        <h1 className="landing-logo">
          <img
            src={import.meta.env.BASE_URL + "ChatGPT Image Sep 13, 2026, 08_47_51 AM.png"}
            alt="The Case of the Missing Conversations"
            width="1763"
            height="877"
            fetchPriority="high"
          />
        </h1>
        <p className="landing-unresolved"><strong>847</strong> <span>conversations remain unresolved.</span></p>
        <p className="landing-status">Last known status:<br /><mark>“will tell you properly later.”</mark></p>
        <button className="landing-begin focus-ring" onClick={onBegin}>
          BEGIN INVESTIGATION <span aria-hidden="true">→</span>
        </button>
        <p className="landing-promise">(it’s going to be fun, promise)</p>
      </div>

      <p className="landing-scribble landing-scribble-bottom" aria-hidden="true">
        You’re here.<br />That’s enough. ♡
      </p>
    </motion.main>
  );
}
