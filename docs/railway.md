# Railway Deployment Notes

This repository is set up to run on Railway with Railpack using the commands in `railway.json`.

## Service Setup

1. Create a Railway project and connect this GitHub repository.
2. Deploy the web service from the repo root.
3. Set the required variables from `.env.example`.
4. Set the healthcheck path to `/api/health` if Railway does not pick it up from `railway.json`.

## Database

You have two valid options:

1. Keep your existing Neon database and set `DATABASE_URL` manually.
2. Add a Railway Postgres service and use the injected `DATABASE_URL`.

This app uses the Postgres `sessions` table for session storage when `DATABASE_URL` is present.

## Sessions

Production sessions now use `connect-pg-simple` when a database connection is available.

If `DATABASE_URL` is missing, the app falls back to the default memory session store, which is suitable only for development or temporary smoke tests.

## Upload Persistence

The app writes uploaded files to `UPLOAD_DIR`, which defaults to `uploads`.

For Railway, mount a volume at:

`/app/uploads`

Then set:

`UPLOAD_DIR=/app/uploads`

Without a volume, uploaded files will be lost on redeploy or restart.

## Recommended Railway Dashboard Steps

1. Add a public Railway domain.
2. If you use a custom domain, attach it after the first successful deploy.
3. Update `ALLOWED_ORIGINS` to include the Railway domain and final custom domain.
4. Update Stytch redirect URLs to the Railway or custom domain.
5. If you use Railway Postgres, run `npm run db:push` once with `DATABASE_URL` configured.

## Notes

- Railway injects a `PORT` variable. The app already listens on `process.env.PORT`.
- The healthcheck endpoint is available at `/api/health`.
- Replit-specific dev plugins in `vite.config.ts` are gated to Replit development mode and do not block Railway production deploys.
