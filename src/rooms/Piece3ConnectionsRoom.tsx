import { trackEvent } from "../analytics/tracker";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CaseFrame from "../components/CaseFrame";
import DialogBox from "../components/DialogBox";
import HintButton from "../components/HintButton";
import PieceFound from "../components/KeyFound";
import { connectionsGroups, piece3Caption, easterEggs } from "../data/memories";
import { useGame } from "../state/GameContext";
import { useSound } from "../hooks/useSound";

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Piece3ConnectionsRoom() {
  const { addPiece, next } = useGame();
  const play = useSound();

  const tiles = useMemo(
    () => shuffled(connectionsGroups.flatMap((g) => g.words.map((w) => ({ word: w, groupId: g.id })))),
    []
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<string[]>([]);
  const [shakeWords, setShakeWords] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [showPiece, setShowPiece] = useState(false);
  const [eggMessage, setEggMessage] = useState<string | null>(null);

  const allSolved = solvedGroups.length === connectionsGroups.length;

  function toggle(word: string) {
    if (solvedGroups.some((gid) => connectionsGroups.find((g) => g.id === gid)?.words.includes(word))) return;
    play("click");
    setSelected((s) => (s.includes(word) ? s.filter((w) => w !== word) : s.length < 4 ? [...s, word] : s));
  }

  function submit() {
    if (selected.length !== 4) return;
    const match = connectionsGroups.find(
      (g) => !solvedGroups.includes(g.id) && g.words.every((w) => selected.includes(w))
    );
    trackEvent("puzzle_start", {puzzle:"connections"});
    trackEvent("puzzle_attempt", {puzzle:"connections",outcome:match?"matched":"retry",stage:solvedGroups.length+(match?1:0)});
    if(match && solvedGroups.length+1===connectionsGroups.length)trackEvent("puzzle_complete",{puzzle:"connections",stage:connectionsGroups.length});
    if (match) {
      play("success");
      setSolvedGroups((s) => [...s, match.id]);
      setSelected([]);
      setMessage(null);
      if (match.id === "waiting") {
        setTimeout(() => {
          setEggMessage(easterEggs.randomUpdateNotification);
          setTimeout(() => setEggMessage(null), 2400);
        }, 500);
      }
    } else {
      play("error");
      setShakeWords(selected);
      setMessage("Not quite. Try again.");
      setTimeout(() => setShakeWords([]), 450);
    }
  }

  return (
    <CaseFrame theme="office">
      
      

      <div className="archive-content flex w-full max-w-md flex-1 flex-col items-center gap-6 pt-6 text-center">
        <header className="newspaper-masthead">
          <span className="artifact-kicker">The personal archive / Puzzle edition</span>
          <h1>The Conversation Times</h1>
          <div className="newspaper-edition"><span>VOL. 2711</span><span>CONNECTIONS · NO. 03</span><span>FOUR OF A KIND</span></div>
        </header>

        <div className="newspaper-puzzle w-full space-y-2">
          <h2>Everything is connected.</h2>
          <p>Select four words that share a connection.</p>
          <AnimatePresence>
            {solvedGroups.map((gid) => {
              const g = connectionsGroups.find((x) => x.id === gid)!;
              return (
                <motion.div
                  key={gid}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="newspaper-solved px-3 py-2.5 text-center"
                >
                  <p className="text-[10px] tracking-widest text-white/80" style={{ fontFamily: "var(--font-type)" }}>
                    {g.label}
                  </p>
                  <p className="text-sm font-medium text-white">{g.words.join(" • ")}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!allSolved && (
            <div className="newspaper-grid grid grid-cols-4">
              {tiles
                .filter((t) => !solvedGroups.includes(t.groupId))
                .map((t) => {
                  const isSelected = selected.includes(t.word);
                  const isShaking = shakeWords.includes(t.word);
                  return (
                    <motion.button
                      key={t.word}
                      layout
                      onClick={() => toggle(t.word)}
                      aria-pressed={isSelected}
                      animate={isShaking ? { x: [0, -5, 5, -3, 3, 0] } : {}}
                      whileTap={{ scale: 0.95 }}
                      className={`focus-ring flex h-16 items-center justify-center rounded-sm border px-1 text-center text-[10px] font-medium leading-tight transition
                        ${isSelected ? "border-brass bg-brass/25 text-brass-soft" : "border-paper/15 bg-office-deep/50 text-paper/80 hover:bg-office-deep"}`}
                    >
                      {t.word}
                    </motion.button>
                  );
                })}
            </div>
          )}
        </div>

        <aside className="newspaper-sidebar">
          <h2>Between the lines</h2>
          <p>Sixteen words from a very familiar world. Some belong together. Some are just very good at interrupting each other.</p>
          <span>{solvedGroups.length} / 4 CONNECTIONS FOUND</span>
        </aside>

        {!allSolved && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={submit}
              disabled={selected.length !== 4}
              className="focus-ring rounded-sm border border-brass/50 bg-brass/10 px-6 py-2 text-sm tracking-wide text-brass-soft transition enabled:hover:bg-brass/20 disabled:opacity-30"
              style={{ fontFamily: "var(--font-type)" }}
            >
              SUBMIT
            </button>
            {message && <p className="text-xs text-evidence-soft">{message}</p>}
          </div>
        )}

        {allSolved && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center gap-4">
            <p className="text-base text-paper/85" style={{ fontFamily: "var(--font-display)" }}>
              {piece3Caption.title}
            </p>
            <p className="text-sm text-paper/60">{piece3Caption.body}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if(showPiece)return;
                addPiece(3);
                setShowPiece(true);
              }}
              className="focus-ring mt-1 rounded-sm border border-brass/50 bg-brass/10 px-6 py-2.5 text-sm tracking-wide text-brass-soft hover:bg-brass/20"
              style={{ fontFamily: "var(--font-type)" }}
            >
              Collect evidence
            </motion.button>
          </motion.div>
        )}

        {!allSolved && <HintButton hint="PUZZLE, BOOK, SKETCH and MUFFY belong to Aaru’s off-screen life — that's one group on its own." />}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center px-6">
        <DialogBox open={!!eggMessage} title="NOTIFICATION">
          {eggMessage}
        </DialogBox>
      </div>

      <PieceFound show={showPiece} index={3} onDone={next} />
    </CaseFrame>
  );
}
