-- Run once in the Supabase SQL editor or with `supabase db push`.
create table public.journey_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.journey_admins enable row level security;
revoke all on public.journey_admins from anon, authenticated;

create function public.is_journey_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.journey_admins where user_id = auth.uid())
$$;
revoke all on function public.is_journey_admin() from public;
grant execute on function public.is_journey_admin() to authenticated;

create table public.journey_sessions (
  session_id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  snapshot jsonb not null default '{}'
);
create index journey_sessions_recent on public.journey_sessions(last_seen_at desc);
create table public.journey_events (
  event_id uuid primary key,
  session_id uuid not null references public.journey_sessions(session_id) on delete cascade,
  event_type text not null,
  station text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index journey_events_recent on public.journey_events(session_id, created_at desc);
alter table public.journey_sessions enable row level security;
alter table public.journey_events enable row level security;
revoke all on public.journey_sessions, public.journey_events from anon, authenticated;
grant select on public.journey_sessions, public.journey_events to authenticated;
create policy "Only allowlisted admins read sessions" on public.journey_sessions for select to authenticated using (public.is_journey_admin());
create policy "Only allowlisted admins read events" on public.journey_events for select to authenticated using (public.is_journey_admin());

-- No direct visitor table writes, and no visitor read access, including their own row.
-- Ownership is bound to an anonymous Auth JWT, not a caller-supplied owner ID.
create function public.record_journey(p_session_id uuid, p_snapshot jsonb, p_events jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  existing_owner uuid;
  entry jsonb;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false then
    raise exception 'Anonymous visitor authentication required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_snapshot) is distinct from 'object' or octet_length(p_snapshot::text) > 100000
     or jsonb_typeof(p_events) is distinct from 'array' or jsonb_array_length(p_events) > 100
     or octet_length(p_events::text) > 50000
     or coalesce(p_snapshot->>'state','') not in ('active','idle','disconnected') then
    raise exception 'Invalid journey payload';
  end if;
  if jsonb_typeof(p_snapshot->'stations') is distinct from 'object'
     or jsonb_typeof(p_snapshot->'items') is distinct from 'object'
     or jsonb_typeof(p_snapshot->'puzzles') is distinct from 'object'
     or jsonb_typeof(p_snapshot->'viewport') is distinct from 'object'
     or jsonb_typeof(p_snapshot->'active_ms') is distinct from 'number'
     or jsonb_typeof(p_snapshot->'idle_ms') is distinct from 'number'
     or jsonb_typeof(p_snapshot->'completed') is distinct from 'boolean'
     or jsonb_typeof(p_snapshot->'device') is distinct from 'string' then
    raise exception 'Invalid snapshot structure';
  end if;
  for entry in select value from jsonb_each(p_snapshot->'stations') loop
    if jsonb_typeof(entry) is distinct from 'object'
       or jsonb_typeof(entry->'visits') is distinct from 'number'
       or jsonb_typeof(entry->'active_ms') is distinct from 'number'
       or jsonb_typeof(entry->'idle_ms') is distinct from 'number'
       or jsonb_typeof(entry->'completed') is distinct from 'boolean' then
      raise exception 'Invalid station structure';
    end if;
  end loop;
  for entry in select value from jsonb_each(p_snapshot->'items') union all select value from jsonb_each(p_snapshot->'puzzles') loop
    if jsonb_typeof(entry) is distinct from 'object' then raise exception 'Invalid interaction structure'; end if;
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
    if entry->>'event_type' not in ('site_open','site_close','station_enter','station_exit','book_open','book_close','item_open','item_close','button_click','puzzle_start','puzzle_attempt','puzzle_complete','idle_start','idle_end','visibility_hidden','visibility_visible','heartbeat','experience_complete')
       or jsonb_typeof(entry->'metadata') is distinct from 'object' or octet_length((entry->'metadata')::text) > 1500
       or length(coalesce(entry->>'station','')) > 100 then
      raise exception 'Invalid event';
    end if;
    insert into public.journey_events(event_id, session_id, event_type, station, metadata)
      values((entry->>'event_id')::uuid, p_session_id, entry->>'event_type', entry->>'station', entry->'metadata')
      on conflict(event_id) do nothing;
  end loop;
end;
$$;
revoke all on function public.record_journey(uuid,jsonb,jsonb) from public;
grant execute on function public.record_journey(uuid,jsonb,jsonb) to authenticated;

alter publication supabase_realtime add table public.journey_sessions, public.journey_events;
