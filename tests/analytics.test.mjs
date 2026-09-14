import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function environment({configured = true, storage = new Map()} = {}) {
  let now = 1_800_000_000_000, serial = 0;
  const intervals = [], timeouts = [], cache = {}, calls = [];
  const document = new EventTarget(); document.hidden = false; document.documentElement = {scrollHeight: 100, clientHeight: 100};
  const window = new EventTarget();
  const context = {console, Event, EventTarget, Element: class {}, document, window,
    Date: class extends Date { constructor(value = now) { super(value); } static now() { return now; } },
    crypto: {randomUUID: () => `id-${++serial}`}, innerWidth: 1440, innerHeight: 900,
    navigator: {onLine: true},
    localStorage: {getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k)},
    setInterval: fn => {intervals.push(fn); return fn;}, clearInterval: fn => {const i = intervals.indexOf(fn); if(i >= 0)intervals.splice(i,1);},
    setTimeout: fn => {timeouts.push(fn); return fn;}, clearTimeout: fn => {const i = timeouts.indexOf(fn); if(i >= 0)timeouts.splice(i,1);},
  };
  function load(name) {
    if (name === './supabase') return {visitorClient: configured ? {auth: {getSession: async () => ({data:{session:{}}})}, rpc: async (...args) => { calls.push(args); return {error:null}; }} : null};
    if(cache[name]) return cache[name];
    const source = fs.readFileSync(new URL(`../src/analytics/${name.replace('./','')}.ts`, import.meta.url),'utf8');
    const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    const module = {exports:{}};
    vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`,context)(load,module,module.exports);
    return cache[name] = module.exports;
  }
  return {tracker:load('./tracker'), model:load('./model'), storage, document, window, calls,
    advance: ms => {now += ms; for(const fn of [...intervals])fn();},
    flush: async () => {for(const fn of timeouts.splice(0))fn(); await new Promise(r=>setImmediate(r));},
    state: () => JSON.parse(storage.get('case-journey-v1') ?? 'null'),
  };
}
test('unconfigured tracking is a no-op', () => {
  const e=environment({configured:false});e.tracker.startTracking('piece2');e.tracker.trackEvent('book_open',{book:'example'});assert.equal(e.storage.size,0);
});
test('actual initial station, idle split, background time and resume', () => {
  const e=environment();e.tracker.startTracking('piece2');e.advance(90_000);
  let s=e.state().snapshot;assert.equal(s.current_station,'piece2');assert.equal(Object.keys(s.stations).length,1);assert.equal(s.active_ms,60_000);assert.equal(s.idle_ms,30_000);assert.equal(s.state,'idle');
  e.window.dispatchEvent(new Event('pointerdown'));e.advance(10_000);assert.equal(e.state().snapshot.active_ms,70_000);
  e.document.hidden=true;e.document.dispatchEvent(new Event('visibilitychange'));e.advance(10_000);s=e.state().snapshot;assert.equal(s.active_ms,70_000);assert.equal(s.idle_ms,40_000);
});
test('item dwell, puzzle attempts, metadata minimization and station completion', () => {
  const e=environment();e.tracker.startTracking('piece2');e.tracker.trackEvent('book_open',{book:'house-arrest',email:'must-not-be-sent',text:'secret'});e.advance(12_000);e.tracker.trackEvent('book_close',{book:'house-arrest'});e.advance(5_000);
  assert.equal(e.state().snapshot.items['house-arrest'].dwell_ms,12_000);assert.ok(!JSON.stringify(e.state()).includes('must-not-be-sent'));assert.ok(!JSON.stringify(e.state()).includes('secret'));
  e.tracker.enterStation('piece3');e.tracker.trackEvent('puzzle_start',{puzzle:'connections'});e.tracker.trackEvent('puzzle_start',{puzzle:'connections'});e.tracker.trackEvent('puzzle_attempt',{puzzle:'connections',outcome:'retry'});e.advance(2_000);e.tracker.trackEvent('puzzle_complete',{puzzle:'connections',stage:4});
  const s=e.state();assert.equal(s.queue.filter(x=>x.event_type==='puzzle_start').length,1);assert.equal(s.snapshot.puzzles.connections.attempts,1);assert.equal(s.snapshot.puzzles.connections.active_ms,2_000);assert.ok(s.snapshot.puzzles.connections.completed_at);assert.ok(s.snapshot.stations.piece2.completed);
  e.tracker.enterStation('piece2');assert.equal(e.state().snapshot.stations.piece2.visits,2);
});
test('refresh keeps identity and excludes closed time; later return creates new visit', () => {
  const e=environment();let stop=e.tracker.startTracking('piece2');e.advance(15_000);const id=e.state().id;stop();e.advance(10_000);stop=e.tracker.startTracking('piece2');e.advance(5_000);assert.equal(e.state().id,id);assert.equal(e.state().snapshot.active_ms,20_000);stop();e.advance(31*60_000);e.tracker.startTracking('piece2');assert.notEqual(e.state().id,id);
});
test('batch RPC drains acknowledged events', async () => {
  const e=environment();e.tracker.startTracking('piece2');e.tracker.trackEvent('book_open',{book:'house-arrest'});await e.flush();assert.equal(e.calls.length,1);assert.equal(e.calls[0][0],'record_journey');assert.equal(e.state().queue.length,0);
});

test('reopening a completed experience creates a new analytics visit', () => {
  const e=environment();
  const stop=e.tracker.startTracking('intro');
  e.tracker.enterStation('complete');
  const completedId=e.state().id;
  assert.equal(e.state().snapshot.completed,true);
  stop();
  e.tracker.startTracking('intro');
  assert.notEqual(e.state().id,completedId);
  assert.equal(e.state().snapshot.completed,false);
  assert.equal(e.state().snapshot.current_station,'intro');
  assert.equal(e.state().snapshot.active_ms,0);
});
test('stale active reports disconnect and abandonment waits for expiry', () => {
  const e=environment();const now=Date.now();const journey={ended_at:null,last_seen_at:new Date(now-100_000).toISOString(),snapshot:{state:'active',current_station:'piece2',completed:false,stations:{piece2:{visits:1,completed:false}}}};
  assert.equal(e.model.connectionState(journey,now),'disconnected');assert.equal(e.model.stationState(journey,'piece2',now),'CURRENT');assert.equal(e.model.stationState(journey,'piece2',now+30*60_000),'ABANDONED');journey.snapshot.stations.piece2.completed=true;journey.snapshot.completed=true;assert.equal(e.model.stationState(journey,'piece2',now+30*60_000),'COMPLETED');
});
