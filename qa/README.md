# QA tooling

Headless-browser checks for ProbateSwift. The app is a client-rendered React
SPA, so `curl`/HTTP fetches only ever see an empty `<div id="root">` shell —
you need a real browser that executes JavaScript to verify what users see.
These scripts use Playwright (Chromium) for that.

## Setup

```bash
npm install
npx playwright install chromium   # one-time: download the browser binary
```

## Commands

### `npm run qa:build` — catch blank-screen / bundling regressions

Builds the production bundle, serves `dist/public` locally, renders it in
Chromium, and **fails (exit 1) if the app does not mount** (empty `#root` or a
React-runtime crash). This guards against the class of bug where a bad
`manualChunks` split leaves `React` undefined and the whole site renders blank.

> Runtime errors that still leave a rendered tree (e.g. a placeholder Clerk key
> in a local build) are reported as warnings, not failures.

### `npm run qa:shot -- <url> [outfile.png]` — screenshot any environment

Renders a URL, prints health signals (HTTP status, `#root` size, console/page
errors, failed requests), and saves a full-page screenshot.

```bash
# Production — use the Railway origin (see note below)
npm run qa:shot -- https://probateswift-production.up.railway.app/ home.png
```

## Note: reaching production

`www.probateswift.com` is fronted by Cloudflare bot protection, which blocks
automated/headless requests. The **Railway origin** serves the identical build
without that protection, so use it for automated QA:

```
https://probateswift-production.up.railway.app/
```
