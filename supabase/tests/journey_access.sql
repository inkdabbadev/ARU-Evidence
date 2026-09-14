-- Run after BOTH migrations in a development SQL editor. Rolls back all fixtures.
begin;
insert into auth.users(id) values
 ('27110000-0000-0000-0000-000000000001'),
 ('27110000-0000-0000-0000-000000000002'),
 ('27110000-0000-0000-0000-000000000003'),
 ('27110000-0000-0000-0000-000000000004');
insert into public.journey_admins values ('27110000-0000-0000-0000-000000000003');
-- Invoker rights: all RPC calls and table checks below execute as the caller.
create function pg_temp.valid_snapshot() returns jsonb language sql as $$
  select '{"state":"active","current_station":"intro","stations":{"intro":{"visits":1,"active_ms":0,"idle_ms":0,"completed":false,"scroll":0}},"items":{"book":{"station":"intro","count":1,"dwell_ms":0}},"puzzles":{"test":{"station":"intro","attempts":0,"stage":0,"active_ms":0,"idle_ms":0}},"viewport":{"width":390,"height":844},"active_ms":0,"idle_ms":0,"completed":false,"device":"mobile"}'::jsonb
$$;
create function pg_temp.expect_invalid(snapshot jsonb, events jsonb default '[]', session_id uuid default '27110000-0000-0000-0000-000000000011')
returns void language plpgsql as $$
begin
  begin
    perform public.record_journey(session_id, snapshot, events);
  exception when invalid_parameter_value then return;
  end;
  raise exception 'FAIL: invalid payload accepted';
end;
$$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"27110000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":true}',true);
select public.record_journey('27110000-0000-0000-0000-000000000011','{"state":"active","stations":{},"items":{},"puzzles":{},"viewport":{"width":390,"height":844},"active_ms":0,"idle_ms":0,"completed":false,"device":"mobile"}', '[]');
do $$ begin
  if exists(select 1 from public.journey_sessions) then raise exception 'FAIL: visitor can read sessions'; end if;
  if exists(select 1 from public.journey_events) then raise exception 'FAIL: visitor can read events'; end if;
end $$;
-- A valid event batch can be retried without duplicating events.
select public.record_journey('27110000-0000-0000-0000-000000000011', pg_temp.valid_snapshot(),
 '[{"event_id":"27110000-0000-0000-0000-000000000021","event_type":"site_open","station":null,"metadata":{}},{"event_id":"27110000-0000-0000-0000-000000000022","event_type":"button_click","station":"intro","metadata":{"action":"begin","stage":1}}]');
select public.record_journey('27110000-0000-0000-0000-000000000011', pg_temp.valid_snapshot(),
 '[{"event_id":"27110000-0000-0000-0000-000000000021","event_type":"site_open","station":null,"metadata":{}}]');
select pg_temp.expect_invalid(null);
select pg_temp.expect_invalid('[]');
select pg_temp.expect_invalid(pg_temp.valid_snapshot(), '{}');
select pg_temp.expect_invalid(pg_temp.valid_snapshot(), '[]', null);
select pg_temp.expect_invalid(pg_temp.valid_snapshot() || '{"active_ms":-1}');
select pg_temp.expect_invalid(pg_temp.valid_snapshot() || '{"idle_ms":0.5}');
select pg_temp.expect_invalid(pg_temp.valid_snapshot() || '{"current_station":{}}');
select pg_temp.expect_invalid(jsonb_set(pg_temp.valid_snapshot(), '{viewport,width}', '{}'));
select pg_temp.expect_invalid(jsonb_set(pg_temp.valid_snapshot(), '{stations,intro,scroll}', '101'));
select pg_temp.expect_invalid(jsonb_set(pg_temp.valid_snapshot(), '{items,book,count}', '{}'));
select pg_temp.expect_invalid(jsonb_set(pg_temp.valid_snapshot(), '{puzzles,test,attempts}', '-1'));
select pg_temp.expect_invalid(jsonb_set(pg_temp.valid_snapshot(), '{puzzles,test,outcome}', '{}'));
select pg_temp.expect_invalid(pg_temp.valid_snapshot(), '[null]');
select pg_temp.expect_invalid(pg_temp.valid_snapshot(), '[{"event_id":"bad","event_type":"site_open","metadata":{}}]');
select pg_temp.expect_invalid(pg_temp.valid_snapshot(), '[{"event_id":"27110000-0000-0000-0000-000000000023","metadata":{}}]');
select pg_temp.expect_invalid(pg_temp.valid_snapshot(), '[{"event_id":"27110000-0000-0000-0000-000000000023","event_type":"unknown","metadata":{}}]');
select pg_temp.expect_invalid(pg_temp.valid_snapshot(), '[{"event_id":"27110000-0000-0000-0000-000000000023","event_type":"site_open","metadata":{"email":"private"}}]');
select pg_temp.expect_invalid(pg_temp.valid_snapshot(), '[{"event_id":"27110000-0000-0000-0000-000000000023","event_type":"site_open","metadata":{"action":{}}}]');
select pg_temp.expect_invalid(pg_temp.valid_snapshot(), (select jsonb_agg('{}'::jsonb) from generate_series(1,101)));
select pg_temp.expect_invalid(pg_temp.valid_snapshot() || jsonb_build_object('extra', repeat('x',100001)));
-- Reject the entire batch, including a valid first event and session update.
select pg_temp.expect_invalid(pg_temp.valid_snapshot() || '{"state":"disconnected"}',
 '[{"event_id":"27110000-0000-0000-0000-000000000023","event_type":"site_close","metadata":{}},{"event_type":"invalid"}]');
