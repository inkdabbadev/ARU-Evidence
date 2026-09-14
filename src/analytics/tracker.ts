import { visitorClient } from './supabase';
import { HEARTBEAT_MS, IDLE_MS, SESSION_EXPIRY_MS, stations } from './config';
import { splitTime, type JourneyEvent, type Snapshot } from './model';

const STORAGE = 'case-journey-v1';
const LEASE = 'case-journey-reporter';
const tab = crypto.randomUUID();
const allowedEvents = new Set(['site_open','site_close','station_enter','station_exit','book_open','book_close','item_open','item_close','button_click','puzzle_start','puzzle_attempt','puzzle_complete','idle_start','idle_end','visibility_hidden','visibility_visible','heartbeat','experience_complete']);
type Saved = { id: string; touched: number; snapshot: Snapshot; queue: JourneyEvent[] };
let saved: Saved | null = null;
let running = false, sending = false, visible = true, lastActivity = Date.now(), accounted = Date.now();
let requestedStation = 'intro';
let flushTimer: ReturnType<typeof setTimeout> | undefined;
function read(): Saved | null { try { const value = JSON.parse(localStorage.getItem(STORAGE) || 'null'); return value && typeof value.id === 'string' && Number.isFinite(value.touched) && Array.isArray(value.queue) && value.snapshot?.stations && value.snapshot?.items && value.snapshot?.puzzles ? value : null; } catch { return null; } }
function persist() { if (saved) { saved.touched = Date.now(); try { localStorage.setItem(STORAGE, JSON.stringify(saved)); } catch { /* Storage restrictions must not interrupt play. */ } } }
function ownLease() {
  try {
    const lease = JSON.parse(localStorage.getItem(LEASE) || 'null');
    if (lease && lease.tab !== tab && lease.until > Date.now()) return false;
    localStorage.setItem(LEASE, JSON.stringify({tab, until: Date.now() + 5000}));
    return true;
  } catch { return true; }
}
function initialise() {
  const previous = read();
  saved = previous && !previous.snapshot.completed && Date.now() - previous.touched < SESSION_EXPIRY_MS ? previous : {
    id: crypto.randomUUID(), touched: Date.now(), queue: [], snapshot: {
      current_station: null, previous_station: null, active_ms: 0, idle_ms: 0, state: 'active',
      device: innerWidth < 768 ? 'mobile' : innerWidth < 1024 ? 'tablet' : 'desktop',
      viewport: {width: innerWidth, height: innerHeight}, stations: {}, items: {}, puzzles: {}, completed: false, last_interaction: new Date().toISOString(),
    },
  };
  // Time while the page was closed is not engagement or item dwell.
  for (const item of Object.values(saved.snapshot.items)) delete item.opened_at;
  accounted = lastActivity = Date.now();
}
function account() {
  if (!saved) return;
  const now = Date.now();
  const {active, idle} = splitTime(accounted, now, lastActivity, visible, IDLE_MS);
  accounted = now;
  const s = saved.snapshot;
  s.active_ms += active; s.idle_ms += idle;
  const station = s.current_station && s.stations[s.current_station];
  if (station) { station.active_ms += active; station.idle_ms += idle; }
  for (const item of Object.values(s.items)) if (item.opened_at) item.dwell_ms += active + idle;
  for (const puzzle of Object.values(s.puzzles)) if(puzzle.station === s.current_station && !puzzle.completed_at){puzzle.active_ms = (puzzle.active_ms ?? 0) + active; puzzle.idle_ms = (puzzle.idle_ms ?? 0) + idle;}
}
function event(type: string, metadata: JourneyEvent['metadata'] = {}) {
  if (!saved) return;
  saved.queue.push({event_id: crypto.randomUUID(), event_type: type, station: saved.snapshot.current_station, metadata});
  // Bounded offline queue: recent meaningful actions take precedence over heartbeats.
  if (saved.queue.length > 300) {
    const heartbeat = saved.queue.findIndex(e => e.event_type === 'heartbeat');
    saved.queue.splice(heartbeat < 0 ? 0 : heartbeat, 1);
  }
  persist();
  if (!flushTimer) flushTimer = setTimeout(() => {flushTimer = undefined; void flush();}, 600);
}
async function flush() {
  if (!visitorClient || !saved || sending || !navigator.onLine) return;
  sending = true;
  const batch = saved.queue.slice(0, 100);
  const id = saved.id;
  try {
    const {data, error: authError} = await visitorClient.auth.getSession();
    if (authError) return;
    if (!data.session) { const {error} = await visitorClient.auth.signInAnonymously(); if (error) return; }
    const {error} = await visitorClient.rpc('record_journey', {p_session_id: id, p_snapshot: saved.snapshot, p_events: batch});
    if (!error && saved.id === id) { const ids = new Set(batch.map(e => e.event_id)); saved.queue = saved.queue.filter(e => !ids.has(e.event_id)); persist(); }
  } catch { /* Offline or unconfigured backend: retain bounded queue and retry. */ }
  finally { sending = false; }
}
export function enterStation(id: string) {
  requestedStation = id;
  if (!running || !saved || !stations.some(s => s.id === id) || !ownLease()) return;
  account();
  const s = saved.snapshot;
  if (s.current_station === id) return;
  const now = new Date().toISOString();
  if (s.current_station) {
    const old = s.stations[s.current_station]; old.exited_at = now; if(stations.findIndex(st => st.id === id) > stations.findIndex(st => st.id === s.current_station)) old.completed = true;
    for (const [id, item] of Object.entries(s.items)) if (item.opened_at) { delete item.opened_at; event(item.kind === 'item' ? 'item_close' : 'book_close', {[item.kind === 'item' ? 'item' : 'book']: id}); }
    event('station_exit');
  }
  s.previous_station = s.current_station; s.current_station = id;
  const old = s.stations[id];
  s.stations[id] = {...(old ?? {active_ms: 0, idle_ms: 0, completed: false, scroll: 0}), entered_at: now, exited_at: undefined, visits: (old?.visits ?? 0) + 1};
  lastActivity = Date.now(); s.last_interaction = now;
  event('station_enter');
  if (id === 'complete') { s.completed = true; s.stations[id].completed = true; event('experience_complete'); }
}
export function trackEvent(type: string, metadata: JourneyEvent['metadata'] = {}) {
  if (!running || !saved || !ownLease() || !allowedEvents.has(type)) return;
  if(type === 'puzzle_start' && saved.snapshot.puzzles[String(metadata.puzzle)]) return;
  account();
  // Explicit metadata allowlist. Never copy DOM text, key values or form contents.
  const clean: JourneyEvent['metadata'] = {};
  for (const key of ['book','item','puzzle','action','outcome','stage']) {
    const value = metadata[key];
    if (typeof value === 'number' && Number.isFinite(value)) clean[key] = value;
    if (typeof value === 'string') clean[key] = value.slice(0, 100);
  }
  const s = saved.snapshot, now = new Date().toISOString(), station = s.current_station ?? requestedStation;
  const itemId = String(clean.book ?? clean.item ?? '');
  if (itemId && (type === 'book_open' || type === 'item_open')) {
    const old = s.items[itemId];
    s.items[itemId] = {station, kind: type === 'book_open' ? 'book' : 'item', first_open: old?.first_open ?? now, last_open: now, opened_at: now, count: (old?.count ?? 0) + 1, dwell_ms: old?.dwell_ms ?? 0};
  }
  if (itemId && (type === 'book_close' || type === 'item_close') && s.items[itemId]) delete s.items[itemId].opened_at;
  if (clean.puzzle && type.startsWith('puzzle_')) {
    const key = String(clean.puzzle);
    const puzzle = s.puzzles[key] ??= {station, started_at: now, attempts: 0, stage: 0, active_ms: 0, idle_ms: 0};
    if (type === 'puzzle_attempt') puzzle.attempts++;
    if (type === 'puzzle_complete') puzzle.completed_at = now;
    if (typeof clean.stage === 'number') puzzle.stage = Math.max(puzzle.stage, clean.stage);
    if (clean.outcome) puzzle.outcome = String(clean.outcome);
  }
  s.last_action = [type, clean.book ?? clean.item ?? clean.puzzle ?? clean.action ?? ''].filter(Boolean).join(': ');
  s.last_interaction = now;
  event(type, clean);
}
export function startTracking(initialStation = requestedStation) {
  requestedStation = initialStation;
  if (!visitorClient || running) return () => {};
  running = true; initialise(); visible = !document.hidden;
  let leader = ownLease();
  if (leader) { event('site_open'); enterStation(requestedStation); }
  const activity = () => { if (!leader) return; account(); lastActivity = Date.now(); if (saved) saved.snapshot.last_interaction = new Date().toISOString(); updateState(); };
  const updateState = () => { if (!saved || !leader) return; const state = visible && Date.now() - lastActivity < IDLE_MS ? 'active' : 'idle'; if (saved.snapshot.state !== state) { saved.snapshot.state = state; event(state === 'idle' ? 'idle_start' : 'idle_end'); } };
  const visibility = () => { if (!leader) return; account(); visible = !document.hidden; if (visible) lastActivity = Date.now(); updateState(); event(visible ? 'visibility_visible' : 'visibility_hidden'); void flush(); };
  const blur = () => { if (!leader) return; account(); visible = false; updateState(); };
  const focus = () => { if (!leader) return; account(); visible = !document.hidden; activity(); };
  const scroll = (e: Event) => { activity(); if (!saved || !leader) return; const el = e.target instanceof Element ? e.target : document.documentElement; const max = el.scrollHeight - el.clientHeight; const stat = saved.snapshot.current_station && saved.snapshot.stations[saved.snapshot.current_station]; if (stat && max > 0) stat.scroll = Math.max(stat.scroll, Math.min(100, Math.round(el.scrollTop / max * 100))); };
  const click = (e: Event) => { const el = (e.target as Element)?.closest?.('[data-analytics-action]'); if (el) trackEvent('button_click', {action: el.getAttribute('data-analytics-action')!}); };
  const close = () => { if (!leader || !saved) return; account(); for (const [id,item] of Object.entries(saved.snapshot.items)) if(item.opened_at){delete item.opened_at;event(item.kind === 'item' ? 'item_close' : 'book_close',{[item.kind === 'item' ? 'item' : 'book']:id});} saved.snapshot.state = 'disconnected'; event('site_close'); void flush(); try { localStorage.removeItem(LEASE); } catch { /* best effort */ } };
  const restore = (e: PageTransitionEvent) => { if (!e.persisted) return; initialise(); visible = !document.hidden; leader = ownLease(); if (leader) {event('site_open'); enterStation(requestedStation); updateState();} };
  const tick = setInterval(() => {
    const owns = ownLease();
    if (owns && !leader) { initialise(); leader = true; event('site_open'); enterStation(requestedStation); }
    leader = owns;
    if (!leader) { accounted = Date.now(); return; }
    account(); updateState(); persist();
  }, 2000);
  const heartbeat = setInterval(() => { if (!leader || !saved) return; account(); saved.snapshot.viewport = {width: innerWidth, height: innerHeight}; event('heartbeat'); void flush(); }, HEARTBEAT_MS);
  const events = ['pointerdown','pointermove','touchstart','keydown'];
  events.forEach(name => window.addEventListener(name, activity, {passive: true}));
  window.addEventListener('scroll', scroll, {capture: true, passive: true});
  document.addEventListener('click', click, true); document.addEventListener('visibilitychange', visibility);
  window.addEventListener('blur', blur); window.addEventListener('focus', focus); window.addEventListener('pagehide', close);
  window.addEventListener('pageshow', restore);
  const online = () => void flush(); window.addEventListener('online', online);
  return () => {
    close(); running = false; clearInterval(tick); clearInterval(heartbeat); clearTimeout(flushTimer); flushTimer = undefined;
    events.forEach(name => window.removeEventListener(name, activity));
    window.removeEventListener('scroll', scroll, true); document.removeEventListener('click', click, true); document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('blur', blur); window.removeEventListener('focus', focus); window.removeEventListener('pagehide', close); window.removeEventListener('online', online);
    window.removeEventListener('pageshow', restore);
  };
}
