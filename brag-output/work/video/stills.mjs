import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const frames = process.argv.slice(2).map(Number);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'Brag', browserExecutable });
for (const frame of frames) {
  await renderStill({ composition, serveUrl, frame, output: `../stills/f${String(frame).padStart(4, '0')}.png`, browserExecutable, scale: 0.5 });
  console.log('still', frame);
}
