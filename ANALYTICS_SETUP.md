# Private journey dashboard

The site remains usable with no Supabase configuration. `/admin` displays setup status until connected. No visitor network tracking or anonymous signup occurs without both environment variables.

## Connect later

1. Create a Supabase project. Run `supabase/migrations/202609140001_journey.sql` in its SQL editor (once), or apply it through the Supabase CLI migrations workflow.
2. Under Authentication, enable **anonymous sign-ins** for visitors. Create your admin user using the Supabase dashboard with an email and strong password. Disable public email sign-ups if you do not need them.
3. Copy that admin user's UUID from Authentication > Users. Run `insert into public.journey_admins(user_id) values ('ADMIN-USER-UUID');` in the SQL editor. No browser account can add itself to this allowlist.
4. Copy `.env.example` to `.env.local`, fill the project URL and **publishable** key, and restart Vite. Add those same two environment variables to Vercel and redeploy for production. Never use a service-role or secret key in a `VITE_` variable.
5. Open `/admin` and sign in. Open the microsite in a separate browser/private window and navigate, open a book, and attempt a puzzle. Confirm the route/feed update. Leave the visitor untouched for 60 seconds (Idle); close it and wait up to 90 seconds (Disconnected). After 30 minutes without a report, its unfinished current station becomes Abandoned.

## Access and data

Supabase Auth authenticates the admin; database row-level security checks the private admin allowlist on every read, including Realtime. The login shell and compiled code are public static files, but journey data is never embedded in them. Non-admin accounts cannot read sessions/events. Visitor and admin Auth sessions use separate storage keys. The visitor RPC requires an anonymous JWT and binds each session to that anonymous user; it cannot overwrite another visitor's session.

Sessions/events use server timestamps. First/last book open and puzzle timestamps in snapshots are approximate client times. Dwell is measured locally and split at the 60-second inactivity threshold; background/blur time is idle. Closed-browser time is excluded. Heartbeats every 30 seconds and important events batched for 600ms publish snapshots. A dashboard received-time label makes stale data explicit; displayed time is reported time, not invented live engagement. Browser close reporting is best effort; heartbeat expiry is authoritative for offline status. Temporary idle/disconnection does not immediately imply abandonment. A return within 30 minutes reuses the local session; later returns create a new one. Multiple tabs use a short localStorage reporting lease to avoid ordinary double counting. Browsers without localStorage cannot persist visits reliably.

Only configured IDs, outcome/stage numbers, aggregate scroll depth and viewport category are recorded. No form contents, pressed keys, pointer coordinates, emails, IP addresses or user-agent strings are added to analytics tables. Supabase infrastructure may maintain its own standard service logs. Local offline events are bounded to 300; extended outages can lose older events. Database history remains until you delete it. Anonymous Auth users are retained so refreshes can resume ownership; plan periodic deletion/retention according to your needs (deleting an anonymous user cascades their journey records).

Stations live in `src/analytics/config.ts`. Instrument with `trackEvent` from `src/analytics/tracker.ts`; metadata is allowlisted. Use explicit `data-analytics-action` IDs on important buttons. Do not pass free-form visitor text.

## Verification before production

Run `npm run build`, `npm run lint`, and `npm run test:analytics`. Run `supabase/tests/journey_access.sql` in a development project SQL editor after applying the migration; it verifies visitor isolation, ownership and admin reads with rolled-back fixtures. With your connected project, check: signed-out and non-allowlisted users cannot read either table; an anonymous user's RPC cannot update a different owner's UUID; allowlisted admins can see Realtime; refresh preserves the visit; completion and book/puzzle events match the actual UI. Local tests cannot prove a migration has been applied to your remote project.

References: [Anonymous Auth](https://supabase.com/docs/guides/auth/auth-anonymous), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
