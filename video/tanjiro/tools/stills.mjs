// node tools/stills.mjs <frames comma list> <outdir> [composition]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
const [frames, out, comp = "Main"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const composition = await selectComposition({ serveUrl, id: comp, browserExecutable });
for (const f of frames.split(",").map(Number)) {
  await renderStill({ composition, serveUrl, output: path.join(out, `f${String(f).padStart(5, "0")}.jpg`), frame: f, imageFormat: "jpeg", jpegQuality: 80, browserExecutable, scale: 0.5, chromiumOptions: { gl: "swangle" } });
}
console.log("done", frames.split(",").length);
