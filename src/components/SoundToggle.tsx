import { useGame } from "../state/GameContext";
import { useSound } from "../hooks/useSound";

export default function SoundToggle({ dark = false }: { dark?: boolean }) {
  const { soundOn, toggleSound } = useGame();
  const play = useSound();

  return (
    <button
      onClick={() => {
        toggleSound();
        if (!soundOn) setTimeout(() => play("click"), 30);
      }}
      aria-label={soundOn ? "Mute sound" : "Unmute sound"}
      aria-pressed={soundOn}
      className={`focus-ring fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border text-sm transition
        ${dark ? "border-ink/20 bg-paper/80 text-ink hover:bg-paper" : "border-paper/25 bg-office-deep/70 text-paper hover:bg-office-deep"}
        backdrop-blur-sm`}
      style={{ fontFamily: "var(--font-type)" }}
    >
      {soundOn ? "♪" : "🔇"}
    </button>
  );
}
