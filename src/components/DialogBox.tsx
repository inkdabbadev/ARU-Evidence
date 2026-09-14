import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export default function DialogBox({
  open,
  onClose,
  title,
  children,
  tone = "neutral",
}: {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  tone?: "neutral" | "error" | "success";
}) {
  const barColor = tone === "error" ? "bg-evidence" : tone === "success" ? "bg-moss" : "bg-brass";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 6 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          role="dialog"
          aria-live="polite"
          className="scrapbook-dialog pointer-events-auto w-full max-w-xs overflow-hidden rounded border border-ink/15 bg-paper shadow-2xl"
        >
          <div className={`flex items-center justify-between px-3 py-1.5 ${barColor}`}>
            <span className="truncate text-[11px] tracking-wide text-office-deep" style={{ fontFamily: "var(--font-type)" }}>
              {title ?? "SYSTEM"}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="focus-ring flex h-4 w-4 items-center justify-center rounded-sm bg-office-deep/20 text-[10px] leading-none text-office-deep hover:bg-office-deep/30"
              >
                ×
              </button>
            )}
          </div>
          <div className="px-4 py-3 text-sm leading-relaxed text-ink">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
