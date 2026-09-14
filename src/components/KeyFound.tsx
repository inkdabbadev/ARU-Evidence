import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TOTAL_PIECES } from "../data/memories";
import { useSound } from "../hooks/useSound";

/** Full-screen celebration overlay shown each time a puzzle piece is found. */
export default function PieceFound({ show, index, onDone }: { show: boolean; index: number; onDone: () => void }) {
  const play = useSound();

  useEffect(() => {
    if (!show) return;
    play("key");
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-office-deep/40 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="scrapbook-found flex flex-col items-center gap-2 rounded-lg border border-brass/40 bg-office px-8 py-6 text-center shadow-2xl"
          >
            <span className="text-4xl">🧩</span>
            <span className="text-lg tracking-wide text-brass-soft" style={{ fontFamily: "var(--font-type)" }}>
              PIECE {index}/{TOTAL_PIECES} FOUND
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
