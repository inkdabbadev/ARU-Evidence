import { loadEnv } from 'vite';

// Read-only readiness checks; never print keys or create visitor accounts.
const env = { ...loadEnv('development', process.cwd(), 'VITE_'), ...process.env };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.');
  process.exitCode = 1;
} else {
  const request = async (path, options = {}) => {
    const response = await fetch(new URL(path, url), {
      ...options, headers: { apikey: key, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    return { status: response.status, body: await response.json() };
  };
  const check = (ok, message) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}: ${message}`);
    if (!ok) process.exitCode = 1;
  };
  try {
    const settings = await request('/auth/v1/settings');
    check(settings.status === 200, 'Project Auth endpoint accepts the configured public key');
    check(settings.body.external?.anonymous_users === true, 'Anonymous Sign-Ins enabled (required for visitor tracking)');
    for (const table of ['journey_sessions', 'journey_events']) {
      const result = await request(`/rest/v1/${table}?select=*&limit=0`);
      check([401, 403].includes(result.status) && result.body.code === '42501', `${table} exists and denies signed-out reads`);
    }
    const rpc = await request('/rest/v1/rpc/record_journey', {
      method: 'POST', body: JSON.stringify({ p_session_id: null, p_snapshot: {}, p_events: [] }),
    });
    check([401, 403].includes(rpc.status) && rpc.body.code === '42501', 'record_journey exists and rejects signed-out calls');
    console.log('Admin sign-in, applied migration version, and Realtime delivery still need dashboard verification.');
  } catch (error) {
    console.error(`Supabase check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
