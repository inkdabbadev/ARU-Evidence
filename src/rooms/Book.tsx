import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { type BookArtwork } from "./bookArtwork";
import { books } from "./bookstoreBooks";
export function ArtworkFace({art,face}:{art:BookArtwork;face:"cover"|"spine"}){const crop=face==="cover"?art.coverCrop:art.spineCrop;return <span className={`book-art-crop crop-${face}`} aria-hidden="true"><img src={import.meta.env.BASE_URL+art.image} alt="" draggable={false} style={{width:`${100/crop.width}%`,height:`${100/crop.height}%`,left:`${-crop.left/crop.width*100}%`,top:`${-crop.top/crop.height*100}%`}}/></span>}
export default function Book({index,ready,selected,nudge,onChoose}:{index:number;ready:boolean;selected:number|null;nudge:number|null;onChoose:(index:number,button:HTMLButtonElement)=>void}){
 const item=books[index];const art=item.artwork;const face=item.frontFacing?"cover":"spine";const crop=art?(item.frontFacing?art.coverCrop:art.spineCrop):undefined;
 const [notePosition,setNotePosition]=useState<{left:number;top:number}|null>(null);
 const note=item.target?"Wait.\nThis one sounds familiar.":item.callout;
 function showNote(button:HTMLButtonElement){if(!ready||selected!==null||!note)return;const r=button.getBoundingClientRect();setNotePosition({left:Math.max(125,Math.min(innerWidth-125,r.left+r.width/2)),top:Math.max(70,r.top-12)})}

 return <><button onMouseEnter={e=>showNote(e.currentTarget)} onMouseLeave={()=>setNotePosition(null)} onFocus={e=>showNote(e.currentTarget)} onBlur={()=>setNotePosition(null)} disabled={!ready} data-book-id={item.id} data-artwork={!!art} data-facing={face} aria-label={item.title} onClick={e=>onChoose(index,e.currentTarget)} className={`book-spine binding-${item.material} spine-design-${index%10} ${art?"artwork-spine":""} ${item.frontFacing?"book-display-cover":""} ${nudge===index?"book-nudge":""} ${selected===index?"book-vacancy":""}`} style={{aspectRatio:art&&crop?crop.width*art.sourceAspect/crop.height:undefined,"--book-color":item.color,"--book-ink":item.ink,"--book-width":`${item.width}px`,"--book-height":`${item.height}%`,"--lean":`${item.lean}deg`,"--recess":`${item.depth}px`,"--gap":`${index%3*2}px`} as CSSProperties}>
 {art?<ArtworkFace art={art} face={face}/>:<><span className="spine-title">{item.title}</span><span className="spine-mark" aria-hidden="true">{["◇","II","✳","—","▪"][index%5]}</span></>}
 </button>{notePosition&&ready&&selected===null&&createPortal(<span className="book-archivist-callout" style={{left:notePosition.left,top:notePosition.top}}>{note}</span>,document.body)}</>
}
