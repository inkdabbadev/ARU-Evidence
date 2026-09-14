import { enterStation, startTracking } from "./analytics/tracker";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ProgressIndicator from "./components/ProgressIndicator";
import VinylPlayer from "./components/VinylPlayer";
import { GameProvider, useGame } from "./state/GameContext";
import GameMenu from "./components/GameMenu";
import IntroRoom from "./rooms/IntroRoom";
import Piece1QuizRoom from "./rooms/Piece1QuizRoom";
import Piece2ShowsRoom from "./rooms/Piece2ShowsRoom";
import Piece3ConnectionsRoom from "./rooms/Piece3ConnectionsRoom";
import Piece4HouseArrestRoom from "./rooms/Piece4HouseArrestRoom";
import Piece5LaterRoom from "./rooms/Piece5LaterRoom";
import Piece6DoNothingRoom from "./rooms/Piece6DoNothingRoom";
import FinalPuzzleRoom from "./rooms/FinalPuzzleRoom";
import FinalRoom from "./rooms/FinalRoom";
import CompleteRoom from "./rooms/CompleteRoom";
import "./RetroTheme.css";

const LIGHT_ROOMS = new Set(["intro", "piece3", "complete"]);


function Rooms({ onPlaylistIntro }: { onPlaylistIntro: (done: () => void) => void }) {
  const { room } = useGame();

  return (
    <AnimatePresence mode="wait">
      {room === "intro" && <IntroRoom key="intro" onPlaylistIntro={onPlaylistIntro} />}
      {room === "piece1" && <Piece1QuizRoom key="piece1" />}
      {room === "piece2" && <Piece2ShowsRoom key="piece2" />}
      {room === "piece3" && <Piece3ConnectionsRoom key="piece3" />}
      {room === "piece4" && <Piece4HouseArrestRoom key="piece4" />}
      {room === "piece5" && <Piece5LaterRoom key="piece5" />}
      {room === "piece6" && <Piece6DoNothingRoom key="piece6" />}
      {room === "final-puzzle" && <FinalPuzzleRoom key="final-puzzle" />}
      {room === "final-room" && <FinalRoom key="final-room" />}
      {room === "complete" && <CompleteRoom key="complete" />}
    </AnimatePresence>
  );
}

function Shell() {
  const { room } = useGame();
  useEffect(() => {
    let stop: (() => void) | undefined;
    const timer = setTimeout(() => { stop = startTracking(); }, 0);
    return () => {clearTimeout(timer); stop?.();};
  }, []);
  useEffect(() => enterStation(room), [room]);
  const previousRoom = useRef(room);
  const [puzzleArrival, setPuzzleArrival] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const arriving = previousRoom.current === "piece6" && room === "final-puzzle";
    previousRoom.current = room;
    if (!arriving) return;
    setPuzzleArrival(true);
    const timer = setTimeout(() => setPuzzleArrival(false), 1900);
    return () => clearTimeout(timer);
  }, [room]);
  const [playlistIntroDone, setPlaylistIntroDone] = useState<(() => void) | null>(null);
  return (
    <>
      <div className="grain" aria-hidden />
      <div inert={playlistIntroDone !== null}>
        <Rooms onPlaylistIntro={done => setPlaylistIntroDone(() => done)} />
      </div>
      {puzzleArrival && <motion.div aria-hidden="true" initial={{opacity:1}} animate={{opacity:0}} transition={{delay:.8,duration:reduced?.4:1.1,ease:"easeInOut"}} style={{position:"fixed",inset:0,zIndex:70,background:"#d6cdb9",pointerEvents:"none"}} />}
      <ProgressIndicator />
      <VinylPlayer introducing={playlistIntroDone !== null} onIntroductionDone={() => { playlistIntroDone?.(); setPlaylistIntroDone(null); }} />
      <GameMenu dark={LIGHT_ROOMS.has(room)} />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
