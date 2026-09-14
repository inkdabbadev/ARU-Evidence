import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('migrations and access checks execute in PostgreSQL', async () => {
  const db = new PGlite();
  try {
    // Minimal Supabase Auth contract. HTTP Auth and Realtime require a live project.
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.jwt() returns jsonb language sql stable as $$
        select nullif(current_setting('request.jwt.claims', true), '')::jsonb
      $$;
      create function auth.uid() returns uuid language sql stable as $$
        select (auth.jwt()->>'sub')::uuid
      $$;
      grant usage on schema auth, public to anon, authenticated;
      create publication supabase_realtime;
    `);
    const directory = new URL('../supabase/migrations/', import.meta.url);
    const files = (await fs.readdir(directory)).filter(name => name.endsWith('.sql')).sort();
    for (const name of files) await db.exec(await fs.readFile(new URL(name, directory), 'utf8'));
    await db.exec(await fs.readFile(new URL('../supabase/tests/journey_access.sql', import.meta.url), 'utf8'));
    assert.equal((await db.query('select count(*)::int as count from public.journey_sessions')).rows[0].count, 0);
    assert.deepEqual((await db.query("select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by tablename")).rows.map(row => row.tablename), ['journey_events', 'journey_sessions']);
  } finally {
    await db.close();
  }
});
