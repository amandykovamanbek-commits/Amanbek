// node tools/stills.mjs <outdir> <frame> [frame...]  -> renders PNG stills with a single bundle
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'remotion');
const [out, ...frames] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'GTA6', browserExecutable});
for (const fr of frames.map(Number)) {
  await renderStill({serveUrl, composition, frame: fr, output: path.join(out, `f${String(fr).padStart(5, '0')}.png`), browserExecutable, scale: 0.5});
  process.stdout.write(fr + ' ');
}
console.log('\ndone, total frames', composition.durationInFrames);
