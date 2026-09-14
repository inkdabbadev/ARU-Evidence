-- Apply after 202609140001_journey.sql, including on already configured projects.
-- Replace the RPC without dropping tables or changing existing session ownership.
create index if not exists journey_sessions_owner on public.journey_sessions(owner_id);

create or replace function public.record_journey(p_session_id uuid, p_snapshot jsonb, p_events jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  existing_owner uuid;
  entry jsonb;
  field record;
  event_uuid uuid;
begin
  if actor is null or (auth.jwt()->'is_anonymous') is distinct from 'true'::jsonb then
    raise exception 'Anonymous visitor authentication required' using errcode = '42501';
  end if;
  -- Check container types before calling functions that require those types.
  if p_session_id is null
     or jsonb_typeof(p_snapshot) is distinct from 'object'
     or jsonb_typeof(p_events) is distinct from 'array' then
    raise exception 'Invalid journey payload' using errcode = '22023';
  end if;
  if octet_length(p_snapshot::text) > 100000
     or jsonb_array_length(p_events) > 100 or octet_length(p_events::text) > 50000
     or coalesce(p_snapshot->>'state', '') not in ('active', 'idle', 'disconnected') then
    raise exception 'Invalid journey payload' using errcode = '22023';
  end if;
  if jsonb_typeof(p_snapshot->'stations') is distinct from 'object'
     or jsonb_typeof(p_snapshot->'items') is distinct from 'object'
     or jsonb_typeof(p_snapshot->'puzzles') is distinct from 'object'
     or jsonb_typeof(p_snapshot->'viewport') is distinct from 'object'
     or jsonb_typeof(p_snapshot->'active_ms') is distinct from 'number'
     or jsonb_typeof(p_snapshot->'idle_ms') is distinct from 'number'
     or jsonb_typeof(p_snapshot->'completed') is distinct from 'boolean'
     or coalesce(p_snapshot->>'device', '') not in ('mobile', 'tablet', 'desktop') then
    raise exception 'Invalid snapshot structure' using errcode = '22023';
  end if;
  for field in select key, value from jsonb_each(p_snapshot)
    where key in ('current_station', 'previous_station', 'last_interaction', 'last_action') loop
    if jsonb_typeof(field.value) not in ('string', 'null') then
      raise exception 'Invalid snapshot text' using errcode = '22023';
    end if;
  end loop;
  for entry in select value from jsonb_each(p_snapshot->'stations') loop
    if jsonb_typeof(entry) is distinct from 'object'
       or jsonb_typeof(entry->'visits') is distinct from 'number'
       or jsonb_typeof(entry->'active_ms') is distinct from 'number'
       or jsonb_typeof(entry->'idle_ms') is distinct from 'number'
       or jsonb_typeof(entry->'scroll') is distinct from 'number'
       or jsonb_typeof(entry->'completed') is distinct from 'boolean' then
      raise exception 'Invalid station structure' using errcode = '22023';
    end if;
    if (entry->>'scroll')::numeric > 100 then
      raise exception 'Invalid scroll percentage' using errcode = '22023';
    end if;
  end loop;
  for entry in select value from jsonb_each(p_snapshot->'items') loop
    if jsonb_typeof(entry) is distinct from 'object'
       or jsonb_typeof(entry->'station') is distinct from 'string'
       or jsonb_typeof(entry->'count') is distinct from 'number'
       or jsonb_typeof(entry->'dwell_ms') is distinct from 'number' then
      raise exception 'Invalid item structure' using errcode = '22023';
    end if;
  end loop;
  for entry in select value from jsonb_each(p_snapshot->'puzzles') loop
    if jsonb_typeof(entry) is distinct from 'object'
       or jsonb_typeof(entry->'station') is distinct from 'string'
       or jsonb_typeof(entry->'attempts') is distinct from 'number'
       or jsonb_typeof(entry->'stage') is distinct from 'number'
       or jsonb_typeof(entry->'active_ms') is distinct from 'number'
       or jsonb_typeof(entry->'idle_ms') is distinct from 'number'
       or (entry ? 'outcome' and jsonb_typeof(entry->'outcome') is distinct from 'string') then
      raise exception 'Invalid puzzle structure' using errcode = '22023';
    end if;
  end loop;
  if jsonb_typeof(p_snapshot->'viewport'->'width') is distinct from 'number'
     or jsonb_typeof(p_snapshot->'viewport'->'height') is distinct from 'number' then
    raise exception 'Invalid viewport' using errcode = '22023';
  end if;
  -- Every counter consumed by the dashboard must be a nonnegative safe integer.
  for entry in select p_snapshot union all select p_snapshot->'viewport'
    union all select value from jsonb_each(p_snapshot->'stations')
    union all select value from jsonb_each(p_snapshot->'items')
    union all select value from jsonb_each(p_snapshot->'puzzles') loop
    for field in select key, value from jsonb_each(entry)
      where key in ('active_ms', 'idle_ms', 'visits', 'scroll', 'count', 'dwell_ms', 'attempts', 'stage', 'width', 'height') loop
      if jsonb_typeof(field.value) is distinct from 'number' then
        raise exception 'Invalid numeric counter' using errcode = '22023';
      end if;
      if field.value::text::numeric < 0 or field.value::text::numeric > 9007199254740991
         or trunc(field.value::text::numeric) <> field.value::text::numeric then
        raise exception 'Invalid numeric counter' using errcode = '22023';
      end if;
    end loop;
  end loop;

  -- Serialize same-session writes, including concurrent first inserts.
  perform pg_advisory_xact_lock(hashtextextended(p_session_id::text, 0));
  select owner_id into existing_owner from public.journey_sessions where session_id = p_session_id;
  if existing_owner is not null and existing_owner <> actor then
    raise exception 'Session ownership mismatch' using errcode = '42501';
  end if;
  insert into public.journey_sessions(session_id, owner_id, snapshot, ended_at)
    values(p_session_id, actor, p_snapshot, case when p_snapshot->>'state' = 'disconnected' then now() else null end)
  on conflict(session_id) do update set snapshot = excluded.snapshot, last_seen_at = now(), ended_at = excluded.ended_at;

  for entry in select value from jsonb_array_elements(p_events) loop
    if jsonb_typeof(entry) is distinct from 'object'
       or jsonb_typeof(entry->'event_id') is distinct from 'string'
       or coalesce(entry->>'event_type', '') not in ('site_open','site_close','station_enter','station_exit','book_open','book_close','item_open','item_close','button_click','puzzle_start','puzzle_attempt','puzzle_complete','idle_start','idle_end','visibility_hidden','visibility_visible','heartbeat','experience_complete')
       or jsonb_typeof(entry->'metadata') is distinct from 'object'
       or octet_length((entry->'metadata')::text) > 1500
       or (entry ? 'station' and jsonb_typeof(entry->'station') not in ('string', 'null'))
       or length(coalesce(entry->>'station', '')) > 100 then
      raise exception 'Invalid event' using errcode = '22023';
    end if;
    for field in select key, value from jsonb_each(entry->'metadata') loop
      if field.key not in ('book', 'item', 'puzzle', 'action', 'outcome', 'stage')
         or jsonb_typeof(field.value) not in ('string', 'number')
         or length(field.value #>> '{}') > 100 then
        raise exception 'Invalid event metadata' using errcode = '22023';
      end if;
    end loop;
    begin
      event_uuid := (entry->>'event_id')::uuid;
    exception when invalid_text_representation then
      raise exception 'Invalid event UUID' using errcode = '22023';
    end;
    insert into public.journey_events(event_id, session_id, event_type, station, metadata)
      values(event_uuid, p_session_id, entry->>'event_type', entry->>'station', entry->'metadata')
      on conflict(event_id) do nothing;
    -- Retries in the same session are idempotent; another session's ID is not a retry.
    if not exists(select 1 from public.journey_events where event_id = event_uuid and session_id = p_session_id) then
      raise exception 'Event belongs to another session' using errcode = '22023';
    end if;
  end loop;
end;
$$;
revoke all on function public.record_journey(uuid,jsonb,jsonb) from public, anon;
grant execute on function public.record_journey(uuid,jsonb,jsonb) to authenticated;

-- Evaluate the allowlist once per query instead of once per row.
alter policy "Only allowlisted admins read sessions" on public.journey_sessions
  using ((select public.is_journey_admin()));
alter policy "Only allowlisted admins read events" on public.journey_events
  using ((select public.is_journey_admin()));

-- Repair missing Realtime membership without failing when it is already enabled.
do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'journey_sessions') then
    alter publication supabase_realtime add table public.journey_sessions;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'journey_events') then
    alter publication supabase_realtime add table public.journey_events;
  end if;
end;
$$;
