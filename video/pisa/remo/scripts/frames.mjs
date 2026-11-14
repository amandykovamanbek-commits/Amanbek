// usage: node scripts/frames.mjs <outDir> <f1,f2,...> [scale]  -> one jpeg per listed frame (one browser, a page per frame)
import fs from "node:fs"; import path from "node:path";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = process.env.REMOTION_TMP; }
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition, openBrowser } from "@remotion/renderer";
const [outDir, list, scale = "0.5"] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const inputProps = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions: { gl: "swangle" } });
const composition = await selectComposition({ serveUrl, id: "PisaShort", inputProps, puppeteerInstance: browser });
for (const f of list.split(",").map(Number)) {
  const t0 = Date.now(), tmp = path.join(outDir, "_tmp");
  await renderFrames({ composition, serveUrl, inputProps, puppeteerInstance: browser, concurrency: 1, frameRange: [f, f], imageFormat: "jpeg", jpegQuality: 88,
    outputDir: tmp, scale: Number(scale), timeoutInMilliseconds: 600000,
    onBrowserLog: (l) => { if (l.type === "error" && !/404|Failed to load/.test(l.text)) console.log("[browser]", l.text.slice(0, 300)); } });
  const got = fs.readdirSync(tmp).find((n) => n.endsWith(".jpeg"));
  fs.renameSync(path.join(tmp, got), path.join(outDir, `f${f}.jpg`)); fs.rmSync(tmp, { recursive: true });
  console.log("frame", f, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
await browser.close({ silent: true });
