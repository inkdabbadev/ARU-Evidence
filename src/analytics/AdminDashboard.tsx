import { makeSampleJourney } from './sampleJourney';
import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { adminClient } from './supabase';
import { stations, stationLabel } from './config';
import { connectionState, stationState, type Journey, type JourneyEvent } from './model';
import { books } from '../rooms/bookstoreBooks';
import './admin.css';

const duration = (ms: number) => `${Math.floor(ms / 60000)}m ${Math.floor(ms / 1000) % 60}s`;
const time = (value?: string | null) => value ? new Date(value).toLocaleString() : '—';
const title = (id: unknown) => books.find(b => b.id === id)?.title ?? String(id ?? '');
function eventLabel(event: JourneyEvent) {
  const m = event.metadata;
  if (event.event_type === 'book_open' || event.event_type === 'book_close') return `${event.event_type === 'book_open' ? 'Opened' : 'Closed'} “${title(m.book)}”`;
  if (event.event_type === 'station_enter') return `Entered ${stationLabel(event.station)}`;
  if (event.event_type === 'station_exit') return `Left ${stationLabel(event.station)}`;
  return [event.event_type.replaceAll('_', ' '), m.puzzle ?? m.action ?? m.item, m.outcome].filter(Boolean).join(' · ');
}

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(Boolean(adminClient));
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview,setPreview] = useState(false);
  useEffect(() => {
    if (!adminClient) return;
    let active = true;
    const check = async (value: Session | null) => {
      if (!active) return;
      setSession(value); setAllowed(false); setChecking(true);
      if (value) {
        const {data, error} = await adminClient!.rpc('is_journey_admin');
        if (!active) return;
        setAllowed(data === true);
        if (error) setError('Unable to verify access. Check the Supabase connection and migration.');
      }
      if (active) setChecking(false);
    };
    void adminClient.auth.getSession().then(({data}) => check(data.session));
    const {data} = adminClient.auth.onAuthStateChange((_event, value) => { setTimeout(() => void check(value), 0); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const data = new FormData(e.currentTarget);
    try {
      const {error} = await adminClient!.auth.signInWithPassword({email: String(data.get('email')).trim(), password: String(data.get('password'))});
      if (error) {
        if (error.code === 'captcha_failed') {
          setError('Sign-in is blocked by CAPTCHA protection. This login form needs a CAPTCHA challenge before you can sign in. See the CAPTCHA setup in ANALYTICS_SETUP.md.');
        } else if (error.code === 'email_not_confirmed') {
          setError('Confirm your email address before signing in.');
        } else if (error.code === 'invalid_credentials') {
          setError('Supabase did not accept this email and password. Check the account in Authentication > Users for the connected project.');
        } else if (error.status === 429) {
          setError('Too many sign-in attempts. Wait a few minutes and try again.');
        } else {
          setError('Sign-in is unavailable. Check your connection and the Supabase authentication settings.');
        }
      }
    } catch {
      setError('Could not reach the sign-in service. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }
  return <main className="journey-admin">
    <header className="admin-header"><div><span>CASE #2711 / PRIVATE CONTROL ROOM</span><h1>Live journey</h1></div>{session && <button onClick={() => void adminClient?.auth.signOut()}>Sign out</button>}</header>
    {!adminClient ? preview ? <><div className="admin-preview-banner"><strong>SAMPLE DATA / NOT LIVE</strong><p>Explore a fictional visit. No real visitor data is loaded. Connect Supabase later to enable private live tracking.</p><button onClick={()=>setPreview(false)}>Back to setup</button></div><ControlRoom preview /></> : <section className="admin-login"><h2>Ready to connect</h2><p>The dashboard is built. Add your Supabase project URL and publishable key, apply the migration, and allowlist your admin account.</p><p>Follow <code>ANALYTICS_SETUP.md</code> in the project. Visitor tracking stays off until configured.</p><button onClick={()=>setPreview(true)}>Explore sample dashboard</button><p><a href="/">Back to the experience</a></p></section>
      : checking ? <p role="status">Verifying private access…</p>
      : !session ? <form className="admin-login" onSubmit={login}><h2>Admin sign in</h2><label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</button><p>Access requires an account on the database admin allowlist.</p></form>
      : !allowed ? <section className="admin-login"><h2>Access not granted</h2><p>This account is not on the journey admin allowlist. No visitor data has been loaded.</p></section>
      : <ControlRoom />}
    {error && <p className="admin-error" role="alert">{error}</p>}
  </main>;
}

function ControlRoom({preview=false}:{preview?:boolean}) {
  const [sample] = useState(()=>preview ? makeSampleJourney() : null);
  const [journeys, setJourneys] = useState<Journey[]>(sample?.journeys ?? []);
  const [selected, setSelected] = useState(sample?.journeys[0].session_id ?? '');
  const [station, setStation] = useState<string | null>(null);
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [limit, setLimit] = useState(50);
  const [feedLimit, setFeedLimit] = useState(100);
  const [live, setLive] = useState(preview ? 'Sample snapshot / no live connection' : 'Connecting');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!preview);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if(preview)return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [preview]);
  useEffect(() => {
    if(preview)return;
    let active = true;
    const load = async () => {
      const {data, error} = await adminClient!.from('journey_sessions').select('session_id,started_at,last_seen_at,ended_at,snapshot').order('last_seen_at', {ascending: false}).limit(limit);
      if (!active) return;
      setLoading(false);
      if (error) { setError('Could not load journeys. Check access, connection and database setup.'); return; }
      setError(''); setJourneys(data as Journey[]);
      setSelected(current => current || data?.[0]?.session_id || '');
    };
    void load();
    let timer: ReturnType<typeof setTimeout>;
    const channel = adminClient!.channel('journey-history').on('postgres_changes', {event: '*', schema: 'public', table: 'journey_sessions'}, () => { clearTimeout(timer); timer = setTimeout(() => void load(), 150); }).subscribe(status => { if (active) setLive(status === 'SUBSCRIBED' ? 'Realtime connected' : 'Realtime reconnecting · polling every 30s'); });
    const poll = setInterval(() => void load(), 30000);
    return () => { active = false; clearTimeout(timer); clearInterval(poll); void adminClient!.removeChannel(channel); };
  }, [limit, preview]);
  useEffect(() => {
    if (preview || !selected) return;
    let active = true;
    const load = async () => {
      const {data, error} = await adminClient!.from('journey_events').select('*').eq('session_id', selected).order('created_at', {ascending: false}).limit(feedLimit);
      if (!active) return;
      if (error) setError('Unable to load this event feed.'); else setEvents(data as JourneyEvent[]);
    };
    void load();
    let timer: ReturnType<typeof setTimeout>;
    const channel = adminClient!.channel(`journey-feed-${selected}`).on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'journey_events', filter: `session_id=eq.${selected}`}, () => { clearTimeout(timer); timer = setTimeout(() => void load(), 150); }).subscribe();
    const poll = setInterval(() => void load(), 30000);
    return () => { active = false; clearTimeout(timer); clearInterval(poll); void adminClient!.removeChannel(channel); };
  }, [selected, feedLimit, preview]);
  const displayedEvents = sample ? sample.events.filter(e=>e.session_id===selected) : events;
  const journey = journeys.find(j => j.session_id === selected);
  const s = journey?.snapshot;
  const stationId = station ?? s?.current_station ?? 'intro';
  const stat = s?.stations[stationId];
  const completion = s ? Math.round(stations.filter(st => s.stations[st.id]?.completed).length / stations.length * 100) : 0;
  return <>
    <div className="admin-connection" role="status">{live}<span>Anonymous in-experience interactions only</span></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-layout"><aside className="admin-history"><h2>Visits</h2>{loading && <p>Loading journeys…</p>}{!loading && !journeys.length && <p>No visits yet. Open the experience to begin.</p>}
      {journeys.map(j => <button key={j.session_id} className={selected === j.session_id ? 'selected' : ''} onClick={() => {setSelected(j.session_id); setStation(null); setEvents([]); setFeedLimit(100);}}><strong>{time(j.started_at)}</strong><span>{connectionState(j, now)} · {duration(j.snapshot.active_ms + j.snapshot.idle_ms)}</span><small>{stationLabel(j.snapshot.current_station)} · {j.session_id.slice(0, 8)}</small></button>)}
      {journeys.length >= limit && <button onClick={() => setLimit(v => v + 50)}>Load older visits</button>}
    </aside><div className="admin-main">{journey && s && <>
      <section className="admin-summary"><div className={`admin-state state-${connectionState(journey, now)}`}>{s.completed ? 'CASE COMPLETE · ' : ''}{connectionState(journey, now).toUpperCase()}</div><h2>{stationLabel(s.current_station)}</h2><p>Started {time(journey.started_at)} · Last report {Math.max(0, Math.floor((now - Date.parse(journey.last_seen_at)) / 1000))}s ago</p>
        <dl className="admin-metrics"><div><dt>Elapsed to last report</dt><dd>{duration(Math.max(0,Date.parse(journey.last_seen_at)-Date.parse(journey.started_at)))}</dd></div><div><dt>Reported time</dt><dd>{duration(s.active_ms + s.idle_ms)}</dd></div><div><dt>Active</dt><dd>{duration(s.active_ms)}</dd></div><div><dt>Idle</dt><dd>{duration(s.idle_ms)}</dd></div><div><dt>Journey completed</dt><dd>{completion}%</dd></div><div><dt>Viewport category</dt><dd>{s.device} · {s.viewport.width} × {s.viewport.height}</dd></div></dl>
      </section>
      <section className="admin-route" aria-label="Journey metro route">{stations.map(st => { const state = stationState(journey, st.id, now); return <button key={st.id} className={`admin-station station-${state} ${stationId === st.id ? 'station-selected' : ''}`} onClick={() => setStation(st.id)} aria-label={`${st.label}: ${state}`} aria-pressed={stationId === st.id}><small>{duration((s.stations[st.id]?.active_ms ?? 0) + (s.stations[st.id]?.idle_ms ?? 0))}</small><i aria-hidden="true">{state === 'COMPLETED' ? '✓' : state === 'REVISITED' ? '↺' : state === 'ABANDONED' ? '!' : ''}</i><strong>{st.label}</strong><em>{state.replace('_', ' ').toLowerCase()}</em></button>; })}</section>
      <section className="admin-detail"><span>{stationId === s.current_station ? 'CURRENT STATION' : 'STATION DETAIL'}</span><h2>{stationLabel(stationId)}</h2>{!stat ? <p>Not reached.</p> : <><dl className="admin-metrics"><div><dt>Time here</dt><dd>{duration(stat.active_ms + stat.idle_ms)}</dd></div><div><dt>Active / Idle</dt><dd>{duration(stat.active_ms)} / {duration(stat.idle_ms)}</dd></div><div><dt>Visits</dt><dd>{stat.visits}</dd></div><div><dt>Maximum scroll</dt><dd>{stat.scroll}%</dd></div><div><dt>Last entered</dt><dd>{time(stat.entered_at)}</dd></div><div><dt>Last exited</dt><dd>{time(stat.exited_at)}</dd></div></dl><p>Last station action: {eventLabel(displayedEvents.find(e => e.station === stationId && !['heartbeat','site_open','site_close'].includes(e.event_type)) ?? {event_id: '', event_type: 'none recorded', station: stationId, metadata: {}})}</p>{stationId === s.current_station && <p>Last interaction: {time(s.last_interaction)}{connectionState(journey, now) === 'disconnected' && ' · visitor is no longer reporting'}</p>}</>}
        {stationId === 'piece2' && <><h3>Books opened: {books.filter(b => s.items[b.id]).length} / {books.length}</h3><div className="admin-books">{books.map(book => { const item = s.items[book.id]; return <article key={book.id} className={item ? 'opened' : ''}><strong>{item ? '✓ ' : '○ '}{book.title}</strong>{item && <><span>{item.count} opens · {duration(item.dwell_ms)} viewing</span><small>First: {time(item.first_open)}<br/>Latest: {time(item.last_open)}</small></>}</article>; })}</div></>}
        {Object.entries(s.puzzles).filter(([,p]) => p.station === stationId).map(([id,p]) => <article className="admin-puzzle" key={id}><h3>{id} · {p.completed_at ? 'COMPLETE' : 'IN PROGRESS'}</h3><p>{duration((p.active_ms ?? 0)+(p.idle_ms ?? 0))} spent · {p.attempts} attempts · Stage {p.stage || 1} · {p.outcome ?? 'Started'}</p><p>Started {time(p.started_at)} · Completed {time(p.completed_at)}</p></article>)}
      </section>
      <section className="admin-feed"><h2>Event timeline <small>Newest first</small></h2>{displayedEvents.length === 0 && <p>No events received yet.</p>}<ol>{displayedEvents.map(e => <li key={e.event_id}><time>{time(e.created_at)}</time><span>{eventLabel(e)}</span></li>)}</ol>{displayedEvents.length >= feedLimit && <button onClick={() => setFeedLimit(v => v + 100)}>Load earlier events</button>}</section>
    </>}</div></div>
  </>;
}
