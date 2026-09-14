-- Run after the migration in a development project SQL editor. Rolls back all fixtures.
begin;
insert into auth.users(id) values
 ('27110000-0000-0000-0000-000000000001'),
 ('27110000-0000-0000-0000-000000000002'),
 ('27110000-0000-0000-0000-000000000003');
insert into public.journey_admins values ('27110000-0000-0000-0000-000000000003');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"27110000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":true}',true);
select public.record_journey('27110000-0000-0000-0000-000000000011','{"state":"active","stations":{},"items":{},"puzzles":{},"viewport":{"width":390,"height":844},"active_ms":0,"idle_ms":0,"completed":false,"device":"mobile"}', '[]');
do $$ begin
  if exists(select 1 from public.journey_sessions) then raise exception 'FAIL: visitor can read sessions'; end if;
  if exists(select 1 from public.journey_events) then raise exception 'FAIL: visitor can read events'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"27110000-0000-0000-0000-000000000002","role":"authenticated","is_anonymous":true}',true);
do $$ begin
  begin
    perform public.record_journey('27110000-0000-0000-0000-000000000011','{"state":"active","stations":{},"items":{},"puzzles":{},"viewport":{"width":390,"height":844},"active_ms":0,"idle_ms":0,"completed":false,"device":"mobile"}', '[]');
    raise exception 'FAIL: another visitor overwrote session';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"27110000-0000-0000-0000-000000000003","role":"authenticated","is_anonymous":false}',true);
do $$ begin
  if not public.is_journey_admin() then raise exception 'FAIL: allowlisted admin denied'; end if;
  if not exists(select 1 from public.journey_sessions where session_id='27110000-0000-0000-0000-000000000011') then raise exception 'FAIL: admin cannot read journey'; end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform 1 from public.journey_sessions;
    raise exception 'FAIL: signed-out read granted';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
