import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useGame } from "../state/GameContext";
import { ROOM_ORDER } from "../data/memories";
import "./ArchiveWorlds.css";

type Theme = "office" | "paper" | "garden" | "void" | "cream";

// The shell supplies archive identity only. Each room owns its visual world.
export default function CaseFrame({ children, className = "" }: {
  theme?: Theme;
  children: ReactNode;
  className?: string;
}) {
  const { room } = useGame();
  const page = ROOM_ORDER.indexOf(room);
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className={`archive-world world-${room} ${className}`}
    >
      <div className="archive-signature"><span>CASE #2711</span><span>PERSONAL ARCHIVE / {String(page + 1).padStart(2, "0")}</span></div>
      {children}
    </motion.main>
  );
}
