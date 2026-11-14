// usage: node scripts/prof.mjs <from> <to> '<json list of inputProps variants>'  -> per-variant ms/frame (after the first frame)
import fs from "node:fs"; import path from "node:path";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = process.env.REMOTION_TMP; }
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition, openBrowser } from "@remotion/renderer";
const [a, b, variants = "[{}]"] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: process.env.GL || "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
for (const inputProps of JSON.parse(variants)) {
  const composition = await selectComposition({ serveUrl, id: "PisaShort", inputProps, puppeteerInstance: browser });
  const times = []; let t0 = Date.now();
  await renderFrames({ composition, serveUrl, inputProps, puppeteerInstance: browser, concurrency: Number(process.env.CONC || 1), frameRange: [Number(a), Number(b)],
    imageFormat: "jpeg", outputDir: "out/test/prof", onStart: () => { t0 = Date.now(); }, onFrameUpdate: (n) => { times.push(Date.now()); },
    timeoutInMilliseconds: 300000, scale: Number(process.env.SCALE || 1) });
  const d = times.slice(1).map((t, i) => t - times[i]);
  console.log(JSON.stringify(inputProps), "first", times[0] - t0, "ms; then", d.length ? Math.round(d.reduce((x, y) => x + y, 0) / d.length) : "-", "ms/frame", d.join(","));
}
await browser.close({ silent: true });
