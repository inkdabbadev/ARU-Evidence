# Deploy Case #2711

This is the final source package. Test navigation and its extra page padding have been removed. The visitor menu still supports starting over. Admin is available directly at `/admin`.

## Deploy from GitHub

1. Extract the source ZIP. Push its contents to a GitHub repository, keeping `package.json`, `vercel.json`, `src`, and `public` at the repository root.
2. In Vercel, choose **Add New > Project** and import that repository.
3. Use these settings (already specified in the project):
   - Framework: **Vite**
   - Root directory: the folder containing `package.json`
   - Node.js: **24.x**
   - Install: `npm ci`
   - Build: `npm run build`
   - Output: `dist`
4. Deploy. Open the resulting HTTPS URL and test Begin Investigation, the music controls, and `/admin`.

The site can deploy now without environment variables. Without Supabase, `/admin` offers only the clearly labeled fictional preview; there is no live visitor tracking.

## Connect live admin later

Follow `ANALYTICS_SETUP.md` to apply the database migration, enable anonymous visitor sign-in, create your admin account, and allowlist it. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Vercel project's Environment Variables, then redeploy. Never put a secret/service-role key into a frontend environment variable.

## Verify locally

```sh
npm ci
npm run test:evidence
npm run test:analytics
npm run build
npm run preview
```

Use the printed HTTP URL. Do not open `dist/index.html` as a file. The source ZIP includes all artwork and local music, plus the lockfile. It excludes dependencies, browser test artifacts, environment secrets, and generated builds.

Vercel references: [Vite deployment](https://vercel.com/docs/frameworks/frontend/vite), [project configuration](https://vercel.com/docs/project-configuration/vercel-json).
