# StudyHive Web

React 19/Vite client for StudyHive, intended for Vercel deployment.

## Local verification

```bash
npm ci
npm run lint
npm run build
npm run dev
```

## Environment

- `VITE_BACKEND_URL`: Render API origin, without `/api`.
- `VITE_SUPABASE_URL`: the same Supabase project used by the backend.
- `VITE_SUPABASE_ANON_KEY`: that project's public anon key; never use the service-role key here.
- `VITE_STREAM_API_KEY`: public Stream API key.

The frontend uses Supabase directly for Auth and backend-authorized signed Storage uploads. Application CRUD and signed-URL issuance go through the Render API with the active Supabase bearer token.

## Vercel

`vercel.json` builds to `dist`, rewrites SPA routes to `index.html`, applies baseline browser headers, and caches fingerprinted assets. Add the final Vercel origin to backend `CLIENT_URL`; use the wildcard preview allowlist only when previews require it.