-- Event IDs cannot be stolen by another session, even for the same owner.
select pg_temp.expect_invalid(pg_temp.valid_snapshot(),
 '[{"event_id":"27110000-0000-0000-0000-000000000021","event_type":"site_open","metadata":{}}]',
 '27110000-0000-0000-0000-000000000012');
do $$ begin
  if exists(select 1 from public.journey_events) then raise exception 'FAIL: visitor can read written events'; end if;
  begin
    insert into public.journey_admins values (auth.uid());
    raise exception 'FAIL: visitor added itself as admin';
  exception when insufficient_privilege then null; end;
  begin
    update public.journey_sessions set snapshot = '{}' where session_id = '27110000-0000-0000-0000-000000000011';
    raise exception 'FAIL: visitor directly updated table';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.journey_events;
    raise exception 'FAIL: visitor directly deleted events';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"27110000-0000-0000-0000-000000000002","role":"authenticated","is_anonymous":true}',true);
do $$ begin
  begin
    perform public.record_journey('27110000-0000-0000-0000-000000000011','{"state":"active","stations":{},"items":{},"puzzles":{},"viewport":{"width":390,"height":844},"active_ms":0,"idle_ms":0,"completed":false,"device":"mobile"}', '[]');
    raise exception 'FAIL: another visitor overwrote session';
  exception when insufficient_privilege then null; end;
end $$;
-- A permanent account without allowlist membership has no read or visitor-write access.
select set_config('request.jwt.claims','{"sub":"27110000-0000-0000-0000-000000000004","role":"authenticated","is_anonymous":false}',true);
do $$ begin
  if public.is_journey_admin() or exists(select 1 from public.journey_sessions) or exists(select 1 from public.journey_events) then
    raise exception 'FAIL: non-admin read granted';
  end if;
  begin
    perform public.record_journey('27110000-0000-0000-0000-000000000014', pg_temp.valid_snapshot(), '[]');
    raise exception 'FAIL: permanent account visitor write granted';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"27110000-0000-0000-0000-000000000003","role":"authenticated","is_anonymous":false}',true);
do $$ begin
  if not public.is_journey_admin() then raise exception 'FAIL: allowlisted admin denied'; end if;
  if not exists(select 1 from public.journey_sessions where session_id='27110000-0000-0000-0000-000000000011') then raise exception 'FAIL: admin cannot read journey'; end if;
  if (select count(*) from public.journey_events where session_id = '27110000-0000-0000-0000-000000000011') <> 2 then
    raise exception 'FAIL: event retry or invalid batch was not atomic';
  end if;
  if exists(select 1 from public.journey_sessions where session_id = '27110000-0000-0000-0000-000000000012') then
    raise exception 'FAIL: conflicting event left a session behind';
  end if;
  if not exists(select 1 from public.journey_sessions where session_id = '27110000-0000-0000-0000-000000000011' and ended_at is null and snapshot->>'state' = 'active') then
    raise exception 'FAIL: invalid batch changed session state';
  end if;
end $$;
-- An ordinary disconnect followed by a return clears ended_at, preserving identity.
select set_config('request.jwt.claims','{"sub":"27110000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":true}',true);
select public.record_journey('27110000-0000-0000-0000-000000000011', pg_temp.valid_snapshot() || '{"state":"disconnected"}', '[]');
reset role;
do $$ begin
  if not exists(select 1 from public.journey_sessions where session_id = '27110000-0000-0000-0000-000000000011' and ended_at is not null) then raise exception 'FAIL: disconnect not recorded'; end if;
end $$;
set local role authenticated;
select public.record_journey('27110000-0000-0000-0000-000000000011', pg_temp.valid_snapshot(), '[]');
reset role;
do $$ begin
  if not exists(select 1 from public.journey_sessions where session_id = '27110000-0000-0000-0000-000000000011' and ended_at is null and owner_id = '27110000-0000-0000-0000-000000000001') then raise exception 'FAIL: session did not resume'; end if;
end $$;
set local role anon;
select set_config('request.jwt.claims', '{}', true);
do $$ begin
  begin
    perform 1 from public.journey_sessions;
    raise exception 'FAIL: signed-out read granted';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.journey_events;
    raise exception 'FAIL: signed-out event read granted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.record_journey('27110000-0000-0000-0000-000000000014', pg_temp.valid_snapshot(), '[]');
    raise exception 'FAIL: signed-out RPC granted';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
