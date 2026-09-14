# Case #2711 - The Case of the Missing Conversations

A personalized React + TypeScript experience with six evidence exhibits, an illustrated bookshelf, a star scene, a final jigsaw, an envelope letter, and a global vinyl player.

## Run locally

Use Node.js 24, then run `npm ci` and `npm run dev`.

## Deploy

See **DEPLOY_VERCEL.md**. Vercel configuration and the dependency lockfile are included. Build with `npm run build`; preview over HTTP with `npm run preview`.

## Progress and admin

Each exhibit awards its own evidence piece once. Unfinished progress persists in the current browser. Reopening or refreshing a completed visit starts a new case and clears the saved jigsaw. The visitor menu offers Start over, which also resets the music player.

The playlist starts with Baby Shark and attempts playback 20 seconds after the experience opens. If the browser blocks automatic audio, use the player's Play button. Manual playback controls override the scheduled start.

Open `/admin` directly. A clearly labeled fictional dashboard preview is available before configuration. Real private analytics require the Supabase setup in **ANALYTICS_SETUP.md**.

## Main files

- `src/rooms/`: exhibit interactions and final scenes
- `src/data/`: personalized copy and playlist
- `src/state/evidence.ts`: the six evidence IDs
- `src/analytics/config.ts`: admin metro stations
- `public/`: supplied artwork, music and other static assets
- `supabase/`: database migration and access checks

Run `npm run test:evidence`, `npm run test:analytics`, `npm run test:supabase`, and `npm run lint` for checks. Run `npm run check:supabase` to check the configured live project's public endpoints and anonymous sign-in setting.
