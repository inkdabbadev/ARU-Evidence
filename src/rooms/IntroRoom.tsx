import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CaseFrame from "../components/CaseFrame";
import LandingPage from "../components/LandingPage";
import DialogBox from "../components/DialogBox";
import { opening, easterEggs } from "../data/memories";
import { useGame } from "../state/GameContext";
import { useSound } from "../hooks/useSound";

export default function IntroRoom({ onPlaylistIntro }: { onPlaylistIntro: (done: () => void) => void }) {
  const { next } = useGame();
  const play = useSound();
  const [phase, setPhase] = useState<"note" | "objective">("note");
  const [workTaps, setWorkTaps] = useState(0);
  const [eggMessage, setEggMessage] = useState<string | null>(null);

  function tapWork() {
    play("click");
    const t = workTaps + 1;
    setWorkTaps(t);
    setEggMessage(t === 1 ? easterEggs.workClickedFirst : easterEggs.workClickedAgain);
    setTimeout(() => setEggMessage(null), 2200);
  }

  if (phase === "note") {
    return <LandingPage onBegin={() => { play("beep"); onPlaylistIntro(() => setPhase("objective")); }} />;
  }

  return (
    <CaseFrame theme="office">
      <div className="archive-content flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 text-center">
        <AnimatePresence mode="wait">
          {phase === "objective" && (
            <motion.div
              key="objective"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-6"
            >
              <p className="text-sm leading-relaxed text-paper/60">{opening.objectiveIntro}</p>
              <p className="text-base text-paper/85" style={{ fontFamily: "var(--font-display)" }}>
                {opening.objectiveLine}
              </p>
              <p className="text-xs tracking-[0.3em] text-brass-soft" style={{ fontFamily: "var(--font-type)" }}>
                OBJECTIVE: {opening.objective.toUpperCase()}
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  play("beep");
                  next();
                }}
                className="focus-ring mt-2 rounded-sm border border-brass/50 bg-brass/10 px-8 py-3 text-sm tracking-[0.2em] text-brass-soft transition hover:bg-brass/20"
                style={{ fontFamily: "var(--font-type)" }}
              >
                [ BEGIN ]
              </motion.button>
              <button
                onClick={tapWork}
                className="focus-ring text-[10px] tracking-widest text-paper/25 hover:text-paper/50"
                style={{ fontFamily: "var(--font-type)" }}
              >
                â˜Žï¸ WORK
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center px-6">
        <DialogBox open={!!eggMessage} title="NOTE">
          {eggMessage}
        </DialogBox>
      </div>
    </CaseFrame>
  );
}

