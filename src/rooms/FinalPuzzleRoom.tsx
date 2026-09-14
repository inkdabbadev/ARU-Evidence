import { trackEvent } from "../analytics/tracker";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CaseFrame from "../components/CaseFrame";

import { clampGroup, groupBounds, joinGroups, makePieces, PUZZLE_HEIGHT, PUZZLE_WIDTH, scatterPieces } from "../components/jigsawGeometry";
import type { PieceGroup, Point, TableSize } from "../components/jigsawGeometry";
import { finalPuzzle } from "../data/memories";
import { useGame } from "../state/GameContext";
import { JIGSAW_STORAGE_KEY } from "../state/storageKeys";
import { useSound } from "../hooks/useSound";
import "./FinalPuzzle.css";

const ART = import.meta.env.BASE_URL + "image.png";
const PIECES = makePieces();
type Saved = { groups: PieceGroup[]; elapsed: number; size: TableSize };
type Drag = { id: number; start: Point; original: PieceGroup; moved: boolean };

function loadPuzzle(): Saved | null {
  try {
    const data = JSON.parse(localStorage.getItem(JIGSAW_STORAGE_KEY) ?? "null");
    if (!data || !Array.isArray(data.groups) || !data.groups.length || !Number.isFinite(data.elapsed) || data.elapsed < 0 || !Number.isFinite(data.size?.width) || !Number.isFinite(data.size?.height)) return null;
    const indices: number[] = [];
    for (const g of data.groups) {
      if (!Number.isInteger(g.id) || !Number.isFinite(g.x) || !Number.isFinite(g.y) || !Array.isArray(g.pieces) || !g.pieces.length || g.pieces.some((i: number) => !Number.isInteger(i) || i < 0 || i >= PIECES.length)) return null;
      indices.push(...g.pieces);
    }
    if (indices.length !== PIECES.length || new Set(indices).size !== PIECES.length || new Set(data.groups.map((g: PieceGroup) => g.id)).size !== data.groups.length) return null;
    return data;
  } catch { return null; }
}

