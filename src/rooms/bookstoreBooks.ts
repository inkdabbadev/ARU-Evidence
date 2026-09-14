import { artworkFor, type BookArtwork } from "./bookArtwork";
export interface Book { frontFacing?: boolean; callout?: string; artwork?: BookArtwork; id: string; target: boolean; depth: number; title: string; memory?: string; color: string; ink: string; width: number; height: number; lean: number; material: string; coverWidth: number; coverHeight: number; flat?: boolean }
const titles = ["The 1000 Piece Problem", "10739 Things", "Things I’ll Tell You Later", "Random Aaru Updates — Vol. I", "The Comic Strip Flight", "Firm Foundation Coffee Guide", "House Arrest", "How Are You Here?!", "The Book We Lost", "Good Company Goes a Long Way", "Coexisting & Other Advanced Skills", "The Art of Doing Absolutely Nothing", "I Need the Full Context", "Waiting to Hear", "The Nolan Update", "Live Updates Required", "One More Follow-Up Question", "47 Open Brain Tabs", "As Soon As I’m Free", "A Quick Coffee — Vol. IV", "Tell Me Once You’re Done", "Things That Reminded Me of You", "The Warm Workspace", "Green Fields, Pretty Skies", "A Tint of Chaos", "The Very Long Meeting", "Good Company", "Later — Expanded Edition", "How to Finish a Conversation", "The Long Version"];
const memories: Record<number, string> = { 0: "Apparently still in progress.", 1: "A completely reasonable number of things to tell someone.", 3: "Highly unnecessary.\nSurprisingly important.", 4: "STATUS:\nSTORY STILL PENDING", 5: "Detailed reports available over coffee.", 6: "An unnecessarily long wait for freedom.", 9: "No notes.\nThis one aged well.", 11: "Advanced level.\nRequires good company.", 21: "Filed under:\nway too many.", 27: "Now with even more unresolved chapters.", 29: "Because “good” was never the full answer." };
// Deliberately composed dimensions and materials: each row has a different silhouette.
const specs: [string,string,number,number,number,string][] = [
 ["#394d3c","#d3c49b",76,98,-3,"cloth"], ["#b6a77d","#282c27",100,83,0,"paper"], ["#662e30","#d8c7a3",36,89,0,"leather"], ["#58616a","#e0d6bc",74,94,2,"linen"], ["#c7bba0","#803d31",84,73,-5,"paper"], ["#916538","#eee0b9",70,85,0,"cloth"], ["#292c29","#c1bba8",62,96,0,"leather"], ["#777257","#e4dbc1",58,80,-4,"linen"], ["#a29b8e","#403e39",31,92,-5,"paper"], ["#45372e","#d0b27b",96,89,1,"leather"],
 ["#6a3231","#dfc79a",91,92,0,"cloth"], ["#d2c8ad","#334636",100,78,0,"paper"], ["#343c40","#d9cbb4",42,98,4,"linen"], ["#a58247","#292d26",51,83,3,"cloth"], ["#43535a","#e0d6bd",84,93,0,"leather"], ["#8b473a","#d8c5a6",28,73,0,"paper"], ["#aba695","#353934",60,95,-6,"linen"], ["#38382f","#c7ba89",96,86,0,"cloth"], ["#73614d","#e1d1b5",35,79,0,"paper"], ["#b1a582","#4a3528",113,68,0,"paper"],
 ["#4e5a4b","#d4c9a6",40,87,3,"linen"], ["#8a5147","#ead9bb",91,95,0,"cloth"], ["#b49b62","#39382e",68,76,-4,"linen"], ["#526368","#d9d0b3",79,91,-3,"cloth"], ["#b27648","#292f28",38,67,0,"paper"], ["#574438","#d0ba8f",107,99,0,"leather"], ["#c7bfa9","#475144",52,79,5,"paper"], ["#633031","#d5bd8b",91,93,0,"leather"], ["#666963","#e1d8c1",33,85,0,"linen"], ["#2e3e36","#ddc79c",113,70,0,"cloth"]
];
export const books: Book[] = titles.map((title,i) => ({ id: title.toLowerCase().replace(/[??!.,]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-$/,""), target: i === 7, depth: (i * 7) % 9 - 3, title, memory: memories[i], color: specs[i][0], ink: specs[i][1], width: i === 1 ? 65 : i === 29 ? 43 : 23 + (i * 7) % 20, height: i === 29 ? 98 : specs[i][3], lean: specs[i][4], material: specs[i][5], coverWidth: [292,330,255,268,340,250,280,270,240,310][i%10], coverHeight: [395,365,390,410,330,375,420,380,355,385][i%10], flat: false }));

