// usage: node scripts/sheet.mjs <outDir> <from> <to> <every> [scale]  -> jpeg frames rendered in ONE page (world built once)
import fs from "node:fs"; import path from "node:path";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = process.env.REMOTION_TMP; }
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition, openBrowser } from "@remotion/renderer";
const [outDir, a, b, every = "1", scale = "0.5"] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: "swangle" };
const inputProps = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
const composition = await selectComposition({ serveUrl, id: "BeerShort", inputProps, puppeteerInstance: browser });
const t0 = Date.now();
await renderFrames({ composition, serveUrl, inputProps, puppeteerInstance: browser, concurrency: Number(process.env.CONC || 1), frameRange: [Number(a), Number(b)],
  everyNthFrame: Number(every), imageFormat: "jpeg", jpegQuality: 85, outputDir: outDir, scale: Number(scale), timeoutInMilliseconds: 600000,
  onBrowserLog: (l) => { if (l.type === "error" && !/404|Failed to load/.test(l.text)) console.log("[browser]", l.text.slice(0, 400)); },
  onFrameUpdate: (n) => { if (n % 10 === 0) console.log("frames", n, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } });
console.log("done", ((Date.now() - t0) / 1000).toFixed(0) + "s");
await browser.close({ silent: true });
