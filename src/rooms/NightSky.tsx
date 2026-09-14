import { useEffect, useRef } from "react";
interface Props { elapsed: number; stayElapsed: number; pieceElapsed: number; phase: string; disturbance: number; reduced: boolean }
// Stable positions keep the sky still between React renders.
const random = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const stars = Array.from({ length: 360 }, (_, i) => ({ x: random(i + 1), y: random(i + 420), radius: .35 + random(i + 810) * 1.1, brightness: .2 + random(i + 1400) * .65, arrives: i < 8 ? 0 : 2 + random(i + 2000) * 24 }));
const piecePath = "M100 100H210C175 25 325 25 290 100H400V210C475 175 475 325 400 290V400H290C325 325 175 325 210 400H100V290C175 325 175 175 100 210Z";
export default function NightSky(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef(props);
  useEffect(() => { state.current = props; }, [props]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d",piecePath);
    const length = path.getTotalLength();
    const outline = Array.from({length:241},(_,i)=>path.getPointAtLength(length*i/240));
    const heroes = Array.from({length:48},(_,i)=>({star:stars[(i*7+13)%stars.length],target:outline[i*5]}));
    let width = 0, height = 0, frame = 0, last = 0;
    const resize = () => { const r = element.getBoundingClientRect(); width = r.width; height = r.height; const dpr = Math.min(devicePixelRatio || 1, 2); element.width = width * dpr; element.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      if (now - last < 40 || document.hidden || !ctx) return;
      last = now;
      const {elapsed,stayElapsed,pieceElapsed,phase,disturbance,reduced} = state.current;
      ctx.clearRect(0, 0, width, height);
      const dim = phase === "piece" ? Math.max(.055, 1 - Math.max(0,pieceElapsed-3.5) / 3) : 1;
      const disrupted = Math.max(0, 1 - (now - disturbance) / 1800) * .4;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const revealed = i < 8 ? Math.min(1, elapsed / 2) : Math.max(0, Math.min(1, (elapsed - star.arrives) / 4));
        const stillness = phase === "piece" ? Math.max(0, 1 - Math.max(0, pieceElapsed - 1.5) / 2) : 1;
        const twinkle = reduced ? 1 : 1 - stillness * (.06 - .06 * Math.sin(now / 2500 + i));
        ctx.globalAlpha = revealed * star.brightness * twinkle * dim * (i > 8 ? 1 - disrupted : 1);
        ctx.fillStyle = i % 5 === 0 ? "#b4c0ca" : i % 7 === 0 ? "#e2d3b7" : "#e6e5dd";
        ctx.beginPath(); ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const shootingTime = phase === "stay" ? stayElapsed - 12 : elapsed - 23;
      if (!reduced && shootingTime >= 0 && shootingTime < 1.2 && phase !== "piece") {
        const t = shootingTime / 1.2;
        ctx.strokeStyle = `rgba(232,230,216,${Math.sin(t * Math.PI) * .45})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(width * (.24 + t * .2), height * (.2 + t * .09)); ctx.lineTo(width * (.24 + t * .2) - 35, height * (.2 + t * .09) - 10); ctx.stroke();
      }
      if (elapsed > 30 && elapsed < 37 && phase === "sky") {
        const opacity = Math.min(1,elapsed - 30,37 - elapsed) * .3;
        ctx.strokeStyle = `rgba(221,226,218,${opacity})`; ctx.lineWidth = .6;
        ctx.beginPath(); ctx.moveTo(width * .43,height * .28); ctx.lineTo(width * .5,height * .28); ctx.lineTo(width * .57,height * .28); ctx.stroke();
        ctx.fillStyle = "#dce0d6"; for(const x of [.43,.5,.57]) {ctx.beginPath();ctx.arc(width*x,height*.28,1.4,0,Math.PI*2);ctx.fill();}
      }
      if (phase === "piece") {
        const t=pieceElapsed; const size=Math.min(width*.8,height*.58,470); const cx=width/2,cy=height*.5;
        const activation=Math.max(0,Math.min(1,(t-3.5)/2.5));
        const pulse=t>13.5&&t<14.5?Math.sin((t-13.5)*Math.PI)*.45:0;
        for(let i=0;i<heroes.length;i++){
          const travel=Math.max(0,Math.min(1,(t-6-random(i+3000)*.7)/(4+random(i+3100)*.3)));
          const eased=travel*travel*(3-2*travel);
          const hero=heroes[i],sx=hero.star.x*width,sy=hero.star.y*height,tx=cx+(hero.target.x-250)*size/500,ty=cy+(hero.target.y-250)*size/500;
          const controlX=(sx+tx)/2+Math.sin(i*2.1)*80,controlY=(sy+ty)/2-80;
          const position=(v:number)=>({x:(1-v)*(1-v)*sx+2*(1-v)*v*controlX+v*v*tx,y:(1-v)*(1-v)*sy+2*(1-v)*v*controlY+v*v*ty});
          const point=reduced?{x:tx,y:ty}:position(eased);
          ctx.globalAlpha=reduced?Math.max(0,Math.min(1,(t-6)/3)):activation;
          if(!reduced&&travel>0&&travel<1){const tail=position(Math.max(0,eased-.045));ctx.strokeStyle="#d0ddda55";ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(tail.x,tail.y);ctx.lineTo(point.x,point.y);ctx.stroke()}
          ctx.fillStyle="#e6eeea";ctx.shadowColor="#c7e0d4";ctx.shadowBlur=activation*(4+pulse*7);ctx.beginPath();ctx.arc(point.x,point.y,1.05+(i%3)*.25+pulse,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        }
        // Interior pinpricks retain the night-sky texture inside the traced piece.
        const interiorAlpha = Math.max(0, Math.min(1, (t - 10.5) / 2));
        ctx.save();
        ctx.translate(cx-size/2,cy-size/2);ctx.scale(size/500,size/500);
        ctx.clip(new Path2D(piecePath));ctx.fillStyle="#c4d1d6";
        for(let i=0;i<24;i++){
          ctx.globalAlpha=interiorAlpha*(.12+random(i+4000)*.2);
          ctx.beginPath();ctx.arc(100+random(i+4100)*300,100+random(i+4200)*300,.6+random(i+4300),0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
        const trace=Math.max(0,Math.min(1,(t-11.5)/2));
        if(trace>0){ctx.globalAlpha=.65;ctx.lineWidth=.65;ctx.strokeStyle="#d2e1db";ctx.beginPath();for(let i=0;i<=Math.floor(trace*240);i++){const p=outline[i],x=cx+(p.x-250)*size/500,y=cy+(p.y-250)*size/500;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()}
      }
      ctx.globalAlpha = 1;
    }
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);
  return <canvas ref={canvas} className="night-canvas" aria-label="A quiet, open night sky filled with stars" role="img" />;
}