// Reserved titles have plain bindings until their supplied artwork is ready.
const extraTitles = ["A Library of Surprise", "House Arrest ? Second Edition", "The Full Report", "Suspiciously Brief", "Three to Four Hours", "Muffy Boy", "Still Typing?", "Random Morning Thought", "Fully Attentive", "Miss You Too, Dude", "Highest Compliment", "Random Morning Thought - Collage Edition", "Very You-Coded", "Wait, There's More", "Coexisting - Second Edition", "10739 Things - Illustrated Edition", "Still Typing - Night Edition", "The Scenic Route", "Pending Since Forever", "Both of Us, Apparently"];
extraTitles.forEach((title,i)=>books.push({id:title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-$/,""),title,target:false,color:["#3f5149","#84765d","#4b505a","#754c42"][i%4],ink:"#e1d4b8",width:i===3?12:i===4?59:25+i*7%19,height:i===5?58:i===2?99:73+i*11%25,lean:(i%5-2)*1.2,depth:i%7,material:["cloth","paper","linen"][i%3],coverWidth:i===5?210:280,coverHeight:i===5?280:390}));
books.forEach(book=>{book.artwork=artworkFor(book.id)});
const memoryNotes: Record<number,string> = {
  0:"challenge accepted, apparently.", 1:"still not an exaggeration.",
  5:"detailed reports available here.", 3:"excellent publication. would subscribe.",
  9:"keep this one somewhere safe.", 8:"we're not discussing this.",
  2:"unfortunately a bestseller.", 29:"the edition we never finish."
};
books.forEach((book,index)=>{book.callout=memoryNotes[index];book.memory=memoryNotes[index]});
export const customBooks = books;

// Stable generation: neither inspection nor a new session rearranges the shelves.
export function seededRandom(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export interface Filler { kind: "filler"; id: string; width: number; height: number; lean: number; depth: number; material: string; color: string; label: number; mark: string; }
export type ShelfItem = {kind:"custom"; index:number; id:string} | Filler | {kind:"stack";id:string;books:Filler[]};
const random = seededRandom(2711);
const materials = ["cloth","linen","paper","leather"];
const colors = ["#514e42","#3d4944","#82745f","#523e3d","#545b60","#a49b83"];
const fillers: Filler[] = Array.from({length:30},(_,i)=>({kind:"filler",id:`filler-${i}`,width:13+Math.floor(random()*19),height:60+random()*35,lean:(random()-.5)*7,depth:Math.floor(random()*9),material:materials[Math.floor(random()*4)],color:colors[Math.floor(random()*6)],label:12+random()*60,mark:["I","II","III","IV","V"][i%5]}));
const population: ShelfItem[] = [...books.map((book,index)=>({kind:"custom" as const,index,id:book.id})),...fillers.slice(0,24)];
for(let i=population.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[population[i],population[j]]=[population[j],population[i]];}
// The target sits among neighbours, middle-right of the second shelf.
const targetIndex=population.findIndex(item=>item.kind==="custom"&&books[item.index].target);
const targetSlot=Math.floor(population.length/3)+Math.floor(population.length/3*.7);
[population[targetIndex],population[targetSlot]]=[population[targetSlot],population[targetIndex]];
export const shelfRows: ShelfItem[][] = Array.from({length:3},(_,row)=>population.slice(Math.floor(row*population.length/3),Math.floor((row+1)*population.length/3)));
shelfRows.forEach((row,i)=>row.splice(i===1?3:row.length-3,0,{kind:"stack",id:`stack-${i}`,books:fillers.slice(24+i*2,26+i*2)}));

// One supplied cover per shelf, with all other books kept spine-first.
const displayTitles = ["random-morning-thought-collage-edition", "the-1000-piece-problem", "a-library-of-surprise"];
shelfRows.forEach((row,i)=>{const item=row.find(item=>item.kind==="custom"&&books[item.index].id===displayTitles[i]);if(item?.kind==="custom"&&books[item.index].artwork&&!books[item.index].target)books[item.index].frontFacing=true});
