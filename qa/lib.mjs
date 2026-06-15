// Shared helpers for ProbateSwift QA scripts.
import http from "http";
import { readFile } from "fs/promises";
import path from "path";

const MIME = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// Serve a built SPA directory with index.html fallback. Returns { url, close }.
export async function serveSpa(root) {
  const ROOT = path.resolve(root);
  const server = http.createServer(async (req, res) => {
    try {
      const rel = decodeURIComponent(req.url.split("?")[0]);
      let fp = path.join(ROOT, rel);
      let data;
      try {
        data = await readFile(fp);
      } catch {
        fp = path.join(ROOT, "index.html"); // SPA fallback
        data = await readFile(fp);
      }
      res.setHeader("content-type", MIME[path.extname(fp)] || "application/octet-stream");
      res.end(data);
    } catch (e) {
      res.statusCode = 500;
      res.end(String(e));
    }
  });
  await new Promise((r) => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/`;
  return { url, close: () => new Promise((r) => server.close(r)) };
}

// Render a URL in headless Chromium and collect health signals.
export async function renderPage(chromium, url, { wait = 3000 } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true, // container lacks the upstream proxy CA chain
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text());
  });
  page.on("requestfailed", (r) =>
    failed.push(`${r.url()} -> ${r.failure()?.errorText}`)
  );
  const resp = await page.goto(url, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(wait);
  const rootHtml = await page.locator("#root").innerHTML().catch(() => "");
  const title = await page.title();
  return { browser, page, status: resp?.status(), title, rootHtml, errors, failed };
}
