import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../state/GameContext";

export default function GameMenu({ dark = false }: { dark?: boolean }) {
  const { restart, room } = useGame();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (room === "intro") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className={`w-44 overflow-hidden rounded-md border shadow-xl ${dark ? "border-ink/15 bg-paper" : "border-paper/15 bg-office"}`}
          >
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className={`focus-ring block w-full px-4 py-3 text-left text-xs tracking-wide ${dark ? "text-ink hover:bg-ink/5" : "text-paper/80 hover:bg-paper/10"}`}
              >
                Start over
              </button>
            ) : (
              <div className="p-3">
                <p className={`mb-2 text-[11px] ${dark ? "text-ink-soft" : "text-paper/60"}`}>Erase progress and restart from the beginning?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      restart();
                      setOpen(false);
                      setConfirming(false);
                    }}
                    className="focus-ring flex-1 rounded-sm bg-evidence px-2 py-1.5 text-[11px] text-paper"
                  >
                    Yes, restart
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className={`focus-ring flex-1 rounded-sm border px-2 py-1.5 text-[11px] ${dark ? "border-ink/20 text-ink" : "border-paper/20 text-paper/80"}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        className={`focus-ring flex h-8 w-8 items-center justify-center rounded-full text-sm backdrop-blur-sm ${dark ? "text-ink-soft/50 hover:text-ink" : "text-paper/30 hover:text-paper/70"}`}
      >
        ⋯
      </button>
    </div>
  );
}
