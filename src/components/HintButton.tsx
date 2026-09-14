import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function HintButton({
  hint,
  delayMs = 18000,
  dark = false,
}: {
  hint: string;
  delayMs?: number;
  dark?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setReady(false);
    setOpen(false);
    const t = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(t);
  }, [hint, delayMs]);

  return (
    <div className="flex flex-col items-center gap-2">
      <AnimatePresence>
        {ready && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen((o) => !o)}
            className={`focus-ring rounded-full border px-4 py-1.5 text-xs tracking-wide transition
              ${dark ? "border-ink/25 text-ink-soft hover:bg-ink/5" : "border-paper/25 text-paper/70 hover:bg-paper/10"}`}
          >
            {open ? "Hide hint" : "Stuck? Need a hint"}
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {ready && open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`max-w-xs text-center text-sm italic ${dark ? "text-ink-soft" : "text-paper/70"}`}
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
