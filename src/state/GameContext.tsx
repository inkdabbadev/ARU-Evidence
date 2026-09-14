import { collectEvidence, normalizeEvidence, evidencePieces } from "./evidence";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { ROOM_ORDER } from "../data/memories";
import type { RoomId } from "../data/memories";
import { JIGSAW_STORAGE_KEY } from "./storageKeys";

const STORAGE_KEY = "case-2711-progress-v3";

interface GameStateShape {
  room: RoomId;
  piecesFound: number;
  collectedPieces: number[];
  soundOn: boolean;
  visitedFinalRoomIndex: number;
}

interface GameContextValue extends GameStateShape {
  collectionNotice: {id: number; sequence: number} | null;
  goTo: (room: RoomId) => void;
  next: () => void;
  addPiece: (id: number) => void;
  toggleSound: () => void;
  restart: () => void;
  setFinalRoomIndex: (i: number) => void;
}

const defaultState: GameStateShape = {
  room: "intro",
  piecesFound: 0,
  collectedPieces: [],
  soundOn: true,
  visitedFinalRoomIndex: 0,
};

function loadState(): GameStateShape {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    if (!ROOM_ORDER.includes(parsed.room)) return defaultState;
    if (parsed.room === "complete") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(JIGSAW_STORAGE_KEY);
      return defaultState;
    }
    const collectedPieces = normalizeEvidence(parsed.collectedPieces);
    return { ...defaultState, ...parsed, collectedPieces, piecesFound: collectedPieces.length };
  } catch {
    return defaultState;
  }
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameStateShape>(loadState);
  const [restartCount, setRestartCount] = useState(0);
  const [collectionNotice,setCollectionNotice] = useState<{id:number;sequence:number}|null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* localStorage unavailable — game still works, just won't persist */
    }
  }, [state]);

  const goTo = useCallback((room: RoomId) => {
    setState((s) => ({ ...s, room, visitedFinalRoomIndex: room === "final-room" ? s.visitedFinalRoomIndex : 0 }));
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      const idx = ROOM_ORDER.indexOf(s.room);
      const nextRoom = ROOM_ORDER[Math.min(idx + 1, ROOM_ORDER.length - 1)];
      return { ...s, room: nextRoom };
    });
  }, []);

  const addPiece = useCallback((id: number) => {
    if(!evidencePieces.some(piece=>piece.id===id))return;
    setCollectionNotice(previous=>({id,sequence:(previous?.sequence??0)+1}));
    setState(s => {const collectedPieces = collectEvidence(s.collectedPieces,id); return collectedPieces === s.collectedPieces ? s : {...s,collectedPieces,piecesFound:collectedPieces.length};});
  }, []);

  const toggleSound = useCallback(() => {
    setState((s) => ({ ...s, soundOn: !s.soundOn }));
  }, []);

  const restart = useCallback(() => {
    setState(defaultState);
    setCollectionNotice(null);
    setRestartCount(count => count + 1);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(JIGSAW_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setFinalRoomIndex = useCallback((i: number) => {
    setState((s) => ({ ...s, visitedFinalRoomIndex: i }));
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({ ...state, collectionNotice, goTo, next, addPiece, toggleSound, restart, setFinalRoomIndex }),
    [state, collectionNotice, goTo, next, addPiece, toggleSound, restart, setFinalRoomIndex]
  );

  return <GameContext.Provider value={value}><React.Fragment key={restartCount}>{children}</React.Fragment></GameContext.Provider>;
};

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
