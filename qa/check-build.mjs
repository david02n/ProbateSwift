// Build a production bundle locally, serve it, and assert the app actually
// mounts (catches blank-screen / bundling regressions before they ship).
//
// Usage: npm run qa:build
import { chromium } from "playwright";
import { serveSpa, renderPage } from "./lib.mjs";

const DIST = "dist/public";

const { url, close } = await serveSpa(DIST);
console.log("Serving", DIST, "at", url);

const { browser, status, title, rootHtml, errors, failed } = await renderPage(
  chromium,
  url
);

console.log("HTTP", status);
console.log("title:", title);
console.log("#root innerHTML length:", rootHtml.length);
console.log("page/console errors:", errors.length ? errors.slice(0, 8) : "none");
console.log("failed requests:", failed.length ? failed.slice(0, 8) : "none");

await browser.close();
await close();

// A fatal failure is the app never mounting (blank #root) or a React-runtime
// crash that unmounts the tree. App-level runtime errors that still leave a
// rendered tree (e.g. a bad/placeholder API key in a local build) are surfaced
// as warnings, not hard failures.
const mounted = rootHtml.length > 0;
const fatalError = errors.find((e) =>
  /useState|useRef|useEffect|Minified React error|Cannot read properties of undefined \(reading 'use/i.test(
    e
  )
);

if (!mounted || fatalError) {
  console.error(
    "\n❌ QA FAIL: app did not mount (blank screen / React crash)." +
      (fatalError ? `\n   fatal: ${fatalError}` : "")
  );
  process.exit(1);
}
if (errors.length) {
  console.warn(
    "\n⚠️  QA PASS with warnings: app mounted, but runtime errors were logged " +
      "(often expected for local builds without real API keys)."
  );
} else {
  console.log("\n✅ QA PASS: app mounted and rendered cleanly.");
}