export default function FinalPuzzleRoom() {
  const { next, room } = useGame();
  const play = useSound();
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const [saved] = useState(loadPuzzle);
  const [groups, setGroups] = useState<PieceGroup[]>(saved?.groups ?? []);
  const groupsRef = useRef(groups);
  const [size, setSize] = useState<TableSize>(saved?.size ?? { width: 1200, height: 760 });
  const sizeRef = useRef(size);
  const [selected, setSelected] = useState<number | null>(null);
  const [edgesOnly, setEdgesOnly] = useState(false);
  const [preview, setPreview] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(saved?.elapsed ?? 0);
  const [started, setStarted] = useState(!!saved);
  const touched = useRef(!!saved);
  const [revealed, setRevealed] = useState(saved?.groups.length === 1);
  const [fullscreen, setFullscreen] = useState(false);
  const [feedback, setFeedback] = useState("Drag matching pieces together anywhere on the table. Joined pieces move as one.");
  const surface = useRef<SVGSVGElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const complete = groups.length === 1;

  function updateGroups(value: PieceGroup[]) { groupsRef.current = value; setGroups(value); }

  useEffect(() => {
    const element = table.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const logicalWidth = Math.max(width < 650 ? 760 : 1200, 480 * width / height);
      const nextSize = { width: logicalWidth, height: logicalWidth * height / width };
      sizeRef.current = nextSize;
      setSize(nextSize);
      const current = groupsRef.current;
      const value = current.length === 1 ? [{ ...current[0], x: (nextSize.width - PUZZLE_WIDTH) / 2, y: (nextSize.height - PUZZLE_HEIGHT) / 2 }]
        : !touched.current ? scatterPieces(PIECES, nextSize) : current.map(g => clampGroup(g, PIECES, nextSize));
      groupsRef.current = value;
      setGroups(value);
      drag.current = null;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || paused || complete) return;
    const start = performance.now();
    const initial = elapsed;
    const timer = setInterval(() => setElapsed(initial + Math.floor((performance.now() - start) / 1000)), 500);
    return () => clearInterval(timer);
    // Capture elapsed only when the timer resumes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, paused, complete]);

  useEffect(() => {
    if (!groups.length || room !== "final-puzzle") return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(JIGSAW_STORAGE_KEY, JSON.stringify({ groups, elapsed, size })); } catch { /* Storage is optional. */ }
    }, 250);
    return () => clearTimeout(timer);
  }, [groups, elapsed, size, room]);

  useEffect(() => {
    if (!complete || revealed) return;
    const timer = setTimeout(() => { trackEvent("puzzle_complete",{puzzle:"final",stage:PIECES.length}); setRevealed(true); play("success"); }, 600);
    return () => clearTimeout(timer);
  }, [complete, revealed, play]);

  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === player.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);

  function coordinates(clientX: number, clientY: number): Point {
    const matrix = surface.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return { x: p.x, y: p.y };
  }

  function finish(id: number, current = groupsRef.current) {
    const result = joinGroups(current, id, PIECES);
    trackEvent("puzzle_attempt",{puzzle:"final",outcome:result.joined?"joined":"placed",stage:PIECES.length-result.groups.length});
    if (result.joined) {
      const largest = Math.max(...result.groups.map(g => g.pieces.length));
      setFeedback(`${result.joined === 1 ? "Click. A perfect fit!" : "Multiple connections!"} ${largest} pieces joined together.`);
      play("click");
    } else setFeedback("Piece placed. Bring a matching neighbour close to snap them together.");
    const nextGroups = result.groups.length === 1 ? [{ ...result.groups[0], x: (sizeRef.current.width - PUZZLE_WIDTH) / 2, y: (sizeRef.current.height - PUZZLE_HEIGHT) / 2 }] : result.groups.map(g => clampGroup(g, PIECES, sizeRef.current));
    updateGroups(nextGroups);
  }

  function begin(event: PointerEvent<SVGGElement>, group: PieceGroup) {
    if (paused || complete || !event.isPrimary || event.button !== 0 || drag.current) return;
    event.stopPropagation();
    surface.current?.setPointerCapture(event.pointerId);
    touched.current = true;
    trackEvent("puzzle_start",{puzzle:"final"}); setStarted(true);
    setSelected(group.id);
    drag.current = { id: group.id, start: coordinates(event.clientX, event.clientY), original: group, moved: false };
    updateGroups([...groupsRef.current.filter(g => g.id !== group.id), group]);
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active) return;
    const point = coordinates(event.clientX, event.clientY);
    const dx = point.x - active.start.x, dy = point.y - active.start.y;
    active.moved ||= Math.hypot(dx, dy) > 3;
    const nextGroup = clampGroup({ ...active.original, x: active.original.x + dx, y: active.original.y + dy }, PIECES, sizeRef.current);
    updateGroups(groupsRef.current.map(g => g.id === active.id ? nextGroup : g));
  }

  function end(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active) return;
    if (active.moved) finish(active.id);
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function cancel() {
    if (drag.current) {
      const original = drag.current.original;
      updateGroups(groupsRef.current.map(g => g.id === original.id ? original : g));
    }
    drag.current = null;
  }

  function placeSelected(event: PointerEvent<SVGRectElement>) {
    if (paused || complete || selected === null || drag.current) return;
    const group = groupsRef.current.find(g => g.id === selected);
    if (!group) return;
    const p = coordinates(event.clientX, event.clientY), bounds = groupBounds(group, PIECES);
    const moved = clampGroup({ ...group, x: p.x - (bounds.left + bounds.right) / 2, y: p.y - (bounds.top + bounds.bottom) / 2 }, PIECES, sizeRef.current);
    touched.current = true;
    trackEvent("puzzle_start",{puzzle:"final"}); setStarted(true);
    finish(group.id, groupsRef.current.map(g => g.id === group.id ? moved : g));
  }

  function keyboard(event: KeyboardEvent<SVGGElement>, group: PieceGroup) {
    if (paused || complete) return;
    if (event.key === "Escape") { setSelected(null); return; }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(group.id); finish(group.id); return; }
    const directions: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    touched.current = true;
    trackEvent("puzzle_start",{puzzle:"final"}); setStarted(true);
    setSelected(group.id);
    const step = event.shiftKey ? 2 : 12;
    const moved = clampGroup({ ...group, x: group.x + direction.x * step, y: group.y + direction.y * step }, PIECES, sizeRef.current);
    updateGroups(groupsRef.current.map(g => g.id === group.id ? moved : g));
  }

  function rearrange() {
    cancel();
    const singlePieces = groupsRef.current.filter(g => g.pieces.length === 1);
    const scattered = scatterPieces(PIECES, sizeRef.current);
    const ids = new Set(singlePieces.map(g => g.id));
    updateGroups(groupsRef.current.map(g => ids.has(g.id) ? scattered.find(s => s.id === g.id)! : g));
    setFeedback("Loose pieces rearranged. Your connected groups are kept together.");
  }

  function restart() {
    drag.current = null;
    touched.current = false;
    setStarted(false); setPaused(false); setElapsed(0); setRevealed(false); setSelected(null); setEdgesOnly(false);
    updateGroups(scatterPieces(PIECES, sizeRef.current));
    setFeedback("A fresh table. Join matching edges anywhere you like.");
  }

  async function toggleFullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await player.current?.requestFullscreen(); }
    catch { setFeedback("Fullscreen is unavailable in this browser. The table still works here."); }
  }

  const time = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  return (
    <CaseFrame className="explorer-world">
      
      <div className="archive-content explorer-content">
        <header className="explorer-heading"><div><span>CASE #2711 / THE ASSEMBLY</span><h1>Something was missing.</h1></div><p>24 pieces. One little moment together.</p></header>
        <div className="explorer-player" ref={player}>
          <nav className="explorer-toolbar" aria-label="Puzzle controls">
            <button onClick={restart} title="Restart puzzle" aria-label="Restart puzzle">↻</button>
            <button onClick={() => setPreview(v => !v)} aria-pressed={preview} title="Show reference image">▧ <span>Picture</span></button>
            <button onClick={() => { setEdgesOnly(v => !v); setSelected(null); }} aria-pressed={edgesOnly} disabled={complete} title="Show edge pieces and connected groups">▱ <span>Edges</span></button>
            <button onClick={rearrange} disabled={complete || paused} title="Rearrange loose pieces">⤨ <span>Arrange</span></button>
            <button className="explorer-timer" onClick={() => { cancel(); setPaused(v => !v); }} aria-label={paused ? "Resume puzzle" : "Pause puzzle"} disabled={complete}>{paused ? "▶" : "Ⅱ"} {time}</button>
            <span className="explorer-count">{Math.max(0, PIECES.length - groups.length)} / 23 joins</span>
            <button onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} title="Fullscreen">⛶</button>
          </nav>
          <div className={`explorer-table ${complete ? "explorer-finished" : ""}`} ref={table}>
            <svg ref={surface} className="explorer-surface" viewBox={`0 0 ${size.width} ${size.height}`} aria-label="Open jigsaw table. Drag matching pieces together; connected groups move together."
              onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={cancel}>
              <defs>
                {PIECES.map(piece => <clipPath key={piece.index} id={`${uid}-piece-${piece.index}`}><path d={piece.path} /></clipPath>)}
                <clipPath id={`${uid}-finished-image`}><rect width={PUZZLE_WIDTH} height={PUZZLE_HEIGHT} /></clipPath>
                <linearGradient id={`${uid}-completion-shine`}>
                  <stop offset="0" stopColor="#fff4d0" stopOpacity="0" />
                  <stop offset="0.45" stopColor="#fff4d0" stopOpacity="0.18" />
                  <stop offset="0.5" stopColor="#fffdf0" stopOpacity="0.65" />
                  <stop offset="0.6" stopColor="#ffe1a0" stopOpacity="0.25" />
                  <stop offset="1" stopColor="#fff4d0" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect width={size.width} height={size.height} fill="transparent" onPointerDown={placeSelected} data-table-background="true" />
              {groups.filter(g => complete || !edgesOnly || g.pieces.length > 1 || g.pieces.some(index => PIECES[index].edge)).map(group => <g key={group.id} transform={`translate(${group.x} ${group.y})`} data-group={group.id} data-members={group.pieces.join(',')}
                className={`explorer-group ${selected === group.id && !complete ? "selected" : ""} ${complete ? "completed" : ""}`} role="button" tabIndex={paused || complete ? -1 : 0}
                aria-label={`Puzzle group with ${group.pieces.length} ${group.pieces.length === 1 ? 'piece' : 'pieces'}. Arrow keys move, Enter joins.`}
                onFocus={() => { if (!paused && !complete) { setSelected(group.id); updateGroups([...groupsRef.current.filter(g => g.id !== group.id), group]); } }}
                onPointerDown={event => begin(event, group)} onKeyDown={event => keyboard(event, group)}>
                {group.pieces.map(index => <g key={index} data-piece={index}>
                  <path d={PIECES[index].path} className="explorer-piece-backing" />
                  <image href={ART} width={PUZZLE_WIDTH} height={PUZZLE_HEIGHT} clipPath={`url(#${uid}-piece-${index})`} pointerEvents="none" />
                  <path d={PIECES[index].path} className="explorer-piece-edge" />
                </g>)}
                {revealed && <motion.image href={ART} width={PUZZLE_WIDTH} height={PUZZLE_HEIGHT} pointerEvents="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : 1 }} />}
                {revealed && !reducedMotion && <g className="explorer-completion-shine" clipPath={`url(#${uid}-finished-image)`} pointerEvents="none" aria-hidden="true">
                  <motion.g initial={{ x: -350, opacity: 0 }} animate={{ x: 950, opacity: [0, 1, 1, 0] }} transition={{ duration: 1.6, delay: .55, ease: "easeInOut" }}>
                    <rect width="300" height={PUZZLE_HEIGHT} transform="skewX(-18)" fill={`url(#${uid}-completion-shine)`} />
                  </motion.g>
                </g>}
              </g>)}
            </svg>
            {preview && <div className="explorer-reference"><button onClick={() => setPreview(false)} aria-label="Close reference image">×</button><img src={ART} alt="Reference: two chairs and coffee at sunset, with the word TIME" /><span>THE FINISHED PICTURE</span></div>}
            {paused && !complete && <div className="explorer-pause"><h2>Take your time.</h2><p>The pieces can wait.</p><button onClick={() => setPaused(false)}>Resume puzzle</button></div>}
            {revealed && <div className="explorer-win" role="status"><span>✦ MEMORY RESTORED ✦</span><strong>{finalPuzzle.revealWord}</strong><button onClick={async () => { if (document.fullscreenElement) await document.exitFullscreen(); next(); }}>Continue the story →</button></div>}
          </div>
          <footer className="explorer-status" role="status">{complete ? `Picture complete in ${time}. Every little piece belongs.` : feedback}</footer>
        </div>
        <p className="explorer-help">Drag to move • Matching neighbours snap together • Tap a group, then empty space to move it • Arrow keys + Enter also work • Progress saves automatically</p>
      </div>
    </CaseFrame>
  );
}
