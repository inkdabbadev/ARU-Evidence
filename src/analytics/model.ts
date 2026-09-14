import { DISCONNECTED_MS, SESSION_EXPIRY_MS } from './config';
export type StationStat = { entered_at: string; exited_at?: string; active_ms: number; idle_ms: number; visits: number; completed: boolean; scroll: number };
export type ItemStat = { station: string; kind?: 'book' | 'item'; first_open: string; last_open: string; count: number; dwell_ms: number; opened_at?: string };
export type PuzzleStat = { station: string; started_at: string; completed_at?: string; attempts: number; stage: number; active_ms: number; idle_ms: number; outcome?: string };
export type Snapshot = { current_station: string | null; previous_station: string | null; active_ms: number; idle_ms: number; state: 'active' | 'idle' | 'disconnected'; device: string; viewport: {width: number; height: number}; stations: Record<string, StationStat>; items: Record<string, ItemStat>; puzzles: Record<string, PuzzleStat>; completed: boolean; last_interaction: string; last_action?: string };
export type Journey = { session_id: string; started_at: string; last_seen_at: string; ended_at: string | null; snapshot: Snapshot };
export type JourneyEvent = { event_id: string; session_id?: string; event_type: string; station: string | null; metadata: Record<string, string | number | boolean>; created_at?: string };
export function connectionState(journey: Journey, now = Date.now()) {
  return journey.ended_at || now - Date.parse(journey.last_seen_at) > DISCONNECTED_MS ? 'disconnected' : journey.snapshot.state;
}
export function stationState(journey: Journey, id: string, now = Date.now()) {
  const stat = journey.snapshot.stations[id];
  if (!stat) return 'NOT_REACHED';
  if (journey.snapshot.current_station === id && !journey.snapshot.completed) {
    if (now - Date.parse(journey.last_seen_at) >= SESSION_EXPIRY_MS) return 'ABANDONED';
    return 'CURRENT';
  }
  return stat.visits > 1 ? 'REVISITED' : stat.completed ? 'COMPLETED' : 'NOT_REACHED';
}
// Split at the actual inactivity deadline, even when a browser delays a timer.
export function splitTime(from: number, to: number, lastActivity: number, visible: boolean, idleMs: number) {
  const elapsed = Math.max(0, to - from);
  const active = visible ? Math.max(0, Math.min(to, lastActivity + idleMs) - from) : 0;
  return { active: Math.min(active, elapsed), idle: elapsed - Math.min(active, elapsed) };
}
