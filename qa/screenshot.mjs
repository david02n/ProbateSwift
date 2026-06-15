// Render any URL (local or remote) in a real headless browser, report health
// signals, and save a full-page screenshot.
//
// Usage:
//   npm run qa:shot -- <url> [outfile.png]
//
// Note: to QA production, prefer the Railway origin
//   https://probateswift-production.up.railway.app/
// which bypasses the Cloudflare bot protection that blocks automated fetches
// of www.probateswift.com.
import { chromium } from "playwright";
import { renderPage } from "./lib.mjs";

const url = process.argv[2] || "https://probateswift-production.up.railway.app/";
const out = process.argv[3] || "qa-screenshot.png";

const { browser, page, status, title, rootHtml, errors, failed } =
  await renderPage(chromium, url);

await page.screenshot({ path: out, fullPage: true });

console.log("URL:", url);
console.log("HTTP", status);
console.log("title:", title);
console.log("#root innerHTML length:", rootHtml.length);
console.log("page/console errors:", errors.length ? errors.slice(0, 8) : "none");
console.log("failed requests:", failed.length ? failed.slice(0, 8) : "none");
console.log("screenshot ->", out);

await browser.close();
